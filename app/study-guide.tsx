"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { ArrowLeft, ArrowRight, BookOpen, Download, ExternalLink, LoaderCircle, MessageSquare, Play } from "lucide-react";
import WeekDisclosure from "@/app/week-disclosure";
import type { StudyChatContextDetail } from "@/components/study-chatbot";

const guideFiles = import.meta.glob("../content/notes/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

const guideByCode: Record<string, string> = {
  "EBLG215.1": "../content/notes/eblg215.md",
  "EBLG341.1": "../content/notes/eblg341.md",
  "EBLG351.1": "../content/notes/eblg351.md",
  "EBLG359.1": "../content/notes/eblg359.md",
  "EINS335.1": "../content/notes/eins335.md",
  "GET05011.1": "../content/notes/get05011.md",
};

const studySchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), ["className", "math", "math-display"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className", "math", "math-inline"]],
    details: ["open"],
  },
};

interface WeekSection {
  week: number;
  title: string;
  markdown: string;
}

function splitWeeks(markdown: string): WeekSection[] {
  const pattern = /^## Hafta\s+(\d+)\s*(?:[—–:-]\s*|\s+)(.+)$/gm;
  const matches = [...markdown.matchAll(pattern)];
  return matches.map((match, index) => ({
    week: Number(match[1]),
    title: match[2].trim(),
    markdown: markdown.slice(
      (match.index ?? 0) + match[0].length,
      matches[index + 1]?.index ?? markdown.length,
    ).trim(),
  }));
}

function YoutubeStudyLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [playing, setPlaying] = useState(false);
  let videoId: string | null = null;
  try {
    const url = new URL(href);
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) videoId = url.searchParams.get("v");
    if (url.hostname === "youtu.be") videoId = url.pathname.slice(1);
  } catch {
    videoId = null;
  }

  if (!videoId) {
    return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 text-white shadow-sm">
      {playing ? (
        <div className="aspect-video">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1`}
            title={typeof children === "string" ? children : "Ders videosu"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="flex w-full items-center gap-4 p-4 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
          <span className="min-w-0 flex-1 text-sm font-semibold leading-6">{children}</span>
          <span className="hidden text-xs font-medium text-stone-300 sm:block">Videoyu oynat</span>
        </button>
      )}
    </div>
  );
}

function MermaidDiagram({ source }: { source: string }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);
  const id = `guide-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    let active = true;
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", fontFamily: "Inter, Arial, sans-serif" });
      try {
        const rendered = await mermaid.render(id, source);
        if (active) setSvg(rendered.svg);
      } catch {
        if (active) setFailed(true);
      }
    }).catch(() => active && setFailed(true));
    return () => { active = false; };
  }, [id, source]);

  if (failed) {
    return <pre className="my-4 overflow-x-auto rounded-xl bg-stone-900 p-4 text-xs text-stone-100"><code>{source}</code></pre>;
  }

  return (
    <div className="my-5 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-3 sm:p-5" aria-label="Ders şeması">
      {svg ? <div className="mx-auto flex min-h-12 w-max min-w-full justify-center [&_svg]:max-w-none" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="flex h-16 items-center justify-center text-stone-400"><LoaderCircle className="h-5 w-5 animate-spin" /><span className="sr-only">Şema yükleniyor</span></div>}
    </div>
  );
}

