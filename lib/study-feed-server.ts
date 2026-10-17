import { env } from "cloudflare:workers";
import {
  type FeedCard,
  type FeedEvent,
  type FeedStats,
  type RankFeedScoreInput,
  canonicalJson,
  getRecommendationReason,
  rankFeedScore,
  sortFeedCards,
} from "./study-feed";

const MAX_BODY_BYTES = 32 * 1024; // 32 KiB

/**
 * Fully consume a bounded request body stream up to maxBytes to avoid Miniflare stream bugs.
 */
export async function readBoundedBody(
  request: Request,
  maxBytes = MAX_BODY_BYTES
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, status: 400, error: "İstek gövdesi boş olamaz." };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  let oversized = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > maxBytes) {
          oversized = true;
          chunks.length = 0;
        } else if (!oversized) {
          chunks.push(value);
        }
      }
    }
  } catch {
    return { ok: false, status: 400, error: "İstek gövdesi okunamadı." };
  }

  if (oversized) {
    return { ok: false, status: 400, error: `İstek boyutu ${maxBytes} bayt sınırını aşıyor.` };
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return { ok: true, text: new TextDecoder().decode(merged) };
}

/**
 * Verify if courseId belongs to the user. Returns boolean.
 */
export async function verifyCourseOwnership(userId: string, courseId: string): Promise<boolean> {
  if (!env.DB) return false;
  const row = await env.DB.prepare(
    "SELECT id FROM courses WHERE id = ? AND user_id = ? LIMIT 1"
  )
    .bind(courseId, userId)
    .first<{ id: string }>();
  return Boolean(row);
}

/**
 * Aggregate stats across all feed events for the authenticated user (and optional course filter).
 */
