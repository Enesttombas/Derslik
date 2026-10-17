import test from "node:test";
import assert from "node:assert/strict";
import {
  feedEventSchema,
  rankFeedScore,
  getRecommendationReason,
  sortFeedCards,
  canonicalJson,
  type RankFeedScoreInput,
// @ts-expect-error Node requires .ts extension under --experimental-strip-types
} from "./study-feed.ts";

test("feedEventSchema validates valid view event", () => {
  const result = feedEventSchema.safeParse({
    eventId: "evt-123",
    cardId: "card-456",
    kind: "view",
    mode: "learn",
    durationMs: 4500,
  });
  assert.equal(result.success, true);
});

test("feedEventSchema validates valid preference event with like, dislike, and null", () => {
  for (const pref of ["like", "dislike", null] as const) {
    const res = feedEventSchema.safeParse({
      eventId: "evt-pref",
      cardId: "card-1",
      kind: "preference",
      mode: "practice",
      preference: pref,
    });
    assert.equal(res.success, true);
  }
});

test("feedEventSchema validates valid answer event in practice mode", () => {
  const res = feedEventSchema.safeParse({
    eventId: "evt-ans",
    cardId: "card-2",
    kind: "answer",
    mode: "practice",
    outcome: "correct",
    userResponse: "hello world",
  });
  assert.equal(res.success, true);
});

test("feedEventSchema rejects answer event in learn mode", () => {
  const res = feedEventSchema.safeParse({
    eventId: "evt-ans",
    cardId: "card-2",
    kind: "answer",
    mode: "learn",
    outcome: "correct",
  });
  assert.equal(res.success, false);
});

test("feedEventSchema rejects unknown fields and client userId", () => {
  const withUserId = feedEventSchema.safeParse({
    eventId: "evt-1",
    cardId: "card-1",
    kind: "view",
    mode: "learn",
    durationMs: 1000,
    userId: "attacker",
  });
  assert.equal(withUserId.success, false);

  const withExtra = feedEventSchema.safeParse({
    eventId: "evt-1",
    cardId: "card-1",
    kind: "view",
    mode: "learn",
    durationMs: 1000,
    unknownField: "foo",
  });
  assert.equal(withExtra.success, false);
});

test("feedEventSchema rejects outcome smuggling in preference events", () => {
  const smuggled = feedEventSchema.safeParse({
    eventId: "evt-pref",
    cardId: "card-1",
    kind: "preference",
    mode: "learn",
    preference: "like",
    outcome: "correct",
  });
  assert.equal(smuggled.success, false);
});

test("feedEventSchema rejects blank or empty IDs", () => {
  for (const blank of ["", "   ", "\t\n  "]) {
    assert.equal(
      feedEventSchema.safeParse({
        eventId: blank,
        cardId: "card-1",
        kind: "view",
        mode: "learn",
        durationMs: 100,
      }).success,
      false
    );
    assert.equal(
      feedEventSchema.safeParse({
        eventId: "evt-1",
        cardId: blank,
        kind: "view",
        mode: "learn",
        durationMs: 100,
      }).success,
      false
    );
  }
});

test("feedEventSchema rejects durationMs with NaN, Infinity, negative or > 1800000", () => {
  for (const bad of [NaN, Infinity, -1, 1800001, 2.5]) {
    assert.equal(
      feedEventSchema.safeParse({
        eventId: "evt-1",
        cardId: "card-1",
        kind: "view",
        mode: "learn",
        durationMs: bad,
      }).success,
      false
    );
  }
});

test("feedEventSchema rejects ID exceeding character limit", () => {
  const long129 = "a".repeat(129);
  assert.equal(
    feedEventSchema.safeParse({
      eventId: long129,
      cardId: "card-1",
      kind: "view",
      mode: "learn",
      durationMs: 100,
    }).success,
    false
  );
});

test("rankFeedScore: due boost exceeds preference influence", () => {
  const dueDisliked: RankFeedScoreInput = Object.freeze({
    due: true,
    preference: "dislike",
    incorrect: 0,
    correct: 0,
    seen: 0,
  });
  const notDueLiked: RankFeedScoreInput = Object.freeze({
    due: false,
    preference: "like",
    incorrect: 0,
    correct: 0,
    seen: 0,
  });

  const scoreDueDisliked = rankFeedScore(dueDisliked);
  const scoreNotDueLiked = rankFeedScore(notDueLiked);

  assert.ok(
    scoreDueDisliked > scoreNotDueLiked,
    `Due disliked (${scoreDueDisliked}) should rank higher than not-due liked (${scoreNotDueLiked})`
  );
});

test("rankFeedScore: weakness exceeds dislike penalty and never hides weak cards", () => {
  const weakDisliked: RankFeedScoreInput = Object.freeze({
    due: false,
    preference: "dislike",
    incorrect: 5,
    correct: 0,
    seen: 2,
  });
  const neutralMastered: RankFeedScoreInput = Object.freeze({
    due: false,
    preference: null,
    incorrect: 0,
    correct: 5,
    seen: 5,
  });

  const scoreWeakDisliked = rankFeedScore(weakDisliked);
  const scoreNeutralMastered = rankFeedScore(neutralMastered);

  assert.ok(
    scoreWeakDisliked > scoreNeutralMastered,
    `Weak disliked (${scoreWeakDisliked}) should rank higher than neutral mastered (${scoreNeutralMastered})`
  );
});

test("rankFeedScore: deterministic and never mutates input", () => {
  const input: RankFeedScoreInput = Object.freeze({
    due: true,
    preference: "like",
    incorrect: 2,
    correct: 3,
    seen: 4,
  });

  const score1 = rankFeedScore(input);
  const score2 = rankFeedScore(input);
  assert.equal(score1, score2);
  assert.ok(Number.isFinite(score1));
});

test("sortFeedCards: deterministically breaks ties by ID and slots unseen exploration", () => {
  const cards = [
    { id: "card-c", score: 50, seen: 5 },
    { id: "card-a", score: 50, seen: 5 },
    { id: "card-b", score: 50, seen: 5 },
    { id: "card-d", score: 45, seen: 5 },
    { id: "card-e", score: 40, seen: 5 },
    { id: "card-unseen", score: 10, seen: 0 },
  ];

  const sorted = sortFeedCards(cards);
  // Ties broken by id: card-a, card-b, card-c
  assert.equal(sorted[0].id, "card-a");
  assert.equal(sorted[1].id, "card-b");
  assert.equal(sorted[2].id, "card-c");

  // Slot index 4 (5th position) should get the unseen exploration card
  assert.equal(sorted[4].id, "card-unseen");
});

test("canonicalJson: produces deterministic key ordering", () => {
  const a = { z: 1, a: 2, m: { y: 3, b: 4 } };
  const b = { a: 2, m: { b: 4, y: 3 }, z: 1 };
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(canonicalJson(a), '{"a":2,"m":{"b":4,"y":3},"z":1}');
});

test("getRecommendationReason: returns signal-derived descriptions", () => {
  assert.equal(
    getRecommendationReason({ due: true, preference: null, incorrect: 0, correct: 0, seen: 0 }),
    "Tekrar zamanı"
  );
  assert.equal(
    getRecommendationReason({ due: false, preference: null, incorrect: 3, correct: 1, seen: 4 }),
    "Zorlandığın kart"
  );
  assert.equal(
    getRecommendationReason({ due: false, preference: null, incorrect: 0, correct: 0, seen: 0 }),
    "Yeni kart"
  );
  assert.equal(
    getRecommendationReason({ due: false, preference: "like", incorrect: 0, correct: 0, seen: 2 }),
    "Beğendiğin kart"
  );
});
