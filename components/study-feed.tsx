"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  LoaderCircle,
  AlertTriangle,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import type { Course } from "@/app/derslik-client";
import { useStudyFeed } from "@/hooks/use-study-feed";
import { StudyFeedCard } from "@/components/study-feed-card";
import { StudyFeedEmpty } from "@/components/study-feed-empty";
import { StudyFeedSummary } from "@/components/study-feed-summary";
import { UretPaneli } from "@/components/study-feed-yz";

interface StudyFeedProps {
  userId: string;
  courses: Course[];
  initialCourseId?: string | null;
  onGoToReview?: () => void;
  onGoToCourses?: () => void;
}

export function StudyFeed({
  userId,
  courses,
  initialCourseId,
  onGoToReview,
  onGoToCourses,
}: StudyFeedProps) {
  const {
    mode,
    setMode,
    selectedCourseId,
    setSelectedCourseId,
    cards,
    activeCard,
    currentIndex,
    isLoading,
    error,
    isCompleted,
    isAnswerRevealed,
    setIsAnswerRevealed,
    userResponse,
    setUserResponse,
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
  } = useStudyFeed(userId, initialCourseId);

  const [uretAcik, setUretAcik] = useState(false);

  // TikTok tarzı: yerel scroll-snap; kaydırma bitince indeks kart durumuyla eşitlenir.
  const akisRef = useRef<HTMLDivElement | null>(null);
  const sonKaydirma = useRef(0);
  const kaydirildi = useCallback(() => {
    const el = akisRef.current;
    sonKaydirma.current = Date.now();
    if (!el || el.clientHeight === 0 || isSubmitting || submitError) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== currentIndex && i >= 0 && i < cards.length) goToCard(i);
  }, [currentIndex, cards.length, isSubmitting, submitError, goToCard]);
  useEffect(() => {
    const el = akisRef.current;
    if (!el || el.clientHeight === 0) return;
    // Kullanıcı kaydırırken geri çekme; yalnız klavye/düğme ile değişen indekste kaydır.
    if (Date.now() - sonKaydirma.current < 400) return;
    if (Math.round(el.scrollTop / el.clientHeight) !== currentIndex) el.scrollTo({ top: currentIndex * el.clientHeight, behavior: "smooth" });
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "SELECT" || target.tagName === "BUTTON" || target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (isLoading || isCompleted || isSubmitting || submitError) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextCard();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        prevCard();
      } else if (mode === "practice" && isAnswerRevealed && !isSubmitting) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          submitAnswer("incorrect");
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          submitAnswer("correct");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswerRevealed, isSubmitting, isLoading, isCompleted, submitError, mode, nextCard, prevCard, submitAnswer]);

  const totalInSession = cards.length;
  const progressPercent =
    totalInSession > 0 ? Math.round(((currentIndex + 1) / totalInSession) * 100) : 0;

  return (
    <div className="sf flex flex-col h-[calc(100dvh-172px)] md:h-[calc(100dvh-140px)] min-h-[540px] mx-auto w-full select-none overflow-x-hidden">
      {/* Sade üst çubuk: ders süzgeci, sayaç, yenile */}
      <header className="flex items-center justify-between gap-3 pb-2 shrink-0">
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            value={selectedCourseId ?? ""}
            onChange={(e) => setSelectedCourseId(e.target.value || null)}
            aria-label="Ders Filtresi"
            disabled={isSubmitting || Boolean(submitError)}
            className="min-h-[40px] w-full max-w-full appearance-none rounded-full border border-stone-200 bg-white/90 px-4 py-1.5 pr-9 text-sm font-semibold text-stone-800 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
          >
            <option value="">Tüm dersler</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} — {course.title}
              </option>
            ))}
          </select>
          <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Soru üret"
            onClick={() => setUretAcik(true)}
            className="sf-uret-dugme sf-uret-ikon"
          >
            <Sparkles className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Çalışma asistanını aç"
            onClick={() => window.dispatchEvent(new CustomEvent("study-chat-open"))}
            className="grid h-10 w-10 place-items-center rounded-full text-stone-500 hover:bg-stone-100 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        </div>
      </header>

      {totalInSession > 1 && !isCompleted && (
        <div className="sf-cubuk" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      {/* Main Study Viewport */}
      <main
        className="flex-1 relative flex flex-col justify-center items-center min-h-0"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-stone-500">
            <LoaderCircle className="h-8 w-8 animate-spin text-stone-700" />
            <p className="text-xs font-medium">Akış hazırlanıyor...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center max-w-md">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <p className="text-sm font-semibold text-red-900">{error}</p>
            <button
              type="button"
              disabled={isSubmitting || Boolean(submitError)}
              onClick={refreshFeed}
              className="mt-2 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Tekrar Dene</span>
            </button>
          </div>
        ) : cards.length === 0 ? (
          <StudyFeedEmpty
            onRefresh={refreshFeed}
            onGoToCourses={onGoToCourses}
            selectedCourseId={selectedCourseId}
          />
        ) : isCompleted ? (
          <StudyFeedSummary
            mode={mode}
            results={sessionResults}
            totalCards={cards.length}
            onRestart={restartSession}
            onGoToReview={onGoToReview}
            onReviewWrongCards={reviewWrongCards}
          />
        ) : activeCard ? (
          <div ref={akisRef} onScroll={kaydirildi} className="sf-akis">
            {cards.map((c, i) => (
              <section key={c.id} className="sf-slayt" aria-hidden={i !== currentIndex}>
                {i === currentIndex && (
                  <StudyFeedCard
                    card={c}
                    havuz={cards}
                    mode={mode}
                    isAnswerRevealed={isAnswerRevealed}
                    onRevealAnswer={() => setIsAnswerRevealed(true)}
                    userResponse={userResponse}
                    onUserResponseChange={setUserResponse}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                    onTogglePreference={togglePreference}
                    onSubmitAnswer={submitAnswer}
                    onRetry={retryPendingEvent}
                    onSwitchMode={(newMode) => setMode(newMode)}
                    onUretildi={refreshFeed}
                  />
                )}
              </section>
            ))}
          </div>
        ) : null}
      </main>

      {uretAcik && (
        <UretPaneli
          courses={courses}
          courseId={selectedCourseId}
          onKapat={() => setUretAcik(false)}
          onUretildi={() => { refreshFeed(); }}
        />
      )}

      {/* Visible Navigation Footnotes & Next / Prev Buttons */}
      {cards.length > 0 && !isCompleted && (
        <footer className="hidden sm:flex items-center justify-between gap-3 pt-2 border-t border-stone-200 shrink-0">
          <div className="text-[11px] text-stone-500 hidden sm:block">
            İpucu: <kbd className="px-1 py-0.5 rounded bg-stone-100 border text-[10px]">↑</kbd>{" "}
            <kbd className="px-1 py-0.5 rounded bg-stone-100 border text-[10px]">↓</kbd> yön tuşları veya kaydırma ile kartlar arasında geçiş yapabilirsiniz.
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={isLoading || currentIndex === 0 || isSubmitting || Boolean(submitError)}
              onClick={prevCard}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronUp className="h-4 w-4" />
              <span>Önceki kart</span>
            </button>

            <button
              type="button"
              disabled={isLoading || isSubmitting || Boolean(submitError)}
              onClick={nextCard}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              <span>Sonraki kart</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
