"use client";

import React from "react";
import { CheckCircle2, RotateCcw, Brain, ArrowRight, Award, AlertTriangle } from "lucide-react";
import type { FeedCard, FeedMode } from "@/lib/study-feed";

interface SessionResults {
  total: number;
  correct: number;
  incorrect: number;
  wrongCards: FeedCard[];
}

interface StudyFeedSummaryProps {
  mode: FeedMode;
  results: SessionResults;
  totalCards: number;
  onRestart: () => void;
  onGoToReview?: () => void;
  onReviewWrongCards: () => void;
}

export function StudyFeedSummary({
  mode,
  results,
  totalCards,
  onRestart,
  onGoToReview,
  onReviewWrongCards,
}: StudyFeedSummaryProps) {
  const isPractice = mode === "practice";
  const percentage = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;

  // Group weak cards by course code/title
  const weakByCourse = results.wrongCards.reduce<Record<string, number>>((acc, card) => {
    const key = card.courseTitle || card.courseCode;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const weakEntries = Object.entries(weakByCourse).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex min-h-[460px] w-full max-w-xl mx-auto flex-col items-center justify-center p-6 text-center bg-white border border-stone-200 rounded-2xl shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
        {isPractice ? <Award className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
      </div>

      <h3 className="text-xl font-bold text-stone-900 mb-1">
        {isPractice ? "Antrenman Oturumu Tamamlandı!" : "Öğrenme Akışı Tamamlandı!"}
      </h3>

      <p className="text-sm text-stone-500 mb-6">
        {isPractice
          ? "Bu oturumdaki kartları başarıyla değerlendirdin. Sonuçların aşağıda özetlendi:"
          : `Bu oturumdaki ${totalCards} kartı inceledin. Bilgilerini tazeledin.`}
      </p>

      {/* Practice Mode Detailed Metrics */}
      {isPractice && results.total > 0 && (
        <div className="w-full mb-6">
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="rounded-xl bg-stone-50 border border-stone-200/70 p-3">
              <span className="block text-[11px] font-semibold text-stone-500 uppercase">
                Toplam
              </span>
              <span className="text-xl font-bold text-stone-900">{results.total}</span>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/70 p-3">
              <span className="block text-[11px] font-semibold text-emerald-700 uppercase">
                Doğru
              </span>
              <span className="text-xl font-bold text-emerald-800">{results.correct}</span>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200/70 p-3">
              <span className="block text-[11px] font-semibold text-amber-700 uppercase">
                Tekrar
              </span>
              <span className="text-xl font-bold text-amber-800">{results.incorrect}</span>
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600 mb-4">
            Kendi değerlendirmene göre başarı oranı:{" "}
            <span className="font-bold text-stone-900">%{percentage}</span>
          </div>

          {/* Weak Topics / Courses List */}
          {weakEntries.length > 0 && (
            <div className="text-left rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Tekrar Gereken Konu & Dersler:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-700">
                {weakEntries.map(([course, count]) => (
                  <li key={course} className="flex justify-between items-center">
                    <span className="truncate pr-2 font-medium">{course}</span>
                    <span className="shrink-0 text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full text-[10px]">
                      {count} kart
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {isPractice && results.wrongCards.length > 0 && (
        <div className="w-full mb-5 text-left">
          <h4 className="text-sm font-semibold mb-2">Tekrar çalışılacak kartlar</h4>
          <ul className="space-y-2 text-sm text-stone-600">{results.wrongCards.map(card => <li key={card.id} className="break-words">{card.prompt}</li>)}</ul>
          <button type="button" onClick={onReviewWrongCards} className="min-h-[44px] mt-3 rounded-xl border border-amber-300 px-4 text-sm font-semibold">Zorlandığım kartları çalış</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Oturumu Yeniden Başlat</span>
        </button>

        {isPractice && onGoToReview && (
          <button
            type="button"
            onClick={onGoToReview}
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition-colors"
          >
            <Brain className="h-4 w-4 text-amber-600" />
            <span>Tekrar Yap</span>
            <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
          </button>
        )}
      </div>
    </div>
  );
}
