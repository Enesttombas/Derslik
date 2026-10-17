import { parseCurriculum, type CurriculumQuestion } from "./curriculum";

const noteFiles = import.meta.glob("../content/notes/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const noteByCode: Record<string, string> = {
  "EBLG215.1": "../content/notes/eblg215.md",
  "EBLG341.1": "../content/notes/eblg341.md",
  "EBLG351.1": "../content/notes/eblg351.md",
  "EBLG359.1": "../content/notes/eblg359.md",
  "EINS335.1": "../content/notes/eins335.md",
  "GET05011.1": "../content/notes/get05011.md",
};

const cache = new Map<string, CurriculumQuestion[]>();

export function curriculumFor(courseCode: string): CurriculumQuestion[] {
  const cached = cache.get(courseCode);
  if (cached) return cached;
  const markdown = noteFiles[noteByCode[courseCode] ?? ""];
  const questions = markdown ? parseCurriculum(courseCode, markdown) : [];
  cache.set(courseCode, questions);
  return questions;
}

// Curriculum cards get a deterministic per-user id so repeated imports never duplicate.
export const CURRICULUM_ID_PREFIX = "cur:";

export function curriculumCardId(key: string, userId: string): string {
  return `${CURRICULUM_ID_PREFIX}${key}:${userId}`;
}

export function curriculumKeyFromCardId(id: string): string | null {
  if (!id.startsWith(CURRICULUM_ID_PREFIX)) return null;
  const rest = id.slice(CURRICULUM_ID_PREFIX.length);
  const end = rest.indexOf(":");
  return end === -1 ? null : rest.slice(0, end);
}
