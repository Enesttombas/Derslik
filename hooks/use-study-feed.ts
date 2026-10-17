"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FeedCard,
  FeedEvent,
  FeedEventResponse,
  FeedMode,
  FeedPreference,
  FeedStats,
} from "@/lib/study-feed";

interface SessionResults {
  total: number;
  correct: number;
  incorrect: number;
  wrongCards: FeedCard[];
}

interface TrackingState {
  cardId: string;
  mode: FeedMode;
  startedAt: number | null;
  accumulatedMs: number;
}

export function useStudyFeed(_userId: string, initialCourseId?: string | null) {
  const [mode, setMode] = useState<FeedMode>("practice");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    initialCourseId ?? null
  );
  const [sessionLimit, setSessionLimit] = useState<number | "all">(20);

  const [allCards, setAllCards] = useState<FeedCard[]>([]);
  const [sessionCards, setSessionCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<FeedStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const [userResponse, setUserResponse] = useState("");
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const busyRef = useRef(false);
  const pendingEventRef = useRef<FeedEvent | null>(null);
  const repeatedCardIdsRef = useRef<Set<string>>(new Set());
  const trackingRef = useRef<TrackingState | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);

  const [sessionResults, setSessionResults] = useState<SessionResults>({
    total: 0,
    correct: 0,
    incorrect: 0,
    wrongCards: [],
  });

  const flushView = useCallback(() => {
    const t = trackingRef.current;
    if (!t) return;
    trackingRef.current = null;

    let total = t.accumulatedMs;
    if (t.startedAt !== null) {
      total += performance.now() - t.startedAt;
    }
    const durationMs = Math.min(1800000, Math.max(0, Math.round(total)));
    if (durationMs < 400) return;

    const viewEvent: FeedEvent = {
      eventId: crypto.randomUUID(),
      cardId: t.cardId,
      kind: "view",
      mode: t.mode,
      durationMs,
    };

    try {
      fetch("/api/feed/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viewEvent),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Best-effort send
    }
  }, []);

  const startTracking = useCallback(
    (cardId: string, currentMode: FeedMode) => {
      flushView();
      const isHidden = typeof document !== "undefined" && document.hidden;
      trackingRef.current = {
        cardId,
        mode: currentMode,
        startedAt: isHidden ? null : performance.now(),
        accumulatedMs: 0,
      };
    },
    [flushView]
  );

  useEffect(() => {
    const handleVisibility = () => {
      const t = trackingRef.current;
      if (!t) return;
      if (document.hidden) {
        if (t.startedAt !== null) {
          t.accumulatedMs += performance.now() - t.startedAt;
          t.startedAt = null;
        }
      } else if (t.startedAt === null) {
        t.startedAt = performance.now();
      }
    };

    const handlePageHide = () => {
      flushView();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      flushView();
    };
  }, [flushView]);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function performFetch() {
      try {
        const params = new URLSearchParams();
        params.set("mode", mode);
        if (selectedCourseId) {
          params.set("courseId", selectedCourseId);
        }

        const res = await fetch(`/api/feed?${params.toString()}`, {
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok) {
          throw new Error("Akış kartları yüklenemedi.");
        }

        const data = (await res.json()) as { cards: FeedCard[]; stats: FeedStats };
        if (ignore || controller.signal.aborted) return;

        setAllCards(data.cards);
        setStats(data.stats);

        const finiteLimit =
          sessionLimit === "all"
            ? Math.min(data.cards.length, 60)
            : Math.min(sessionLimit, 60);
        const initialCards = data.cards.slice(0, finiteLimit);

        setSessionCards(initialCards);
        setCurrentIndex(0);
        setIsCompleted(initialCards.length === 0);
        setIsAnswerRevealed(false);
        setUserResponse("");
        setSubmitError(null);
        pendingEventRef.current = null;
        repeatedCardIdsRef.current.clear();
        setSessionResults({ total: 0, correct: 0, incorrect: 0, wrongCards: [] });

        if (initialCards.length > 0) {
          startTracking(initialCards[0].id, mode);
        } else {
          flushView();
        }
      } catch (err: unknown) {
        if (ignore || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError(err instanceof Error ? err.message : "Akış yüklenemedi.");
      } finally {
        if (!ignore && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    performFetch();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [mode, reloadCounter, selectedCourseId, sessionLimit, startTracking, flushView]);

  const handleSetMode = useCallback(
    (newMode: FeedMode) => {
      if (newMode === mode) return;
      if (busyRef.current || pendingEventRef.current !== null) return;
      flushView();
      setIsLoading(true);
      setError(null);
      setSubmitError(null);
      setIsAnswerRevealed(false);
      setUserResponse("");
      setMode(newMode);
    },
    [flushView, mode]
  );

  const handleSetSelectedCourseId = useCallback(
    (courseId: string | null) => {
      if (courseId === selectedCourseId) return;
      if (busyRef.current || pendingEventRef.current !== null) return;
      flushView();
      setIsLoading(true);
      setError(null);
      setSubmitError(null);
      setIsAnswerRevealed(false);
      setUserResponse("");
      setSelectedCourseId(courseId);
    },
    [flushView, selectedCourseId]
  );

  const handleSetSessionLimit = useCallback(
    (limit: number | "all") => {
      if (limit === sessionLimit) return;
      if (busyRef.current || pendingEventRef.current !== null) return;
      flushView();
      setIsLoading(true);
      setError(null);
      setSubmitError(null);
      setIsAnswerRevealed(false);
      setUserResponse("");
      setSessionLimit(limit);
    },
    [flushView, sessionLimit]
  );

  const refreshFeed = useCallback(() => {
    if (busyRef.current || pendingEventRef.current !== null) return;
    flushView();
    setIsLoading(true);
    setError(null);
    setSubmitError(null);
    setIsAnswerRevealed(false);
    setUserResponse("");
    setReloadCounter((c) => c + 1);
  }, [flushView]);

  const goToCard = useCallback(
    (nextIdx: number) => {
      if (busyRef.current || pendingEventRef.current !== null || nextIdx < 0) return;

      flushView();

      if (nextIdx >= sessionCards.length) {
        setIsCompleted(true);
        return;
      }

      setCurrentIndex(nextIdx);
      setIsAnswerRevealed(false);
      setUserResponse("");
      setSubmitError(null);

      const nextCard = sessionCards[nextIdx];
      if (nextCard) {
        startTracking(nextCard.id, mode);
      }
    },
    [flushView, mode, sessionCards, startTracking]
  );

  const nextCard = useCallback(() => {
    goToCard(currentIndex + 1);
  }, [currentIndex, goToCard]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1);
    }
  }, [currentIndex, goToCard]);

  const executeEvent = useCallback(
    async (event: FeedEvent) => {
      busyRef.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const res = await fetch("/api/feed/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event),
        });

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(
            errData.error ||
              (event.kind === "preference"
                ? "Tercih kaydedilemedi. Lütfen tekrar deneyin."
                : "Cevap kaydedilemedi. Lütfen tekrar deneyin.")
          );
        }

        const resData = (await res.json().catch(() => ({}))) as FeedEventResponse;
        if (resData.stats) {
          setStats(resData.stats);
        }

        if (event.kind === "preference") {
          const nextPref = event.preference;
          const oldPref = sessionCards.find((c) => c.id === event.cardId)?.preference ?? null;
          if (!resData.stats) {
            setStats((prev) => prev ? {
              ...prev,
              likes: prev.likes + Number(nextPref === "like") - Number(oldPref === "like"),
              dislikes: prev.dislikes + Number(nextPref === "dislike") - Number(oldPref === "dislike"),
            } : null);
          }
          setSessionCards((prev) =>
            prev.map((c) => (c.id === event.cardId ? { ...c, preference: nextPref } : c))
          );
          setAllCards((prev) =>
            prev.map((c) => (c.id === event.cardId ? { ...c, preference: nextPref } : c))
          );
          pendingEventRef.current = null;
        } else if (event.kind === "answer") {
          const activeCard =
            sessionCards[currentIndex] ??
            sessionCards.find((c) => c.id === event.cardId) ??
            allCards.find((c) => c.id === event.cardId);

          setSessionResults((prev) => {
            const isWrong = event.outcome === "incorrect";
            const wrongCards =
              isWrong && activeCard && !prev.wrongCards.some((c) => c.id === activeCard.id)
                ? [...prev.wrongCards, activeCard]
                : prev.wrongCards;
            return {
              total: prev.total + 1,
              correct: event.outcome === "correct" ? prev.correct + 1 : prev.correct,
              incorrect: isWrong ? prev.incorrect + 1 : prev.incorrect,
              wrongCards,
            };
          });

          if (!resData.stats) {
            setStats((prev) =>
              prev
                ? {
                    ...prev,
                    answers: prev.answers + 1,
                    correct: event.outcome === "correct" ? prev.correct + 1 : prev.correct,
                    incorrect:
                      event.outcome === "incorrect" ? prev.incorrect + 1 : prev.incorrect,
                  }
                : null
            );
          }

          let updatedCards = sessionCards;
          const remainingAfterCurrent = sessionCards.length - 1 - currentIndex;
          if (
            event.outcome === "incorrect" &&
            activeCard &&
            !repeatedCardIdsRef.current.has(activeCard.id) &&
            remainingAfterCurrent >= 3
          ) {
            repeatedCardIdsRef.current.add(activeCard.id);
            updatedCards = [...sessionCards];
            updatedCards.splice(currentIndex + 4, 0, { ...activeCard });
            setSessionCards(updatedCards);
          }

          pendingEventRef.current = null;
          flushView();

          const nextIdx = currentIndex + 1;
          if (nextIdx >= updatedCards.length) {
            setIsCompleted(true);
            setIsAnswerRevealed(false);
            setUserResponse("");
          } else {
            setCurrentIndex(nextIdx);
            setIsAnswerRevealed(false);
            setUserResponse("");
            startTracking(updatedCards[nextIdx].id, mode);
          }
        }
      } catch (err: unknown) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : event.kind === "preference"
            ? "Tercih kaydedilemedi. Lütfen tekrar deneyin."
            : "Cevap kaydedilemedi. Lütfen tekrar deneyin."
        );
      } finally {
        busyRef.current = false;
        setIsSubmitting(false);
      }
    },
    [allCards, currentIndex, flushView, mode, sessionCards, startTracking]
  );

  const togglePreference = useCallback(
    async (preferenceType: "like" | "dislike") => {
      if (busyRef.current || pendingEventRef.current !== null) return;
      const activeCard = sessionCards[currentIndex];
      if (!activeCard) return;

      const nextPreference: FeedPreference =
        activeCard.preference === preferenceType ? null : preferenceType;

      const event: FeedEvent = {
        eventId: crypto.randomUUID(),
        cardId: activeCard.id,
        kind: "preference",
        mode,
        preference: nextPreference,
      };

      pendingEventRef.current = event;
      await executeEvent(event);
    },
    [currentIndex, executeEvent, mode, sessionCards]
  );

  const submitAnswer = useCallback(
    async (outcome: "correct" | "incorrect") => {
      if (mode !== "practice" || !isAnswerRevealed || isCompleted) return;
      if (busyRef.current || pendingEventRef.current !== null) return;
      const activeCard = sessionCards[currentIndex];
      if (!activeCard) return;

      const event: FeedEvent = {
        eventId: crypto.randomUUID(),
        cardId: activeCard.id,
        kind: "answer",
        mode: "practice",
        outcome,
        userResponse: userResponse.trim() || undefined,
      };

      pendingEventRef.current = event;
      await executeEvent(event);
    },
    [currentIndex, executeEvent, isAnswerRevealed, isCompleted, mode, sessionCards, userResponse]
  );

  const retryPendingEvent = useCallback(async () => {
    if (busyRef.current || !pendingEventRef.current) return;
    await executeEvent(pendingEventRef.current);
  }, [executeEvent]);

  const restartSession = useCallback(() => {
    if (busyRef.current || pendingEventRef.current !== null) return;
    flushView();
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsAnswerRevealed(false);
    setUserResponse("");
    setSubmitError(null);
    repeatedCardIdsRef.current.clear();
    setSessionResults({ total: 0, correct: 0, incorrect: 0, wrongCards: [] });

    const finiteLimit =
      sessionLimit === "all"
        ? Math.min(allCards.length, 60)
        : Math.min(sessionLimit, 60);
    const cards = allCards.slice(0, finiteLimit);
    setSessionCards(cards);
    if (cards.length > 0) {
      startTracking(cards[0].id, mode);
    }
  }, [allCards, flushView, mode, sessionLimit, startTracking]);

  const reviewWrongCards = useCallback(() => {
    if (busyRef.current || pendingEventRef.current !== null) return;
    if (sessionResults.wrongCards.length === 0) return;

    flushView();
    const uniqueMap = new Map<string, FeedCard>();
    for (const card of sessionResults.wrongCards) {
      if (!uniqueMap.has(card.id)) {
        uniqueMap.set(card.id, card);
      }
    }
    const queue = Array.from(uniqueMap.values()).slice(0, 60);
    if (queue.length === 0) return;

    setSessionCards(queue);
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsAnswerRevealed(false);
    setUserResponse("");
    setSubmitError(null);
    repeatedCardIdsRef.current.clear();
    setSessionResults({ total: 0, correct: 0, incorrect: 0, wrongCards: [] });

    startTracking(queue[0].id, mode);
  }, [flushView, mode, sessionResults.wrongCards, startTracking]);

  const handleSetIsAnswerRevealed = useCallback(
    (revealed: boolean | ((prev: boolean) => boolean)) => {
      if (busyRef.current || pendingEventRef.current !== null) return;
      setIsAnswerRevealed(revealed);
    },
    []
  );

  const handleSetUserResponse = useCallback(
    (response: string | ((prev: string) => string)) => {
      if (busyRef.current || pendingEventRef.current !== null) return;
      if (typeof response === "string") {
        if (response.length > 10000) return;
        setUserResponse(response);
      } else {
        setUserResponse((prev) => {
          const next = response(prev);
          return next.length > 10000 ? prev : next;
        });
      }
    },
    []
  );

  return {
    mode,
    setMode: handleSetMode,
    selectedCourseId,
    setSelectedCourseId: handleSetSelectedCourseId,
    sessionLimit,
    setSessionLimit: handleSetSessionLimit,
    cards: sessionCards,
    activeCard: sessionCards[currentIndex] ?? null,
    currentIndex,
    stats,
    isLoading,
    error,
    isCompleted,
    isAnswerRevealed,
    setIsAnswerRevealed: handleSetIsAnswerRevealed,
    userResponse,
    setUserResponse: handleSetUserResponse,
    isSubmitting,
    submitError,
    sessionResults,
    nextCard,
    prevCard,
    goToCard,
    togglePreference,
    submitAnswer,
    retryPendingEvent,
    restartSession,
    reviewWrongCards,
    refreshFeed,
  };
}
