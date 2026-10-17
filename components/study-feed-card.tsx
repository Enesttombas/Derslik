"use client";

import React, { useMemo, useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Check,
  RotateCcw,
  Eye,
  AlertCircle,
  FileText,
  Sparkles,
  BookOpen,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import type { FeedCard, FeedMode } from "@/lib/study-feed";
import { CardMarkdown } from "@/app/study-guide";
import { Karalama } from "@/components/karalama";
import { adimlar, ipucuMerdiveni, secenekUret } from "@/lib/soru-secenek";
import { KartYZ } from "@/components/study-feed-yz";
import { SvgSekil } from "@/components/svg-sekil";
import { svgAyir } from "@/lib/svg-guvenli";

const HARF = ["A", "B", "C", "D", "E"];

interface StudyFeedCardProps {
  card: FeedCard;
  /** şık çeldiricileri için oturum kartları */
  havuz?: FeedCard[];
  mode: FeedMode;
  isAnswerRevealed: boolean;
  onRevealAnswer: () => void;
  userResponse: string;
  onUserResponseChange: (val: string) => void;
  isSubmitting: boolean;
  submitError: string | null;
  onTogglePreference: (pref: "like" | "dislike") => void;
  onSubmitAnswer: (outcome: "correct" | "incorrect") => void;
  onRetry: () => void;
  onSwitchMode?: (newMode: FeedMode) => void;
  /** yapay zekâ yeni kart ürettiğinde akışı yenile */
  onUretildi?: () => void;
}

export function StudyFeedCard({
  card: hamKart,
  havuz = [],
  mode,
  isAnswerRevealed,
  onRevealAnswer,
  onUserResponseChange,
  isSubmitting,
  submitError,
  onTogglePreference,
  onSubmitAnswer,
  onRetry,
  onSwitchMode,
  onUretildi,
}: StudyFeedCardProps) {
  const { metin: cevapMetni, svg: cevapSvg } = useMemo(() => svgAyir(hamKart.answer), [hamKart.answer]);
  const card = useMemo(() => ({ ...hamKart, answer: cevapMetni }), [hamKart, cevapMetni]);
  const [ipucuAdet, setIpucuAdet] = useState(0);
  const [secilen, setSecilen] = useState<number | null>(null);
  const sik = useMemo(() => secenekUret(card, havuz), [card, havuz]);
  const merdiven = useMemo(() => ipucuMerdiveni(card), [card]);
  const adimListesi = useMemo(() => adimlar(card.answer), [card]);
  const sikCevaplandi = sik !== null && secilen !== null;
  const isLiked = card.preference === "like";
  const isDisliked = card.preference === "dislike";

  return (
    <article
      data-card-id={card.id}
      aria-label={`Kart: ${card.courseTitle}`}
      className="flex flex-col h-full w-full min-w-0 max-w-2xl mx-auto rounded-[28px] border border-stone-200/80 bg-white shadow-[0_1px_1px_rgb(16_24_40/.04),0_8px_20px_-6px_rgb(16_24_40/.08),0_32px_64px_-24px_rgb(16_24_40/.22)] overflow-hidden text-stone-900 transition-all motion-reduce:transition-none select-text"
    >
      {/* Card Header: Metadata & Recommendation Reason */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-gradient-to-b from-stone-50 to-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 rounded-md bg-stone-200/70 px-2 py-0.5 text-xs font-semibold text-stone-700 truncate">
            <BookOpen className="h-3 w-3 shrink-0" />
            {card.courseCode || card.courseTitle}
          </span>
          {card.recommendationReason && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2 py-0.5 text-[11px] font-medium text-amber-900 truncate">
              <Sparkles className="h-2.5 w-2.5 shrink-0 text-amber-600" />
              {card.recommendationReason}
            </span>
          )}
        </div>

        {/* Source link: Only when real PDF source is present */}
        {card.pdfSourceId && (
          <a
            href={`/api/pdfs/${card.pdfSourceId}#page=${card.sourcePage ?? 1}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ders PDF kaynağında görüntüle"
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors shrink-0"
          >
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">PDF s. {card.sourcePage ?? 1}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {/* Card Body: Bounded Scrollable Area */}
      <div data-feed-scroll className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-4 min-h-0 min-w-0">
        {/* Prompt */}
        <section aria-label="Soru veya Konu">
          <div className="text-[19px] sm:text-xl font-semibold tracking-[-0.015em] text-stone-900 leading-snug break-words">
            <CardMarkdown source={card.prompt} />
          </div>
          {mode === "learn" && card.hint && (
            <p className="mt-2 text-xs text-stone-500 italic break-words">
              İpucu: {card.hint}
            </p>
          )}
        </section>

        <KartYZ card={card} cevapAcik={mode === "learn" || isAnswerRevealed} onUretildi={() => onUretildi?.()} />

        {/* LEARN MODE: Answer directly visible */}
        {mode === "learn" && (
          <section
            aria-label="Açıklama ve Çözüm"
            className="mt-2 border-t border-stone-100 pt-4"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Çözüm & Açıklama
            </h4>
            <div className="text-sm sm:text-base text-stone-700 leading-relaxed break-words bg-stone-50 rounded-xl p-3.5 border border-stone-200/60">
              <CardMarkdown source={card.answer} />
            </div>
            {cevapSvg && <SvgSekil svg={cevapSvg} />}
          </section>
        )}

        {/* PRACTICE MODE: Interactive Answer Reveal & Assessment */}
        {mode === "practice" && (
          <section aria-label="Antrenman Alanı" className="mt-2 flex flex-col gap-3">
            {!isAnswerRevealed && (
              <Karalama
                yan={
                  merdiven.length > 0 && ipucuAdet < merdiven.length ? (
                    <button
                      type="button"
                      aria-label="İpucu"
                      onClick={() => setIpucuAdet((n) => n + 1)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                    >
                      <Lightbulb className="h-5 w-5" />
                    </button>
                  ) : null
                }
              />
            )}
            {!isAnswerRevealed && merdiven.length > 0 && ipucuAdet > 0 && (
              <div className="flex flex-col gap-2">
                {merdiven.slice(0, ipucuAdet).map((m, i) => (
                  <div key={i} className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm leading-relaxed text-amber-950 animate-[akis-ileri_280ms_ease_both]">
                    <CardMarkdown source={m} />
                  </div>
                ))}
              </div>
            )}

            {!isAnswerRevealed && sik ? (
              <div className="akis-secenekler" role="group" aria-label="Şıklar">
                {sik.secenekler.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    className="akis-secenek"
                    onClick={() => {
                      setSecilen(i);
                      onUserResponseChange(`${HARF[i]}) ${m}`);
                      onRevealAnswer();
                    }}
                  >
                    <b className="akis-no">{HARF[i]}</b>
                    <span className="min-w-0 break-words [&_p]:m-0 [&_p]:inline"><CardMarkdown source={m} /></span>
                  </button>
                ))}
              </div>
            ) : !isAnswerRevealed ? (
              <button
                type="button"
                aria-label="Çözümü göster"
                onClick={onRevealAnswer}
                className="inline-flex h-12 w-12 items-center justify-center self-center rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors active:scale-95"
              >
                <Eye className="h-5 w-5" />
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {sik && (
                  <div className="akis-secenekler" role="group" aria-label="Sonuç">
                    {sik.secenekler.map((m, i) => (
                      <div
                        key={i}
                        className="akis-secenek"
                        data-durum={i === sik.dogru ? "dogru" : i === secilen ? "yanlis" : "sonuk"}
                      >
                        <b className="akis-no">{HARF[i]}</b>
                        <span className="min-w-0 break-words [&_p]:m-0 [&_p]:inline"><CardMarkdown source={m} /></span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-900">
                  {adimListesi.length > 0 ? (
                    <ol className="flex flex-col gap-2">
                      {adimListesi.map((m, i) => (
                        <li key={i} className="flex gap-2.5">
                          <b className="akis-no shrink-0">{i + 1}</b>
                          <span className="min-w-0 break-words"><CardMarkdown source={m} /></span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="break-words"><CardMarkdown source={card.answer} /></div>
                  )}
                </div>
                {cevapSvg && <SvgSekil svg={cevapSvg} />}
              </div>
            )}
          </section>
        )}

        {/* Error notification */}
        {submitError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="flex-1">{submitError}</span>
            <button type="button" onClick={onRetry} disabled={isSubmitting} className="min-h-[44px] shrink-0 rounded-lg border border-red-300 px-3 font-semibold">Yeniden dene</button>
          </div>
        )}
      </div>

      {/* Card Footer: Preference & Evaluation Controls */}
      <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left side: Preference (Learn mode) or switch action */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Beğen"
            aria-pressed={isLiked}
            disabled={isSubmitting || Boolean(submitError)}
            onClick={() => onTogglePreference("like")}
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5 transition-colors ${
              isLiked
                ? "bg-rose-100 text-rose-700 border border-rose-200 font-semibold"
                : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-800"
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-rose-700" : ""}`} />
            <span className="sr-only">Beğen</span>
          </button>

          <button
            type="button"
            aria-label="Beğenme"
            aria-pressed={isDisliked}
            disabled={isSubmitting || Boolean(submitError)}
            onClick={() => onTogglePreference("dislike")}
            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2.5 transition-colors ${
              isDisliked
                ? "bg-stone-300 text-stone-900 border border-stone-400 font-semibold"
                : "text-stone-500 hover:bg-stone-200/60 hover:text-stone-800"
            }`}
          >
            <ThumbsDown className={`h-4 w-4 ${isDisliked ? "fill-stone-800" : ""}`} />
            <span className="sr-only">Beğenme</span>
          </button>

          {mode === "learn" && onSwitchMode && (
            <button
              type="button"
              onClick={() => onSwitchMode("practice")}
              className="hidden sm:inline-flex min-h-[44px] items-center gap-1 text-xs text-stone-600 hover:text-stone-900 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors ml-2"
            >
              <span>Antrenmana Geç</span>
            </button>
          )}
        </div>

        {/* Right side: Practice Assessment Buttons (only after reveal) */}
        {mode === "practice" && isAnswerRevealed && sikCevaplandi && sik && (
          <button
            type="button"
            aria-label="Sonraki"
            disabled={isSubmitting || Boolean(submitError)}
            onClick={() => onSubmitAnswer(secilen === sik.dogru ? "correct" : "incorrect")}
            className="ml-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0a84ff] to-[#5e5ce6] text-white shadow-[0_8px_20px_-8px_rgb(10_132_255/.7)] hover:brightness-110 transition disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {mode === "practice" && isAnswerRevealed && !sik && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={isSubmitting || Boolean(submitError)}
              onClick={() => onSubmitAnswer("incorrect")}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Tekrar çalış</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || Boolean(submitError)}
              onClick={() => onSubmitAnswer("correct")}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Doğru yaptım</span>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
