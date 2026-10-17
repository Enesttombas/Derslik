import { z } from "zod";

// --- Schema Definitions ---

const trimmedEventId = z
  .string()
  .trim()
  .min(1, { message: "eventId cannot be empty" })
  .max(128, { message: "eventId cannot exceed 128 characters" });

const trimmedCardId = z
  .string()
  .trim()
  .min(1, { message: "cardId cannot be empty" })
  .max(256, { message: "cardId cannot exceed 256 characters" });

export const viewFeedEventSchema = z
  .object({
    eventId: trimmedEventId,
    cardId: trimmedCardId,
    kind: z.literal("view"),
    mode: z.enum(["learn", "practice"]),
    durationMs: z.number().int().min(0).max(1800000),
  })
  .strict();

export const preferenceFeedEventSchema = z
  .object({
    eventId: trimmedEventId,
    cardId: trimmedCardId,
    kind: z.literal("preference"),
    mode: z.enum(["learn", "practice"]),
    preference: z.enum(["like", "dislike"]).nullable(),
  })
  .strict();

export const answerFeedEventSchema = z
  .object({
    eventId: trimmedEventId,
    cardId: trimmedCardId,
    kind: z.literal("answer"),
    mode: z.literal("practice"),
    outcome: z.enum(["correct", "incorrect"]),
    userResponse: z.string().max(10000).optional(),
  })
  .strict();

export const feedEventSchema = z.discriminatedUnion("kind", [
  viewFeedEventSchema,
  preferenceFeedEventSchema,
  answerFeedEventSchema,
]);

// --- Types ---

export type ViewFeedEvent = z.infer<typeof viewFeedEventSchema>;
export type PreferenceFeedEvent = z.infer<typeof preferenceFeedEventSchema>;
export type AnswerFeedEvent = z.infer<typeof answerFeedEventSchema>;
export type FeedEvent = z.infer<typeof feedEventSchema>;

export type FeedEventKind = FeedEvent["kind"];
export type FeedMode = "learn" | "practice";
export type FeedPreference = "like" | "dislike" | null;
export type FeedOutcome = "correct" | "incorrect";

export interface RankFeedScoreInput {
  due: boolean;
  preference: FeedPreference;
  incorrect: number;
  correct: number;
  seen: number;
}

export interface FeedCard {
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
  kind: "question" | "flashcard";
  nextReviewAt: string;
  preference: FeedPreference;
  recommendationReason: string;
  score: number;
  seenCount?: number;
  correctCount?: number;
  incorrectCount?: number;
}

export interface FeedStats {
  views: number;
  answers: number;
  correct: number;
  incorrect: number;
  likes: number;
  dislikes: number;
}

export interface FeedResponse {
  cards: FeedCard[];
  stats: FeedStats;
}

export interface FeedEventResponse {
  eventId: string;
  duplicate: boolean;
  stats?: FeedStats;
}

// --- Canonical JSON Helper ---

export function canonicalJson(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJson).join(",") + "]";
  }
  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(record[k])).join(",") +
    "}"
  );
}

// --- Deterministic Ranking ---

export function rankFeedScore(input: RankFeedScoreInput): number {
  const due = Boolean(input?.due);
  const pref = input?.preference;
  const rawIncorrect = Number(input?.incorrect);
  const rawCorrect = Number(input?.correct);
  const rawSeen = Number(input?.seen);

  const incorrect = Math.max(0, Number.isFinite(rawIncorrect) ? rawIncorrect : 0);
  const correct = Math.max(0, Number.isFinite(rawCorrect) ? rawCorrect : 0);
  const seen = Math.max(0, Number.isFinite(rawSeen) ? rawSeen : 0);
  const totalAnswers = incorrect + correct;

  let score = 0;

  // Due boost (40) dominates preference influence (max +/- 6)
  if (due) {
    score += 40;
  }

  // Weakness / wrongRate influence (up to 32 + 8 for failure priority)
  if (totalAnswers > 0) {
    const wrongRate = incorrect / totalAnswers;
    score += wrongRate * 32;
    if (incorrect > correct) {
      score += 8; // Last failure / struggle high priority
    } else if (correct > incorrect) {
      score -= 4; // Recent success lower priority
    }
  } else if (seen === 0) {
    // Unseen exploration boost
    score += 8;
  }

  // Preference influence (+/- 6)
  if (pref === "like") {
    score += 6;
  } else if (pref === "dislike") {
    score -= 6;
  }

  // Damping for cards seen multiple times
  score -= Math.min(seen, 5);

  return Number(score.toFixed(4));
}

// --- Recommendation Reason ---

export function getRecommendationReason(input: RankFeedScoreInput): string {
  if (input.due) {
    return "Tekrar zamanı";
  }
  const total = (input.incorrect || 0) + (input.correct || 0);
  if (input.incorrect > 0 && input.incorrect >= input.correct) {
    return "Zorlandığın kart";
  }
  if (input.seen === 0 && total === 0) {
    return "Yeni kart";
  }
  if (input.preference === "like") {
    return "Beğendiğin kart";
  }
  if (input.incorrect > 0) {
    return "Pekiştirme";
  }
  if (input.correct > 0) {
    return "Öğrenilen kart";
  }
  return "Önerilen kart";
}

// --- Sorting & Unseen Interleaving ---

export function sortFeedCards<T extends { id: string; score: number; seen: number }>(
  cards: T[]
): T[] {
  // Sort deterministically: score descending, tie broken by id ascending
  const list = [...cards].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.id.localeCompare(b.id);
  });

  if (list.length <= 5) {
    return list;
  }

  // Include a little unseen exploration every ~5 cards if available:
  // For each window of 5 cards (e.g. at slot 4, 9, 14, ...), if the window has no unseen card (seen === 0),
  // pull the first available unseen card from further down into that slot.
  for (let slot = 4; slot < list.length; slot += 5) {
    const windowStart = slot - 4;
    const hasUnseenInWindow = list.slice(windowStart, slot + 1).some((c) => c.seen === 0);
    if (!hasUnseenInWindow) {
      const nextUnseenIdx = list.findIndex((c, idx) => idx > slot && c.seen === 0);
      if (nextUnseenIdx !== -1) {
        const [unseenCard] = list.splice(nextUnseenIdx, 1);
        list.splice(slot, 0, unseenCard);
      }
    }
  }

  return list;
}