const markdownComponents: Components = {
  a({ href = "", children }) {
    if (/^(https?:\/\/)?(www\.)?(youtube\.com\/watch|youtu\.be\/)/i.test(href)) {
      return <YoutubeStudyLink href={href}>{children}</YoutubeStudyLink>;
    }
    return <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-4 hover:text-amber-950">{children}<ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" /></a>;
  },
  h2: ({ children }) => <h2 className="mb-4 mt-10 border-b border-stone-200 pb-3 text-2xl font-bold tracking-tight text-stone-950">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-bold tracking-tight text-stone-900">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-2 mt-6 text-base font-bold text-stone-900">{children}</h4>,
  p: ({ children }) => <p className="my-4 leading-7 text-stone-700">{children}</p>,
  li: ({ children }) => <li className="my-2 pl-1 leading-7 text-stone-700 marker:text-amber-600">{children}</li>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-1 pl-6">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="my-5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-700">{children}</blockquote>,
  table: ({ children }) => <div className="my-5 overflow-x-auto rounded-xl border border-stone-200"><table className="w-full min-w-[34rem] border-collapse text-left text-sm">{children}</table></div>,
  th: ({ children }) => <th className="border-b border-stone-200 bg-stone-100 px-3 py-2 font-semibold text-stone-800">{children}</th>,
  td: ({ children }) => <td className="border-b border-stone-100 px-3 py-2 align-top text-stone-700">{children}</td>,
  hr: () => <hr className="my-8 border-stone-200" />,
  strong: ({ children }) => <strong className="font-bold text-stone-900">{children}</strong>,
  details: ({ children }) => <details className="my-4 rounded-xl border border-stone-200 bg-white p-4 open:shadow-sm">{children}</details>,
  summary: ({ children }) => <summary className="cursor-pointer font-semibold text-stone-800 marker:text-amber-600">{children}</summary>,
  pre({ children }) {
    if (React.isValidElement(children) && children.type === MermaidDiagram) return children;
    return <pre className="my-4 overflow-x-auto rounded-xl bg-stone-900 p-4 text-sm leading-6 text-stone-100">{children}</pre>;
  },
  code({ className, children }) {
    const language = /language-(\w+)/.exec(className ?? "")?.[1];
    if (language === "mermaid") return <MermaidDiagram source={String(children).replace(/\n$/, "")} />;
    return <code className={className}>{children}</code>;
  },
};

