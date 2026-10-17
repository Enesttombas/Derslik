"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { CardMarkdown } from "@/app/study-guide";

type ExamCard = { id: string; courseId: string; prompt: string; answer: string };

const MIN_CARDS = 5;
const MAX_QUESTIONS = 20;
const SECONDS_PER_QUESTION = 60;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clock(seconds: number) {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function ExamSimulator({ courseId, onClose }: { courseId?: string | null; onClose: () => void }) {
  const [questions, setQuestions] = useState<ExamCard[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState(0);
  const [finished, setFinished] = useState(false);
  const [scheduled, setScheduled] = useState<"idle" | "busy" | "done" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    const url = courseId ? `/api/cards?courseId=${encodeURIComponent(courseId)}` : "/api/cards";
    fetch(url)
      .then((res): Promise<{ cards?: ExamCard[] }> => {
        if (!res.ok) throw new Error("Kartlar alınamadı.");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const pool = data.cards ?? [];
        const picked = shuffle(pool).slice(0, MAX_QUESTIONS);
        setQuestions(picked);
        setRemaining(picked.length * SECONDS_PER_QUESTION);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Kartlar alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const running = questions !== null && questions.length >= MIN_CARDS && !finished;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = questions?.length ?? 0;
  const correct = useMemo(() => Object.values(marks).filter(Boolean).length, [marks]);
  const wrongCards = useMemo(
    () => (questions ?? []).filter((card) => marks[card.id] !== true),
    [questions, marks],
  );
  const initialSeconds = total * SECONDS_PER_QUESTION;

  const scheduleWrong = async () => {
    setScheduled("busy");
    try {
      const results = await Promise.all(
        wrongCards.map((card) =>
          fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studyItemId: card.id, rating: "again", userResponse: attempts[card.id] ?? null }),
          }),
        ),
      );
      setScheduled(results.every((res) => res.ok) ? "done" : "error");
    } catch {
      setScheduled("error");
    }
  };

  const current = questions?.[index];

  return (
    <div className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-stone-50" role="dialog" aria-label="Deneme sınavı">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-stone-900">Deneme sınavı</h2>
          <div className="flex items-center gap-3">
            {running && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-sm ${remaining < 60 ? "bg-red-50 text-red-700" : "bg-white text-stone-700 border border-stone-200"}`}>
                <Clock className="h-3.5 w-3.5" /> {clock(remaining)}
              </span>
            )}
            <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loadError && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>}
        {!loadError && questions === null && <p className="py-12 text-center text-sm text-stone-500">Sorular hazırlanıyor...</p>}
        {questions !== null && questions.length < MIN_CARDS && (
          <p className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
            Yeterli kart yok: deneme için en az {MIN_CARDS} kart gerekir, şu an {questions.length} var. Bir müfredat haftasını kuyruğuna ekleyip tekrar dene.
          </p>
        )}

        {running && current && (
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-medium text-stone-500">
              <span>Soru {index + 1} / {total}</span>
              <span>{Object.keys(marks).length} işaretlendi</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full bg-amber-500" style={{ width: `${((index + 1) / total) * 100}%` }} />
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-900">
              <CardMarkdown source={current.prompt} />
            </div>
            <textarea
              value={attempts[current.id] ?? ""}
              onChange={(event) => setAttempts((prev) => ({ ...prev, [current.id]: event.target.value }))}
              placeholder="Cevabını önce kendin yaz..."
              rows={4}
              className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-stone-300"
            />
            {!revealed[current.id] ? (
              <button type="button" onClick={() => setRevealed((prev) => ({ ...prev, [current.id]: true }))} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white">
                Cevabı göster
              </button>
            ) : (
              <>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm leading-relaxed text-stone-900">
                  <CardMarkdown source={current.answer} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMarks((prev) => ({ ...prev, [current.id]: true }))} className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold ${marks[current.id] === true ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-200 bg-white text-stone-700"}`}>
                    <Check className="h-4 w-4" /> Doğru
                  </button>
                  <button type="button" onClick={() => setMarks((prev) => ({ ...prev, [current.id]: false }))} className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-semibold ${marks[current.id] === false ? "border-red-600 bg-red-600 text-white" : "border-stone-200 bg-white text-stone-700"}`}>
                    <X className="h-4 w-4" /> Yanlış
                  </button>
                </div>
              </>
            )}
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              <button type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-40">
                Önceki
              </button>
              {index < total - 1 ? (
                <button type="button" onClick={() => setIndex((value) => value + 1)} className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700">
                  Sonraki
                </button>
              ) : (
                <button type="button" onClick={() => setFinished(true)} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
                  Sınavı bitir
                </button>
              )}
            </div>
          </div>
        )}

        {finished && questions !== null && questions.length >= MIN_CARDS && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center">
              <p className="text-3xl font-bold text-stone-900">{correct} / {total}</p>
              <p className="mt-1 text-sm text-stone-500">Geçen süre {clock(initialSeconds - remaining)} · işaretlenmeyenler yanlış sayıldı</p>
            </div>
            {wrongCards.length > 0 ? (
              <>
                <h3 className="text-sm font-bold text-stone-900">Yanlışlar ({wrongCards.length})</h3>
                <ul className="flex flex-col gap-2">
                  {wrongCards.map((card) => (
                    <li key={card.id} className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
                      <CardMarkdown source={card.prompt} />
                      <div className="mt-2 border-t border-stone-100 pt-2 text-stone-600"><CardMarkdown source={card.answer} /></div>
                    </li>
                  ))}
                </ul>
                <button type="button" disabled={scheduled === "busy" || scheduled === "done"} onClick={scheduleWrong} className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {scheduled === "done" ? "Yanlışlar yarına planlandı" : scheduled === "busy" ? "Planlanıyor..." : "Yanlışları tekrar kuyruğuna planla"}
                </button>
                {scheduled === "error" && <p className="text-sm text-red-700">Bazı kartlar planlanamadı, tekrar dene.</p>}
              </>
            ) : (
              <p className="text-center text-sm text-emerald-700">Hepsi doğru, yanlış kart yok.</p>
            )}
            <button type="button" onClick={onClose} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700">
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
