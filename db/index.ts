import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const INITIAL_COURSES = [
  { code: "EBLG215.1", title: "Sayısal Tasarım" },
  { code: "EBLG341.1", title: "İşletim Sistemleri" },
  { code: "EBLG351.1", title: "Görüntü İşleme" },
  { code: "EBLG359.1", title: "Algoritma Analizi" },
  { code: "EINS335.1", title: "Mesleki Sorumluluk ve Etik" },
  { code: "GET05011.1", title: "Kariyer Planlaması" },
] as const;

// Finansal Okuryazarlık was replaced by Kariyer Planlaması; existing users get the row renamed.
const REMOVED_COURSE_CODE = "GET05007.1";
const CAREER_COURSE = INITIAL_COURSES[INITIAL_COURSES.length - 1];

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export function getBucket(): R2Bucket {
  if (!env.BUCKET) {
    throw new Error(
      "Cloudflare R2 binding `BUCKET` is unavailable. Set the `r2` field in .openai/hosting.json to `BUCKET` or let your control plane inject the real binding values."
    );
  }
  return env.BUCKET;
}

export async function ensureSchema(userId: string) {
  if (!env.DB) return;

  // D1 tables are created by the versioned Drizzle migration in `drizzle/`.
  const existingCourses = await env.DB.prepare(
    "SELECT id FROM courses WHERE user_id = ? LIMIT 1"
  ).bind(userId).first();

  if (!existingCourses) {
    const statements = INITIAL_COURSES.map((course, idx) => {
      const courseId = `c_${course.code.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}_${Date.now()}_${idx}`;
      return env.DB!.prepare(
        "INSERT INTO courses (id, user_id, code, title) VALUES (?, ?, ?, ?)"
      ).bind(courseId, userId, course.code, course.title);
    });
    await env.DB.batch(statements);
    return;
  }

  const removed = await env.DB.prepare(
    "SELECT id FROM courses WHERE user_id = ? AND code = ? LIMIT 1"
  ).bind(userId, REMOVED_COURSE_CODE).first<{ id: string }>();
  if (removed) {
    // Imported finance curriculum cards no longer match any note; drop them with their reviews.
    await env.DB.batch([
      env.DB.prepare(
        "DELETE FROM review_events WHERE study_item_id IN (SELECT id FROM study_items WHERE course_id = ? AND id LIKE 'cur:%')"
      ).bind(removed.id),
      env.DB.prepare("DELETE FROM study_items WHERE course_id = ? AND id LIKE 'cur:%'").bind(removed.id),
      env.DB.prepare("UPDATE courses SET code = ?, title = ? WHERE id = ?")
        .bind(CAREER_COURSE.code, CAREER_COURSE.title, removed.id),
    ]);
  }
}