// Renders card prompts/answers that come from the notes (math, lists, bold) the same way as the guide.
export function CardMarkdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={`study-markdown ${className ?? ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeSanitize, studySchema], rehypeKatex]}>{source}</ReactMarkdown>
    </div>
  );
}

export default function StudyGuide(props: { courseCode: string; courseTitle: string }) {
  return <StudyGuideContent key={props.courseCode} {...props} />;
}

function StudyGuideContent({ courseCode, courseTitle }: { courseCode: string; courseTitle: string }) {
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState(!guideByCode[courseCode]);
  const [activeWeek, setActiveWeek] = useState<number | null>(1);
  const file = guideByCode[courseCode];
  const slug = file?.split("/").at(-1)?.replace(/\.md$/, "");
  const syllabus = ({
    "EBLG341.1": "EBLG341-izlence-2026.pdf",
    "EBLG351.1": "EBLG351-izlence-2026.pdf",
    "GET05011.1": "GET05011-izlence-2026.pdf",
  } as Record<string, string>)[courseCode] ?? null;

  useEffect(() => {
    let active = true;
    const loader = file ? guideFiles[file] : undefined;
    if (!loader) {
      return;
    }
    loader().then((content) => active && setMarkdown(content)).catch(() => active && setError(true));
    return () => { active = false; };
  }, [file]);

  const weeks = useMemo(() => splitWeeks(markdown), [markdown]);
  const weekNumbers = useMemo(() => weeks.map((section) => section.week), [weeks]);
  const current = weeks.find((section) => section.week === activeWeek);

  const handleToggleWeek = (week: number) => {
    setActiveWeek((prev) => (prev === week ? null : week));
  };

  const handleAskWeek = () => {
    if (!current) return;
    const detail: StudyChatContextDetail = {
      kind: "week",
      label: `${courseTitle} · ${current.week}. Hafta · ${current.title}`,
      file,
      source: current.markdown,
      explanation: `Ders: ${courseTitle} (${courseCode})\nHafta: ${current.week}\nKonu: ${current.title}\nKullanıcı bu notla ilgili soru soracak; sorusunu bu içeriğe göre yanıtla.`,
    };
    window.dispatchEvent(new CustomEvent("study-chat-context", { detail }));
  };

  if (error) {
    return <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center"><BookOpen className="mx-auto h-8 w-8 text-stone-400" /><h3 className="mt-3 font-semibold text-stone-900">Bu ders için rehber henüz eklenmedi</h3><p className="mt-1 text-sm text-stone-500">Ders notları hazır olduğunda burada hafta hafta görünecek.</p></div>;
  }
  if (!markdown) return <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-stone-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Haftalık rehber açılıyor…</div>;

  return (
    <section className="space-y-4" aria-label={`${courseTitle} haftalık çalışma rehberi`}>
      <div className="py-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-tight text-stone-900">Haftalık rehber <span className="ml-1 text-sm font-normal text-stone-500">· {weeks.length} hafta</span></h2>
            <p className="hidden max-w-2xl text-sm leading-6 text-stone-500 sm:block">Çalışmak istediğin haftayı seç.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {slug && (
              <a
                href={`/study-guides/${slug}.pdf`}
                download
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <Download className="h-4 w-4" /> Notları PDF indir
              </a>
            )}
            {syllabus && (
              <a
                href={`/syllabi/${syllabus}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-xl px-3 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Ders izlencesi
              </a>
            )}
          </div>
        </div>
      </div>

      <WeekDisclosure
        weeks={weekNumbers}
        openWeek={activeWeek}
        onToggle={handleToggleWeek}
        idPrefix={`study-guide-${courseCode.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
        label={`${courseTitle} haftaları`}
      >
        {current && (
          <article className="rounded-2xl border border-stone-200 bg-white px-5 py-6 shadow-xs sm:px-8 sm:py-8">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-stone-100 pb-5 xl:flex-row">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ring)]">
                  Hafta {current.week} / {weeks.length}
                </p>
                <h3 className="mt-1 text-xl font-semibold leading-snug tracking-tight text-stone-900 sm:text-2xl lg:text-3xl break-words">
                  {current.title}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleAskWeek}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-2xs transition-colors hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <MessageSquare className="h-4 w-4 text-[var(--ring)]" aria-hidden="true" />
                  <span>Bu haftayı sor</span>
                </button>
                <div className="hidden gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => {
                      const currentWeek = current.week;
                      const prevWeek = Math.max(weeks[0]?.week ?? 1, currentWeek - 1);
                      setActiveWeek(prevWeek);
                    }}
                    disabled={current.week === weeks[0]?.week}
                    aria-label="Önceki hafta"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentWeek = current.week;
                      const nextWeek = Math.min(weeks.at(-1)?.week ?? currentWeek, currentWeek + 1);
                      setActiveWeek(nextWeek);
                    }}
                    disabled={current.week === weeks.at(-1)?.week}
                    aria-label="Sonraki hafta"
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="study-markdown [&_p]:max-w-[75ch] [&_li]:max-w-[75ch] [&_h1]:max-w-[75ch] [&_h2]:max-w-[75ch] [&_h3]:max-w-[75ch] [&_pre]:w-full [&_table]:w-full [&_img]:w-auto [&_img]:max-w-full">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeSanitize, studySchema], rehypeKatex]} components={markdownComponents}>{current.markdown}</ReactMarkdown>
            </div>
            <div className="mt-8 flex justify-between border-t border-stone-100 pt-5 sm:hidden">
              <button
                type="button"
                onClick={() => {
                  const currentWeek = current.week;
                  const prevWeek = Math.max(weeks[0]?.week ?? 1, currentWeek - 1);
                  setActiveWeek(prevWeek);
                }}
                disabled={current.week === weeks[0]?.week}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Önceki
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentWeek = current.week;
                  const nextWeek = Math.min(weeks.at(-1)?.week ?? currentWeek, currentWeek + 1);
                  setActiveWeek(nextWeek);
                }}
                disabled={current.week === weeks.at(-1)?.week}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        )}
      </WeekDisclosure>
    </section>
  );
}
