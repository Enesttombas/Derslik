"use client";

import React, { useState } from "react";
import { Sparkles, BookOpen, Plus, LoaderCircle, ArrowRight } from "lucide-react";

interface CurriculumPoolItem {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  weeks: Array<{ week: number; title: string; total: number; imported: number }>;
  nextWeek: { week: number; title: string; total: number; imported: number } | null;
}

interface StudyFeedEmptyProps {
  onRefresh: () => void;
  onGoToCourses?: () => void;
  selectedCourseId?: string | null;
}

export function StudyFeedEmpty({
  onRefresh,
  onGoToCourses,
  selectedCourseId,
}: StudyFeedEmptyProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleStartWithCurriculum = async () => {
    setIsImporting(true);
    setImportMessage(null);

    try {
      // 1. Fetch available curriculum
      const res = await fetch("/api/curriculum");
      if (!res.ok) throw new Error("Müfredat listesi alınamadı.");
      const data = (await res.json()) as { pool: CurriculumPoolItem[] };

      if (!data.pool || data.pool.length === 0) {
        throw new Error("Kullanılabilir ders müfredatı bulunamadı.");
      }

      // Pick target course: either selected course or first course with available week
      let targetCourse = selectedCourseId
        ? data.pool.find((c) => c.courseId === selectedCourseId)
        : null;

      if (selectedCourseId && (!targetCourse || !targetCourse.nextWeek)) {
        throw new Error("Bu derste eklenebilecek hazır kart yok. Kendi kartını oluşturabilir veya Tüm Dersler filtresini seçebilirsin.");
      }
      if (!targetCourse || !targetCourse.nextWeek) {
        targetCourse = data.pool.find((c) => c.nextWeek !== null) ?? data.pool[0];
      }

      const weekToImport = targetCourse?.nextWeek?.week ?? 1;

      // 2. Import the first available week
      const importRes = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: targetCourse.courseId,
          week: weekToImport,
        }),
      });

      if (!importRes.ok) {
        throw new Error("Müfredat kartları eklenemedi.");
      }

      setImportMessage(`${targetCourse.courseTitle} — Hafta ${weekToImport} kartları eklendi!`);
      // 3. Reload feed with new cards
      setTimeout(() => {
        onRefresh();
      }, 600);
    } catch (err: unknown) {
      setImportMessage(err instanceof Error ? err.message : "Kartlar eklenirken bir hata oluştu.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex min-h-[420px] w-full max-w-xl mx-auto flex-col items-center justify-center p-6 text-center bg-white border border-stone-200 rounded-2xl shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4">
        <Sparkles className="h-7 w-7" />
      </div>

      <h3 className="text-lg font-bold text-stone-900 mb-2">
        Akışta Çalışma Kartı Yok
      </h3>

      <p className="text-sm text-stone-600 max-w-md leading-relaxed mb-6">
        Henüz çalışma kartın bulunmuyor. Mevcut ders notlarındaki hazır kartları ekleyerek başlayabilir veya dersin içinde kendi kartlarını oluşturabilirsin.
      </p>

      {importMessage && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 max-w-md">
          {importMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        <button
          type="button"
          disabled={isImporting}
          onClick={handleStartWithCurriculum}
          className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {isImporting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>Kartlar Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Hazır ders kartlarıyla başla</span>
            </>
          )}
        </button>

        {onGoToCourses && (
          <button
            type="button"
            onClick={onGoToCourses}
            className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Derslerime Git</span>
            <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
          </button>
        )}
      </div>
    </div>
  );
}