export async function getFeedStats(userId: string, courseId?: string): Promise<FeedStats> {
  if (!env.DB) {
    return { views: 0, answers: 0, correct: 0, incorrect: 0, likes: 0, dislikes: 0 };
  }

  const whereClauses = ["user_id = ?"];
  const params: unknown[] = [userId];
  if (courseId) {
    whereClauses.push("course_id = ?");
    params.push(courseId);
  }
  const whereSql = whereClauses.join(" AND ");

  const countsStmt = env.DB.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN kind = 'view' THEN 1 ELSE 0 END), 0) as views,
      COALESCE(SUM(CASE WHEN kind = 'answer' THEN 1 ELSE 0 END), 0) as answers,
      COALESCE(SUM(CASE WHEN kind = 'answer' AND outcome = 'correct' THEN 1 ELSE 0 END), 0) as correct,
      COALESCE(SUM(CASE WHEN kind = 'answer' AND outcome = 'incorrect' THEN 1 ELSE 0 END), 0) as incorrect
    FROM feed_events
    WHERE ${whereSql}
  `).bind(...params);

  const prefStmt = env.DB.prepare(`
    WITH latest_prefs AS (
      SELECT
        preference,
        ROW_NUMBER() OVER (PARTITION BY card_id ORDER BY sequence DESC) as rn
      FROM feed_events
      WHERE ${whereSql} AND kind = 'preference'
    )
    SELECT
      COALESCE(SUM(CASE WHEN preference = 'like' THEN 1 ELSE 0 END), 0) as likes,
      COALESCE(SUM(CASE WHEN preference = 'dislike' THEN 1 ELSE 0 END), 0) as dislikes
    FROM latest_prefs
    WHERE rn = 1
  `).bind(...params);

  const [countsRes, prefsRes] = await env.DB.batch([countsStmt, prefStmt]);
  const c = countsRes.results?.[0] as
    | { views: number; answers: number; correct: number; incorrect: number }
    | undefined;
  const p = prefsRes.results?.[0] as { likes: number; dislikes: number } | undefined;

  return {
    views: Number(c?.views ?? 0),
    answers: Number(c?.answers ?? 0),
    correct: Number(c?.correct ?? 0),
    incorrect: Number(c?.incorrect ?? 0),
    likes: Number(p?.likes ?? 0),
    dislikes: Number(p?.dislikes ?? 0),
  };
}

/**
 * Fetch candidate study items owned by the user, rank them, and return top 60 cards.
 */
export async function getFeedCards(
  userId: string,
  courseId?: string
): Promise<FeedCard[]> {
  if (!env.DB) return [];

  const whereClauses = ["si.user_id = ?", "c.user_id = ?"];
  const params: unknown[] = [userId, userId];
  if (courseId) {
    whereClauses.push("si.course_id = ?");
    params.push(courseId);
  }
  const whereSql = whereClauses.join(" AND ");

  const query = `
    SELECT
      si.id,
      si.course_id as courseId,
      c.title as courseTitle,
      c.code as courseCode,
      si.unit_id as unitId,
      si.pdf_source_id as pdfSourceId,
      si.source_page as sourcePage,
      si.prompt,
      si.answer,
      si.hint,
      si.kind,
      si.next_review_at as nextReviewAt,
      (
        SELECT fe.preference
        FROM feed_events fe
        WHERE fe.user_id = si.user_id
          AND fe.card_id = si.id
          AND fe.kind = 'preference'
        ORDER BY fe.sequence DESC
        LIMIT 1
      ) as preference,
      (
        SELECT COUNT(*)
        FROM feed_events fe
        WHERE fe.user_id = si.user_id
          AND fe.card_id = si.id
          AND fe.kind = 'view'
      ) as seenCount,
      (
        SELECT COUNT(*)
        FROM feed_events fe
        WHERE fe.user_id = si.user_id
          AND fe.card_id = si.id
          AND fe.kind = 'answer'
          AND fe.outcome = 'correct'
      ) as correctCount,
      (
        SELECT COUNT(*)
        FROM feed_events fe
        WHERE fe.user_id = si.user_id
          AND fe.card_id = si.id
          AND fe.kind = 'answer'
          AND fe.outcome = 'incorrect'
      ) as incorrectCount
    FROM study_items si
    INNER JOIN courses c ON c.id = si.course_id AND c.user_id = si.user_id
    WHERE ${whereSql}
    ORDER BY
      CASE WHEN julianday(si.next_review_at) <= julianday('now') THEN 0 ELSE 1 END,
      julianday(si.next_review_at) ASC, si.id ASC
    LIMIT 200
  `;

  const { results } = await env.DB.prepare(query).bind(...params).all<{
    id: string;
    courseId: string;
    courseTitle: string;
    courseCode: string;
    unitId: string | null;
    pdfSourceId: string | null;
    sourcePage: number | null;
    prompt: string;
    answer: string;
    hint: string | null;
    kind: string;
    nextReviewAt: string;
    preference: string | null;
    seenCount: number;
    correctCount: number;
    incorrectCount: number;
  }>();

  if (!results || results.length === 0) {
    return [];
  }

  const nowIso = new Date().toISOString();

  const scoredCards: FeedCard[] = results.map((row) => {
    const isDue = Boolean(row.nextReviewAt && row.nextReviewAt <= nowIso);
    const pref =
      row.preference === "like" || row.preference === "dislike" ? row.preference : null;
    const incorrect = Number(row.incorrectCount || 0);
    const correct = Number(row.correctCount || 0);
    const seen = Number(row.seenCount || 0);

    const rankInput: RankFeedScoreInput = {
      due: isDue,
      preference: pref,
      incorrect,
      correct,
      seen,
    };

    const score = rankFeedScore(rankInput);
    const recommendationReason = getRecommendationReason(rankInput);

    return {
      id: row.id,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      courseCode: row.courseCode,
      unitId: row.unitId ?? null,
      pdfSourceId: row.pdfSourceId ?? null,
      sourcePage: typeof row.sourcePage === "number" ? row.sourcePage : null,
      prompt: row.prompt,
      answer: row.answer,
      hint: row.hint ?? null,
      kind: row.kind === "question" ? "question" : "flashcard",
      nextReviewAt: row.nextReviewAt,
      preference: pref,
      recommendationReason,
      score,
      seenCount: seen,
      correctCount: correct,
      incorrectCount: incorrect,
    };
  });

  const sorted = sortFeedCards(
    scoredCards.map((c) => ({
      ...c,
      seen: c.seenCount ?? 0,
    }))
  );

  return sorted.slice(0, 60);
}

/**
 * Resume missing review for an answer event if a previous review failed to record.
 */
async function resumeMissingReview(
  userId: string,
  courseId: string,
  event: Extract<FeedEvent, { kind: "answer" }>
): Promise<void> {
  if (!env.DB) return;
  const reviewId = `feed:${userId}:${event.eventId}`;
  const nowIso = new Date().toISOString();
  const rating = event.outcome === "correct" ? "good" : "again";
  const userResponse = event.userResponse ?? null;

  const updateCardStmt = env.DB.prepare(`
    UPDATE study_items
    SET
      interval_days = CASE
        WHEN ? = 'again' THEN 1
        WHEN repetition_count = 0 THEN 1
        WHEN repetition_count = 1 THEN 3
        ELSE CAST(MAX(1, ROUND(interval_days * ease_factor)) AS INTEGER)
      END,
      ease_factor = CASE
        WHEN ? = 'again' THEN MAX(1.3, ease_factor - 0.2)
        ELSE ease_factor
      END,
      repetition_count = CASE
        WHEN ? = 'again' THEN 0
        ELSE repetition_count + 1
      END,
      last_reviewed_at = ?,
      next_review_at = strftime('%Y-%m-%dT%H:%M:%fZ', ?, '+' || (
        CASE
          WHEN ? = 'again' THEN 1
          WHEN repetition_count = 0 THEN 1
          WHEN repetition_count = 1 THEN 3
          ELSE CAST(MAX(1, ROUND(interval_days * ease_factor)) AS INTEGER)
        END
      ) || ' days'),
      updated_at = ?
    WHERE id = ? AND user_id = ?
      AND NOT EXISTS (SELECT 1 FROM review_events WHERE id = ?)
  `).bind(
    rating,
    rating,
    rating,
    nowIso,
    nowIso,
    rating,
    nowIso,
    event.cardId,
    userId,
    reviewId
  );

  const insertReviewStmt = env.DB.prepare(`
    INSERT INTO review_events (
      id, study_item_id, course_id, user_id, rating, user_response, reviewed_at
    )
    SELECT ?, ?, ?, ?, ?, ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM review_events WHERE id = ?)
  `).bind(
    reviewId,
    event.cardId,
    courseId,
    userId,
    rating,
    userResponse,
    nowIso,
    reviewId
  );

  await env.DB.batch([updateCardStmt, insertReviewStmt]);
}

/**
 * Record a feed event with strict idempotency and review scheduling.
 */
export async function recordFeedEvent(
  userId: string,
  event: FeedEvent
): Promise<
  | { status: 200; data: { eventId: string; duplicate: boolean } }
  | { status: 400 | 404 | 409 | 500; error: string }
> {
  if (!env.DB) {
    return { status: 500, error: "Veritabanı bağlantısı kurulamadı." };
  }

  // 1. Verify card ownership and get verified courseId
  const card = await env.DB.prepare(
    "SELECT id, course_id FROM study_items WHERE id = ? AND user_id = ? LIMIT 1"
  )
    .bind(event.cardId, userId)
    .first<{ id: string; course_id: string }>();

  if (!card) {
    return { status: 404, error: "Çalışma kartı bulunamadı veya yetkiniz yok." };
  }

  const payloadString = canonicalJson(event);

  // 2. Check for existing event with (userId, eventId)
  const existing = await env.DB.prepare(
    "SELECT sequence, payload FROM feed_events WHERE user_id = ? AND event_id = ? LIMIT 1"
  )
    .bind(userId, event.eventId)
    .first<{ sequence: number; payload: string }>();

  if (existing) {
    if (existing.payload !== payloadString) {
      return { status: 409, error: "Aynı eventId farklı bir içerikle zaten kaydedilmiş." };
    }
    // Duplicate event with identical payload: resume missing review if answer, but do not double-record
    if (event.kind === "answer") {
      await resumeMissingReview(userId, card.course_id, event);
    }
    return { status: 200, data: { eventId: event.eventId, duplicate: true } };
  }

  // 3. New event: prepare insert statement
  const pref = event.kind === "preference" ? event.preference : null;
  const outcome = event.kind === "answer" ? event.outcome : null;
  const userResponse = event.kind === "answer" ? (event.userResponse ?? null) : null;
  const durationMs = event.kind === "view" ? event.durationMs : null;
  const nowIso = new Date().toISOString();

  const insertEventStmt = env.DB.prepare(`
    INSERT INTO feed_events (
      event_id, user_id, card_id, course_id, kind, mode,
      preference, outcome, user_response, duration_ms, payload, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    event.eventId,
    userId,
    event.cardId,
    card.course_id,
    event.kind,
    event.mode,
    pref,
    outcome,
    userResponse,
    durationMs,
    payloadString,
    nowIso
  );

  try {
    if (event.kind === "answer") {
      const rating = event.outcome === "correct" ? "good" : "again";
      const reviewId = `feed:${userId}:${event.eventId}`;

      const updateCardStmt = env.DB.prepare(`
        UPDATE study_items
        SET
          interval_days = CASE
            WHEN ? = 'again' THEN 1
            WHEN repetition_count = 0 THEN 1
            WHEN repetition_count = 1 THEN 3
            ELSE CAST(MAX(1, ROUND(interval_days * ease_factor)) AS INTEGER)
          END,
          ease_factor = CASE
            WHEN ? = 'again' THEN MAX(1.3, ease_factor - 0.2)
            ELSE ease_factor
          END,
          repetition_count = CASE
            WHEN ? = 'again' THEN 0
            ELSE repetition_count + 1
          END,
          last_reviewed_at = ?,
          next_review_at = strftime('%Y-%m-%dT%H:%M:%fZ', ?, '+' || (
            CASE
              WHEN ? = 'again' THEN 1
              WHEN repetition_count = 0 THEN 1
              WHEN repetition_count = 1 THEN 3
              ELSE CAST(MAX(1, ROUND(interval_days * ease_factor)) AS INTEGER)
            END
          ) || ' days'),
          updated_at = ?
        WHERE id = ? AND user_id = ?
          AND NOT EXISTS (SELECT 1 FROM review_events WHERE id = ?)
      `).bind(
        rating,
        rating,
        rating,
        nowIso,
        nowIso,
        rating,
        nowIso,
        event.cardId,
        userId,
        reviewId
      );

      const insertReviewStmt = env.DB.prepare(`
        INSERT INTO review_events (
          id, study_item_id, course_id, user_id, rating, user_response, reviewed_at
        )
        SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE NOT EXISTS (SELECT 1 FROM review_events WHERE id = ?)
      `).bind(
        reviewId,
        event.cardId,
        card.course_id,
        userId,
        rating,
        userResponse,
        nowIso,
        reviewId
      );

      await env.DB.batch([insertEventStmt, updateCardStmt, insertReviewStmt]);
    } else {
      await insertEventStmt.run();
    }
    return { status: 200, data: { eventId: event.eventId, duplicate: false } };
  } catch {
    // If a race condition occurred and the unique index was hit:
    const raced = await env.DB.prepare(
      "SELECT payload FROM feed_events WHERE user_id = ? AND event_id = ? LIMIT 1"
    )
      .bind(userId, event.eventId)
      .first<{ payload: string }>();

    if (raced) {
      if (raced.payload !== payloadString) {
        return { status: 409, error: "Aynı eventId farklı bir içerikle zaten kaydedilmiş." };
      }
      if (event.kind === "answer") {
        await resumeMissingReview(userId, card.course_id, event);
      }
      return { status: 200, data: { eventId: event.eventId, duplicate: true } };
    }

    return { status: 500, error: "Olay kaydedilemedi." };
  }
}
