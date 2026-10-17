"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import VeriYapisiDemo, { type DsKind } from "@/app/veri-yapilari-demo";
import { dsAssignments } from "@/app/veri-yapilari-data";
import { Check, CheckCircle, ChevronLeft, ChevronRight, Circle, Copy, Download, ImagePlus, LoaderCircle, Play, Sparkles, X } from "lucide-react";
import WeekDisclosure from "@/app/week-disclosure";

import hafta3Assignments from "../content/odevler/eblg351/hafta3/assignments.json";
import hafta4Assignments from "../content/odevler/eblg351/hafta4/assignments.json";

// Python kaynakları tek yerden gelir: sitede gösterilen kod, çalıştırılan dosyanın kendisidir.
const pythonFiles = import.meta.glob("../content/odevler/**/*.py", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Dosya adları dersler arasında benzersizdir; ders klasörünü bilmeden ada göre bulunur.
function byName<T>(files: Record<string, T>, name: string): T | undefined {
  const key = Object.keys(files).find((k) => k.endsWith("/" + name));
  return key ? files[key] : undefined;
}

function pySource(name: string): string {
  return byName(pythonFiles, name) ?? `# ${name} bulunamadı`;
}

const explanationFiles = import.meta.glob("../content/odevler/**/*.aciklama.json", {
  import: "default",
  eager: true,
}) as Record<string, ExplanationGroup[]>;
const emptyExplanationGroups: ExplanationGroup[] = [];

interface ExplanationGroup {
  satirlar: [number, number];
  aciklama: string;
  sinav?: string; // sınava yönelik kısa not: tanım, formül, sık sorulan nokta
  baslik?: string; // kısa başlık (3-6 kelime)
}

function pyExplanations(name: string): ExplanationGroup[] | undefined {
  return byName(explanationFiles, name.replace(/\.py$/, ".aciklama.json"));
}

interface Assignment {
  id: string;
  week: number;
  no: number;
  title: string;
  brief: string;
  done: boolean;
  file?: string;
  steps?: string[];
  runCommand?: string;
  section?: string; // hafta yerine konu başlığı (EBLG359)
  practice?: string[]; // "Pratik yap" alıştırmaları
  output?: string; // public/odevler/ altındaki gerçek terminal çıktısı
  ds?: DsKind;
  demo?: "resize" | "quantize" | "quadrants" | "histogram" | "histogramTiming" | "brightness";
  variants?: { label: string; file: string }[];
  images?: { src: string; alt: string }[];
  sourceUrl?: string;
}

const assignments: Assignment[] = [
  {
    id: "h1-2",
    week: 1,
    no: 1,
    title: "Klasördeki resimleri 1024×768'e ölçekleme",
    brief: "Python ile bir klasörü aç, içindeki tüm resim dosyalarını 1024×768 boyutuna yeniden ölçekle.",
    done: true,
    file: "resize_klasor.py",
    steps: [
      "Klasörü tara: `Path(girdi).iterdir()` dosyaları verir; yalnız resim uzantılı olanlar seçilir.",
      "Oku: `cv2.imread` resmi NumPy dizisi olarak döner. Şekli `(yükseklik, genişlik, 3)`, renk sırası BGR. Okunamazsa `None` döner; kod o dosyayı atlar.",
      "Ölçekle: `cv2.resize(resim, (1024, 768))`. Tuzak: resize `(GENİŞLİK, YÜKSEKLİK)` ister, `shape` ise `(yükseklik, genişlik)` verir.",
      "`INTER_AREA` küçültmede en temiz sonucu verir; büyütmede `INTER_LINEAR`/`INTER_CUBIC` tercih edilir.",
      "En-boy oranı korunmaz: dikey resim de 1024×768'e esner. Ödev bunu istiyor; oran korunacaksa letterbox gerekir.",
      "Yaz: `cv2.imwrite` aynı dosya adıyla çıktı klasörüne kaydeder.",
    ],
    runCommand: "python resize_klasor.py girdi cikti",
    demo: "resize",
  },
  {
    id: "h2-1", week: 2, no: 1, title: "8-bit → 6-bit parlaklık nicemleme", brief: "Tek kanallı görüntüde 8-bit parlaklığı 6-bit'e nicemle.", done: true,
    file: "nicemle_6bit.py",
    steps: [
      "Gri resmi oku: `cv2.imread(..., cv2.IMREAD_GRAYSCALE)` tek kanallı bir NumPy dizisi üretir.",
      "Bit sayısına göre alt bitleri at: `((gri >> 2) << 2)` 6-bit seviyeleri 8-bit aralığında gösterir.",
      "`astype(np.uint8)` sonucu 0-255 aralığındaki görüntü türüne çevirir.",
      "Önceki ve sonraki benzersiz değer sayıları, nicemlemenin seviye sayısını nasıl azalttığını gösterir.",
      "Gri, nicemlenmiş ve fark görüntülerini `cv2.imwrite` ile çıktı klasörüne kaydet.",
    ],
    runCommand: "python nicemle_6bit.py", demo: "quantize",
  },
  {
    id: "h2-2", week: 2, no: 2, title: "4 parça × 4 thread parlaklık işlemi", brief: "Görüntüyü 4 parçaya böl, 4 thread ile 4 farklı parlaklık işlemi uygula; 1 thread ile süre farkını ölç.", done: true,
    file: "parca_thread.py",
    steps: [
      "`_bol(gri)` görüntüyü sol üst, sağ üst, sol alt ve sağ alt dört kadrana ayırır.",
      "`_isle` kadrana göre 50 ekler, 50 çıkarır, tersini alır veya karekök dönüşümü uygular.",
      "Sonucu `np.clip(..., 0, 255).astype(np.uint8)` ile aralıkta tutup piksel türüne çevir.",
      "`ThreadPoolExecutor(max_workers=4)` ile parçaları çalıştır; sıralı sonucu da süre karşılaştırması için ölç.",
      "Thread sayısı tek başına hız garantisi değildir; görüntü boyutu ve görev maliyetine göre sonucu yorumla.",
    ],
    runCommand: "python parca_thread.py", demo: "quadrants",
  },
  {
    id: "h2-3", week: 2, no: 3, title: "Parça histogramlarını 4 thread ile hesaplama", brief: "Her parçanın histogramını ayrı thread'de hesapla, birleştirip ana histogramı oluştur.", done: true,
    file: "histogram_thread.py",
    steps: [
      "`gri.ravel()` pikselleri tek boyuta açar; `np.bincount(..., minlength=256)` her gri seviyesini sayar.",
      "`_bol(gri)` resmi dört kadrana ayırır; her parçanın 256 seviyelik sayımı ayrı yapılır.",
      "`ThreadPoolExecutor(max_workers=4)` parçaları işler, `np.sum(..., axis=0)` histogramları toplar.",
      "Parça toplamını bütün görüntünün histogramıyla `np.array_equal` kullanarak doğrula.",
      "Canvas demosunda tam histogramı ve dört kadranın histogramını karşılaştır; piksel sayıları eşleşmeli.",
    ],
    runCommand: "python histogram_thread.py", demo: "histogram",
  },
  {
    id: "h2-4", week: 2, no: 4, title: "Histogram: 1 thread vs 4 thread süresi", brief: "Histogram hesabını 1 ve 4 thread ile süre açısından karşılaştır.", done: true,
    file: "histogram_sure.py",
    steps: [
      "Tekli yol `tum_histogram` ile tüm pikselleri bir defada sayar; diğer yol dört parçanın sayımlarını birleştirir.",
      "`perf_counter()` yüksek çözünürlüklü zaman ölçümü sağlar; tekrarların ortalaması alınır.",
      "İki yöntemin histogramlarını `np.array_equal` ile karşılaştır; süreyi ancak aynı sonuçta yorumla.",
      "Laptop çıktısındaki ölçüm tablo hâlindedir; farklı makinelerde süre ve sıralama değişebilir.",
      "Tarayıcı ölçümü dört parçayı sırayla hesaplar; JavaScript tek iş parçacığında çalışır, burada Web Worker kullanılmaz.",
    ],
    runCommand: "python histogram_sure.py", demo: "histogramTiming",
  },
  {
    id: "h2-5", week: 2, no: 5, title: "Parlaklık dönüşümü: 0.75·x + 20", brief: "Tüm görüntüye 0.75 ile çarpıp 20 ekle; farkı görmek için dönüşümleri ayrı ayrı uygula.", done: true,
    file: "parlaklik_donusum.py",
    steps: [
      "Gri pikselleri `astype(np.float32)` ile ondalıklı türe çevir; ara hesaplarda uint8 taşmasını önle.",
      "Ayrı etkiler `0.75 * x` ve `x + 20`, birleşik dönüşüm ise `0.75 * x + 20` uygular.",
      "`np.clip(..., 0, 255)` değerleri görüntü aralığında tutar; `astype(np.uint8)` tam sayıya çevirir.",
      "`a` ve `b` kaydırıcıları `y = a*x + b` dönüşümünü canlı değiştirir; hazır düğmeler tek etkileri gösterir.",
      "Önceki ve sonraki ortalama parlaklık ile min/max değerlerini birlikte incele.",
    ],
    runCommand: "python parlaklik_donusum.py", demo: "brightness",
  },
  ...(hafta3Assignments as Assignment[]),
  ...(hafta4Assignments as Assignment[]),
];

function inlineCode(text: string) {
  const chunks = text.split(/(`[^`]+`|\b(?:None|True|False|continue|return|for|if|main)\b|\b[A-Za-z_][\w]*(?:\.[\w]+)+)/g);
  return chunks.map((part, i) => {
    const code = part.startsWith("`") && part.endsWith("`") ? part.slice(1, -1) : part;
    return part.startsWith("`") || /^(?:None|True|False|continue|return|for|if|main)$/.test(part) || /^[A-Za-z_]\w*(?:\.\w+)+$/.test(part)
      ? <code key={i} className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[0.85em] text-stone-800">{code}</code>
      : <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function explanationText(text: string) {
  const end = text.search(/[.!?](?:\s|$)/);
  if (end < 0) return inlineCode(text);
  return <><strong className="font-semibold text-stone-900">{inlineCode(text.slice(0, end + 1))}</strong>{inlineCode(text.slice(end + 1))}</>;
}

function getGroupTitle(group: ExplanationGroup): string {
  if (group.baslik && group.baslik.trim().length > 0) {
    return group.baslik.trim();
  }
  const firstSentence = group.aciklama.split(/[.!?](?:\s|$)/)[0] || group.aciklama;
  const words = firstSentence.trim().split(/\s+/);
  return words.slice(0, 6).join(" ");
}

interface ExamSegment {
  label: string;
  badgeClass: string;
  text: string;
}

function parseExamNote(text: string): ExamSegment[] | null {
  const prefixRegex = /(?:^|[\n;.])\s*(Tan[ıiIİ]m|Form[üuÜU]l|[ÖOöo]rnek|S[ıiIİ]k\s*hata)\s*:\s*/gi;
  const matches = Array.from(text.matchAll(prefixRegex));
  if (matches.length === 0) return null;

  const badgeColorMap: Record<string, string> = {
    tanim: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    formul: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    ornek: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    sikhata: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  };

  const segments: ExamSegment[] = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const rawLabel = match[1];
    const startIndex = match.index! + match[0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    const segmentText = text.slice(startIndex, endIndex).trim();

    const normalizedKey = rawLabel
      .toLowerCase()
      .replace(/[\s_]/g, "")
      .replace(/[ıiİ]/g, "i")
      .replace(/[üuÜ]/g, "u")
      .replace(/[öoÖ]/g, "o");
    const badgeClass = badgeColorMap[normalizedKey] ?? "bg-amber-100 text-amber-800 border-amber-200";

    segments.push({
      label: rawLabel.trim(),
      badgeClass,
      text: segmentText,
    });
  }
  return segments;
}

function renderExamNote(sinavText: string, isDarkInline = false) {
  const segments = parseExamNote(sinavText);
  if (!segments) {
    if (isDarkInline) {
      return (
        <span className="mt-2 block border-t border-stone-700 pt-2 text-amber-200">
          <span className="mr-1.5 font-semibold uppercase tracking-wide text-[10px] text-amber-400">Sınav notu</span>
          {inlineCode(sinavText)}
        </span>
      );
    }
    return (
      <div className="explanation-copy mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px] leading-[1.55] text-amber-950">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">Sınav notu</p>
        <p className="whitespace-pre-wrap">{inlineCode(sinavText)}</p>
      </div>
    );
  }

  if (isDarkInline) {
    return (
      <div className="mt-2 space-y-1.5 border-t border-stone-700 pt-2 text-stone-200">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-start gap-1.5 text-xs">
            <span className="shrink-0 rounded bg-stone-800 border border-stone-600 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              {seg.label}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap">{inlineCode(seg.text)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="explanation-copy mt-3 space-y-2 rounded-lg bg-amber-50/70 p-2.5 text-[12.5px] leading-[1.55] text-amber-950 border border-amber-200/60">
      {segments.map((seg, idx) => (
        <div key={idx} className="flex items-start gap-2">
          <span className={`shrink-0 rounded border px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-wide ${seg.badgeClass}`}>
            {seg.label}
          </span>
          <span className="min-w-0 flex-1 whitespace-pre-wrap text-stone-800">
            {inlineCode(seg.text)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Basit vurgulama: yorumlar ve docstring'ler yeşil; açıklama kodun içinde okunur.
function docstringFlags(lines: string[]): boolean[] {
  let inDoc = false;
  return lines.map((line) => {
    const quotes = (line.match(/"""/g) ?? []).length;
    const docLine = inDoc || quotes > 0;
    if (quotes % 2 === 1) inDoc = !inDoc;
    return docLine;
  });
}

function PythonCode({
  source,
  filename,
  selectedGroup,
  onSelectGroup,
  anchorRef,
  recallMode,
  isRevealed,
  onReveal,
}: {
  source: string;
  filename: string;
  selectedGroup: ExplanationGroup | null;
  onSelectGroup: (group: ExplanationGroup) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  recallMode?: boolean;
  isRevealed?: boolean;
  onReveal?: () => void;
}) {
  const lines = source.replace(/\r\n/g, "\n").trimEnd().split("\n");
  const docFlags = docstringFlags(lines);
  const explanations = pyExplanations(filename);
  return (
    <pre className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere] rounded-xl bg-stone-950 p-4 text-[12.5px] leading-relaxed text-stone-100 min-[900px]:text-[14px] min-[900px]:leading-[1.65]">
      <code className="block min-w-0">
        {lines.map((line, i) => {
          const docLine = docFlags[i];
          const lineNumber = i + 1;
          const group = explanations?.find(({ satirlar: [start, end] }) => lineNumber >= start && lineNumber <= end);
          const [start, end] = group?.satirlar ?? [0, 0];
          const isOpen = Boolean(group && selectedGroup?.satirlar[0] === start && selectedGroup.satirlar[1] === end);
          const isFirstLine = group?.satirlar[0] === lineNumber;
          const isLastLine = group?.satirlar[1] === lineNumber;
          const explanationId = "python-group-" + filename.replace(/[^a-zA-Z0-9_-]/g, "-") + "-" + start;

          // Odak (dim): Bir grup seçildiyse grup dışı satırlar soluk (opacity ~0.45), seçili grup tam parlak
          const isSelectedGroupLine = Boolean(
            selectedGroup &&
              lineNumber >= selectedGroup.satirlar[0] &&
              lineNumber <= selectedGroup.satirlar[1]
          );
          const isDimmed = Boolean(selectedGroup && !isSelectedGroupLine);

          let body: React.ReactNode = line;
          if (docLine) {
            body = <span className="text-emerald-300">{line}</span>;
          } else {
            const hash = line.search(/(^|\s)#/);
            if (hash >= 0) {
              body = (
                <>
                  {line.slice(0, hash)}
                  <span className="text-emerald-400">{line.slice(hash)}</span>
                </>
              );
            }
          }
          return (
            <div
              key={i}
              className={`grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 transition-opacity duration-150 ${
                isDimmed ? "opacity-45 dim" : "opacity-100"
              }`}
            >
              {group ? (
                <button
                  type="button"
                  aria-label={isFirstLine ? `Satır ${start}-${end} açıklamasını ${isOpen ? "kapat" : "aç"}` : undefined}
                  aria-expanded={isFirstLine ? isOpen : undefined}
                  aria-controls={isFirstLine ? explanationId : undefined}
                  aria-current={isOpen ? "true" : undefined}
                  tabIndex={isFirstLine ? undefined : -1}
                  onClick={() => onSelectGroup(group)}
                  className={`col-span-2 grid min-w-0 w-full cursor-pointer grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-l-2 text-left text-stone-100 transition-colors ${
                    isOpen ? "border-amber-400 bg-amber-950/40" : "border-transparent hover:bg-stone-900"
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400`}
                  ref={isFirstLine && isOpen ? anchorRef : undefined}
                >
                  <span className="flex select-none items-start justify-end gap-1 text-right text-stone-600">
                    {lineNumber}
                    {isFirstLine && (
                      <span aria-hidden="true" className="text-[9px] text-amber-400">
                        {isOpen ? "▾" : "•"}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{body}</span>
                </button>
              ) : (
                <>
                  <span className="select-none text-right text-stone-600">{lineNumber}</span>
                  <span className="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{body}</span>
                </>
              )}
              {group && isLastLine && (
                <div
                  id={explanationId}
                  hidden={!isOpen}
                  className="explanation-inline col-start-2 mt-1 min-w-0 whitespace-pre-wrap break-words rounded-lg border border-stone-700 bg-stone-900/70 px-3 py-2 font-sans text-xs leading-relaxed text-stone-300 [overflow-wrap:anywhere] lg:hidden"
                >
                  <p className="mb-1 font-semibold text-amber-300">{getGroupTitle(group)}</p>
                  {recallMode && !isRevealed ? (
                    <div className="my-1.5 rounded border border-dashed border-amber-500/50 bg-amber-950/30 p-2 text-center">
                      <p className="text-[11px] text-amber-200">Bu satırlar ne yapıyor? Önce kendin düşün.</p>
                      {onReveal && (
                        <button
                          type="button"
                          onClick={onReveal}
                          className="mt-1.5 inline-flex items-center rounded bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-400"
                        >
                          Cevabı göster
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {explanationText(group.aciklama)}
                      {group.sinav && renderExamNote(group.sinav, true)}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </code>
    </pre>
  );
}

interface ResizeResult {
  name: string;
  before: string;
  after: string;
  url: string;
  ms: number;
}

const TARGET_W = 1024;
const TARGET_H = 768;

async function resizeImage(blob: Blob, name: string): Promise<ResizeResult> {
  const bitmap = await createImageBitmap(blob);
  const start = performance.now();
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D desteklenmiyor");
  ctx.imageSmoothingQuality = "high"; // INTER_AREA'nın tarayıcıdaki yakın karşılığı
  ctx.drawImage(bitmap, 0, 0, TARGET_W, TARGET_H);
  const ms = performance.now() - start;
  const out = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kodlama başarısız"))), "image/jpeg", 0.92),
  );
  const result = {
    name,
    before: `${bitmap.width}×${bitmap.height}`,
    after: `${canvas.width}×${canvas.height}`,
    url: URL.createObjectURL(out),
    ms,
  };
  bitmap.close();
  return result;
}

function ResizeDemo() {
  const [results, setResults] = useState<ResizeResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => results.forEach((r) => URL.revokeObjectURL(r.url)), [results]);

  async function run(files: { blob: Blob; name: string }[]) {
    setBusy(true);
    setError(null);
    const out: ResizeResult[] = [];
    for (const f of files) {
      try {
        out.push(await resizeImage(f.blob, f.name));
      } catch {
        setError(`ATLANDI (okunamadı): ${f.name}`);
      }
    }
    setResults(out);
    setBusy(false);
  }

  async function runSample() {
    const res = await fetch("/odevler/dama.jpg");
    await run([{ blob: await res.blob(), name: "dama.jpg" }]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-700">
        Aynı algoritma tarayıcıda: resimleri seç (klasörün içindekileri toplu seçebilirsin), hepsi 1024×768 olsun.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800">
          <ImagePlus className="h-4 w-4" />
          <span>Resim seç</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) run(files.map((f) => ({ blob: f, name: f.name })));
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={runSample}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          <span>Ders görseliyle dene</span>
        </button>
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Ölçekleniyor…
        </p>
      )}
      {error && <p className="text-sm font-medium text-amber-700">{error}</p>}

      {results.length > 0 && (
        <div className="space-y-3">
          <pre className="overflow-x-auto rounded-xl bg-stone-950 p-3 font-mono text-[12.5px] text-emerald-300">
            {results.map((r) => `${r.name}: ${r.before} -> ${r.after}  (${r.ms.toFixed(1)} ms)`).join("\n")}
          </pre>
          {results.map((r) => (
            <figure key={r.url} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.url} alt={`${r.name} 1024×768`} className="block w-full" />
              <figcaption className="flex items-center justify-between px-3 py-2 text-xs text-stone-600">
                <span>
                  {r.name} · {r.after}
                </span>
                <a href={r.url} download={r.name.replace(/\.\w+$/, "") + "_1024x768.jpg"} className="inline-flex items-center gap-1 font-semibold text-stone-900">
                  <Download className="h-3.5 w-3.5" /> İndir
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

interface GrayFrame {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

async function loadGrayFrame(): Promise<GrayFrame> {
  const response = await fetch("/odevler/dama.jpg");
  if (!response.ok) throw new Error("Ders görseli yüklenemedi.");
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D desteklenmiyor.");
  context.drawImage(bitmap, 0, 0);
  const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
  const pixels = new Uint8ClampedArray(bitmap.width * bitmap.height);
  for (let i = 0; i < pixels.length; i++) {
    const offset = i * 4;
    pixels[i] = Math.round(0.299 * rgba[offset] + 0.587 * rgba[offset + 1] + 0.114 * rgba[offset + 2]);
  }
  const frame = { width: bitmap.width, height: bitmap.height, pixels };
  bitmap.close();
  return frame;
}

function useGrayFrame() {
  const [frame, setFrame] = useState<GrayFrame | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    loadGrayFrame().then((value) => { if (active) setFrame(value); }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Görsel yüklenemedi.");
    });
    return () => { active = false; };
  }, []);
  return { frame, error };
}

function SampleStatus({ frame, error }: { frame: GrayFrame | null; error: string | null }) {
  if (error) return <p className="text-sm font-medium text-amber-700">{error}</p>;
  if (!frame) return <p className="text-sm text-stone-500">Ders görseli yükleniyor…</p>;
  return null;
}

type PixelValues = Uint8Array | Uint8ClampedArray;

function GrayCanvas({ frame, pixels, label }: { frame: GrayFrame; pixels: PixelValues; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.width = frame.width;
    canvas.height = frame.height;
    const rgba = context.createImageData(frame.width, frame.height);
    for (let i = 0; i < pixels.length; i++) {
      const offset = i * 4;
      rgba.data[offset] = pixels[i];
      rgba.data[offset + 1] = pixels[i];
      rgba.data[offset + 2] = pixels[i];
      rgba.data[offset + 3] = 255;
    }
    context.putImageData(rgba, 0, 0);
  }, [frame, pixels]);
  return <canvas ref={canvasRef} aria-label={label} role="img" className="block h-auto max-w-full w-full rounded-lg border border-stone-200" />;
}

function TerminalOutput({ filename, title }: { filename: string; title: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(filename.includes("/") ? `/odevler/${filename}` : `/odevler/hafta2/${filename}`).then((response) => {
      if (!response.ok) throw new Error("Çıktı dosyası yüklenemedi.");
      return response.text();
    }).then((value) => { if (active) setText(value.trimEnd()); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [filename]);
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-semibold text-stone-600">{title}</p>
      <pre className="max-w-full whitespace-pre-wrap break-words rounded-xl bg-stone-950 p-3 font-mono text-[12px] leading-relaxed text-emerald-300 [overflow-wrap:anywhere]">
        {text ?? (error ? "Çıktı dosyası yüklenemedi." : "Çıktı yükleniyor…")}
      </pre>
    </div>
  );
}

function quantizedPixels(frame: GrayFrame, bits: number) {
  const shift = 8 - bits;
  return Uint8ClampedArray.from(frame.pixels, (value) => (value >> shift) << shift);
}

function QuantizeDemo() {
  const { frame, error } = useGrayFrame();
  const [bits, setBits] = useState(6);
  const quantized = useMemo(() => frame ? quantizedPixels(frame, bits) : null, [frame, bits]);
  const levels = useMemo(() => quantized ? new Set(quantized).size : 0, [quantized]);
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-stone-700">Görsel gri tonlamaya çevrilir; alt bitleri atıp aynı bitlere kaydırarak seviyeleri azalt.</p>
      <SampleStatus frame={frame} error={error} />
      {frame && quantized && (
        <>
          <label className="block space-y-1 text-sm text-stone-700" htmlFor="quantize-bits">
            <span className="flex justify-between"><span>Bit sayısı</span><strong>{bits} bit · {levels} benzersiz seviye</strong></span>
            <input id="quantize-bits" type="range" min="1" max="8" value={bits} onChange={(event) => setBits(Number(event.target.value))} className="w-full accent-stone-900" />
          </label>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <figure className="min-w-0 space-y-1"><GrayCanvas frame={frame} pixels={frame.pixels} label="Orijinal gri görüntü" /><figcaption className="text-xs text-stone-500">Orijinal gri görüntü</figcaption></figure>
            <figure className="min-w-0 space-y-1"><GrayCanvas frame={frame} pixels={quantized} label={`${bits} bit nicemlenmiş görüntü`} /><figcaption className="text-xs text-stone-500">Nicemlenmiş: (x &gt;&gt; {8 - bits}) &lt;&lt; {8 - bits}</figcaption></figure>
          </div>
        </>
      )}
      <TerminalOutput filename="nicemle_6bit_cikti.txt" title="Laptopta gerçek çıktı" />
    </div>
  );
}

function quadrantPixels(frame: GrayFrame) {
  const output = new Uint8ClampedArray(frame.pixels.length);
  const middleY = Math.floor(frame.height / 2);
  const middleX = Math.floor(frame.width / 2);
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const index = y * frame.width + x;
      const value = frame.pixels[index];
      const transformed = y < middleY
        ? (x < middleX ? value + 50 : value - 50)
        : (x < middleX ? 255 - value : Math.sqrt(value / 255) * 255);
      output[index] = Math.trunc(Math.min(255, Math.max(0, transformed)));
    }
  }
  return output;
}

function QuadrantsDemo() {
  const { frame, error } = useGrayFrame();
  const result = useMemo(() => frame ? quadrantPixels(frame) : null, [frame]);
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-stone-700">Dört kadrana kaynak betikteki işlemleri uygula; kadran sırası Python çıktısıyla aynıdır.</p>
      <SampleStatus frame={frame} error={error} />
      {frame && result && <figure className="min-w-0 space-y-1"><GrayCanvas frame={frame} pixels={result} label="Dört farklı parlaklık işlemi uygulanmış görüntü" /><figcaption className="text-xs text-stone-500">Sol üst: x + 50 · sağ üst: x - 50 · sol alt: 255 - x · sağ alt: √(x / 255) × 255</figcaption></figure>}
      <TerminalOutput filename="parca_thread_cikti.txt" title="Laptopta gerçek çıktı" />
    </div>
  );
}

type Histogram = Uint32Array;

function histogramRegion(frame: GrayFrame, x0: number, y0: number, x1: number, y1: number): Histogram {
  const histogram = new Uint32Array(256);
  for (let y = y0; y < y1; y++) {
    const row = y * frame.width;
    for (let x = x0; x < x1; x++) histogram[frame.pixels[row + x]]++;
  }
  return histogram;
}

function frameHistograms(frame: GrayFrame) {
  const middleY = Math.floor(frame.height / 2);
  const middleX = Math.floor(frame.width / 2);
  const parts = [
    histogramRegion(frame, 0, 0, middleX, middleY),
    histogramRegion(frame, middleX, 0, frame.width, middleY),
    histogramRegion(frame, 0, middleY, middleX, frame.height),
    histogramRegion(frame, middleX, middleY, frame.width, frame.height),
  ];
  const whole = histogramRegion(frame, 0, 0, frame.width, frame.height);
  const merged = new Uint32Array(256);
  for (const part of parts) for (let i = 0; i < 256; i++) merged[i] += part[i];
  return { whole, parts, equal: whole.every((count, i) => count === merged[i]) };
}

function HistogramCanvas({ counts, small = false, label }: { counts: Histogram; small?: boolean; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    canvas.width = 512;
    canvas.height = small ? 128 : 210;
    context.fillStyle = "#fafaf9";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const max = Math.max(1, ...counts);
    const chartHeight = canvas.height - 12;
    context.fillStyle = "#57534e";
    for (let i = 0; i < counts.length; i++) {
      const barHeight = counts[i] / max * chartHeight;
      const x = i * canvas.width / 256;
      context.fillRect(x, canvas.height - barHeight, Math.max(1, canvas.width / 256), barHeight);
    }
    context.strokeStyle = "#d6d3d1";
    context.beginPath();
    context.moveTo(0, canvas.height - 10);
    context.lineTo(canvas.width, canvas.height - 10);
    context.stroke();
  }, [counts, small]);
  return <canvas ref={canvasRef} aria-label={label} role="img" className="block h-auto max-w-full w-full rounded-lg border border-stone-200" />;
}

function HistogramDemo() {
  const { frame, error } = useGrayFrame();
  const histograms = useMemo(() => frame ? frameHistograms(frame) : null, [frame]);
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-stone-700">Her sütun, o gri seviyesindeki piksel sayısını gösterir.</p>
      <SampleStatus frame={frame} error={error} />
      {histograms && (
        <>
          <figure className="min-w-0 space-y-1"><HistogramCanvas counts={histograms.whole} label="Bütün görüntünün gri seviye histogramı" /><figcaption className="text-xs text-stone-500">Bütün görüntü</figcaption></figure>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {histograms.parts.map((part, index) => <figure key={index} className="min-w-0 space-y-1"><HistogramCanvas counts={part} small label={`${index + 1}. parça histogramı`} /><figcaption className="text-xs text-stone-500">{index + 1}. parça</figcaption></figure>)}
          </div>
          <p className={`text-sm font-semibold ${histograms.equal ? "text-emerald-700" : "text-amber-700"}`}>
            {histograms.equal ? "eşit ✓" : "eşit değil"} · toplam {histograms.whole.reduce((sum, count) => sum + count, 0)} piksel
          </p>
        </>
      )}
      <TerminalOutput filename="histogram_thread_cikti.txt" title="Laptopta gerçek çıktı" />
    </div>
  );
}

function measureHistograms(frame: GrayFrame) {
  const middleY = Math.floor(frame.height / 2);
  const middleX = Math.floor(frame.width / 2);
  const regions = [
    [0, 0, middleX, middleY], [middleX, 0, frame.width, middleY],
    [0, middleY, middleX, frame.height], [middleX, middleY, frame.width, frame.height],
  ] as const;
  const repetitions = 5;
  let whole: Histogram = new Uint32Array(256);
  let parts: Histogram = new Uint32Array(256);
  const singleStart = performance.now();
  for (let run = 0; run < repetitions; run++) whole = histogramRegion(frame, 0, 0, frame.width, frame.height);
  const singleMs = (performance.now() - singleStart) / repetitions;
  const partsStart = performance.now();
  for (let run = 0; run < repetitions; run++) {
    parts = new Uint32Array(256);
    for (const [x0, y0, x1, y1] of regions) {
      const part = histogramRegion(frame, x0, y0, x1, y1);
      for (let i = 0; i < 256; i++) parts[i] += part[i];
    }
  }
  const partsMs = (performance.now() - partsStart) / repetitions;
  return { singleMs, partsMs, equal: whole.every((count, i) => count === parts[i]), repetitions };
}

function HistogramTimingDemo() {
  const { frame, error } = useGrayFrame();
  const [timing, setTiming] = useState<ReturnType<typeof measureHistograms> | null>(null);
  useEffect(() => {
    if (!frame) return;
    const timer = window.setTimeout(() => setTiming(measureHistograms(frame)), 0);
    return () => window.clearTimeout(timer);
  }, [frame]);
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-stone-700">Aynı gri görselde bütün histogramı ve dört parçanın sırayla hesaplanmasını ölç.</p>
      <SampleStatus frame={frame} error={error} />
      {frame && <button type="button" onClick={() => setTiming(measureHistograms(frame))} className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50">Tarayıcıda yeniden ölç</button>}
      {timing && <dl className="grid grid-cols-1 gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-stone-500">1 parça · tüm görüntü</dt><dd className="font-mono font-semibold text-stone-900">{timing.singleMs.toFixed(3)} ms</dd></div><div><dt className="text-xs text-stone-500">4 parça · sırayla</dt><dd className="font-mono font-semibold text-stone-900">{timing.partsMs.toFixed(3)} ms</dd></div><p className="text-xs text-stone-600 sm:col-span-2">{timing.repetitions} tekrarın ortalaması · histogramlar {timing.equal ? "eşit ✓" : "eşit değil"}</p></dl>}
      <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Tarayıcı ölçümü JavaScript tek iş parçacığında çalışırken yapılır; dört parça burada thread ile paralelleşmez. Web Worker kullanmadan ölçüm düzenini karşılaştırır.</p>
      <TerminalOutput filename="histogram_sure_cikti.txt" title="Laptopta gerçek ölçüm tablosu" />
    </div>
  );
}

function brightnessPixels(frame: GrayFrame, a: number, b: number) {
  return Uint8ClampedArray.from(frame.pixels, (value) => Math.trunc(Math.min(255, Math.max(0, a * value + b))));
}

function averageBrightness(pixels: PixelValues) {
  let total = 0;
  for (let i = 0; i < pixels.length; i++) total += pixels[i];
  return total / pixels.length;
}

function BrightnessDemo() {
  const { frame, error } = useGrayFrame();
  const [a, setA] = useState(0.75);
  const [b, setB] = useState(20);
  const transformed = useMemo(() => frame ? brightnessPixels(frame, a, b) : null, [frame, a, b]);
  const originalMean = useMemo(() => frame ? averageBrightness(frame.pixels) : 0, [frame]);
  const transformedMean = useMemo(() => transformed ? averageBrightness(transformed) : 0, [transformed]);
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-sm text-stone-700">Dönüşüm: <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs">y = a*x + b</code></p>
      <SampleStatus frame={frame} error={error} />
      {frame && transformed && (
        <>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <figure className="min-w-0 space-y-1"><GrayCanvas frame={frame} pixels={frame.pixels} label="Orijinal gri görüntü" /><figcaption className="text-xs text-stone-500">Orijinal</figcaption></figure>
            <figure className="min-w-0 space-y-1"><GrayCanvas frame={frame} pixels={transformed} label={`a ${a.toFixed(2)}, b ${b} dönüşümü`} /><figcaption className="text-xs text-stone-500">a={a.toFixed(2)}, b={b}</figcaption></figure>
          </div>
          <div className="space-y-3">
            <label htmlFor="brightness-a" className="block space-y-1 text-sm text-stone-700"><span className="flex justify-between"><span>a çarpanı</span><strong>{a.toFixed(2)}</strong></span><input id="brightness-a" type="range" min="0" max="2" step="0.01" value={a} onChange={(event) => setA(Number(event.target.value))} className="w-full accent-stone-900" /></label>
            <label htmlFor="brightness-b" className="block space-y-1 text-sm text-stone-700"><span className="flex justify-between"><span>b kaydırması</span><strong>{b}</strong></span><input id="brightness-b" type="range" min="-100" max="100" step="1" value={b} onChange={(event) => setB(Number(event.target.value))} className="w-full accent-stone-900" /></label>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2"><button type="button" onClick={() => { setA(0.75); setB(0); }} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">Yalnız 0.75x</button><button type="button" onClick={() => { setA(1); setB(20); }} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">Yalnız x + 20</button><button type="button" onClick={() => { setA(0.75); setB(20); }} className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">İkisi</button></div>
          <p className="text-xs text-stone-600">Ortalama parlaklık · önce {originalMean.toFixed(2)} · sonra {transformedMean.toFixed(2)}</p>
        </>
      )}
      <TerminalOutput filename="parlaklik_donusum_cikti.txt" title="Laptopta gerçek çıktı" />
    </div>
  );
}

export default function Odevler({ course = "eblg351" }: { course?: "eblg351" | "eblg359" }) {
  const isDs = course === "eblg359";
  const list: Assignment[] = isDs ? dsAssignments : assignments;
  const [selectedId, setSelectedId] = useState(list[0].id);
  const [selectedGroup, setSelectedGroup] = useState<ExplanationGroup | null>(null);
  const [copied, setCopied] = useState(false);
  const [recallMode, setRecallMode] = useState(false);
  const [revealedGroupKey, setRevealedGroupKey] = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [cardTop, setCardTop] = useState(0);

  const selected = list.find((a) => a.id === selectedId) ?? list[0];
  const [variantSelection, setVariantSelection] = useState<{ assignmentId: string; file: string } | null>(null);
  const activeFile = variantSelection?.assignmentId === selected.id
    ? variantSelection.file
    : selected.file ?? "";

  const weeks = [...new Set(list.map((a) => a.week))];
  const [openWeek, setOpenWeek] = useState<number | null>(weeks[0] ?? 1);

  const handleToggleWeek = (week: number) => {
    if (openWeek === week) {
      setOpenWeek(null);
    } else {
      setOpenWeek(week);
      if (selected.week !== week) {
        const firstOfTargetWeek = list.find((a) => a.week === week);
        if (firstOfTargetWeek) {
          setSelectedId(firstOfTargetWeek.id);
          setVariantSelection(null);
          setSelectedGroup(null);
          setRevealedGroupKey(null);
        }
      }
    }
  };

  const fileGroups = pyExplanations(activeFile) ?? emptyExplanationGroups;

  const currentGroupIndex = selectedGroup
    ? fileGroups.findIndex(
        (g) =>
          g.satirlar[0] === selectedGroup.satirlar[0] &&
          g.satirlar[1] === selectedGroup.satirlar[1]
      )
    : -1;

  const currentGroupKey = selectedGroup
    ? `${activeFile}-${selectedGroup.satirlar[0]}-${selectedGroup.satirlar[1]}`
    : "";
  const isRevealed = !recallMode || revealedGroupKey === currentGroupKey;

  // Recall modunu localStorage'dan asenkron yükle (hydration uyumlu ve react compiler lint kurallarına uygun)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("derslik-recall");
      if (saved !== null) {
        const val = saved === "true";
        Promise.resolve().then(() => {
          setRecallMode(val);
        });
      }
    } catch {
      // localStorage erişimi yoksa varsayılan false
    }
  }, []);

  const handleToggleRecall = () => {
    setRecallMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("derslik-recall", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Seçili grup değiştiğinde kod görünümünde ilgili satıra kaydır
  useEffect(() => {
    if (!selectedGroup || openWeek === null) return;
    anchorRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedGroup, openWeek]);

  useEffect(() => {
    if (openWeek === null || !selectedGroup || !gridRef.current || !anchorRef.current || !cardRef.current) return;
    // Grup değişince kart kayarak gelir; ekran boyutu/yazı tipi değişince animasyonsuz yerine oturur (sıçrama yok).
    const place = (animate: boolean) => {
      if (!gridRef.current || !anchorRef.current || !cardRef.current) return;
      const grid = gridRef.current.getBoundingClientRect();
      const anchor = anchorRef.current.getBoundingClientRect();
      const card = cardRef.current;
      card.style.transition = animate ? "" : "none";
      setCardTop(Math.max(0, Math.min(anchor.top - grid.top, grid.height - card.offsetHeight)));
    };
    const update = () => place(false);
    const observer = new ResizeObserver(update);
    observer.observe(gridRef.current);
    observer.observe(anchorRef.current);
    observer.observe(cardRef.current);
    document.fonts?.ready.then(update);
    place(true);
    window.addEventListener("resize", update);
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, [selectedGroup, openWeek]);

  // Klavye gezintisi: ArrowLeft, ArrowRight, Escape (input/textarea odaklı değilken)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (openWeek === null) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Escape") {
        setSelectedGroup(null);
        return;
      }

      if (fileGroups.length === 0) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (!selectedGroup) {
          setSelectedGroup(fileGroups[0]);
          return;
        }
        if (currentGroupIndex >= 0 && currentGroupIndex < fileGroups.length - 1) {
          setSelectedGroup(fileGroups[currentGroupIndex + 1]);
        }
      } else if (event.key === "ArrowLeft") {
        if (!selectedGroup) return;
        event.preventDefault();
        if (currentGroupIndex > 0) {
          setSelectedGroup(fileGroups[currentGroupIndex - 1]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fileGroups, selectedGroup, currentGroupIndex, openWeek]);

  const handleStepPrev = () => {
    if (currentGroupIndex > 0) {
      setSelectedGroup(fileGroups[currentGroupIndex - 1]);
    }
  };

  const handleStepNext = () => {
    if (!selectedGroup && fileGroups.length > 0) {
      setSelectedGroup(fileGroups[0]);
    } else if (currentGroupIndex >= 0 && currentGroupIndex < fileGroups.length - 1) {
      setSelectedGroup(fileGroups[currentGroupIndex + 1]);
    }
  };

  const handleCopyCode = async () => {
    if (!activeFile) return;
    const fullSource = pySource(activeFile);
    let codeToCopy = fullSource;
    if (selectedGroup) {
      const lines = fullSource.replace(/\r\n/g, "\n").split("\n");
      codeToCopy = lines.slice(selectedGroup.satirlar[0] - 1, selectedGroup.satirlar[1]).join("\n");
    }
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Pano API erişimi yoksa yut
    }
  };

  const handleAskCode = () => {
    if (!activeFile) return;
    const fullSource = pySource(activeFile);
    let startLine: number | undefined = undefined;
    let endLine: number | undefined = undefined;
    let source = fullSource;
    let explanation: string | undefined = undefined;

    if (selectedGroup) {
      startLine = selectedGroup.satirlar[0];
      endLine = selectedGroup.satirlar[1];
      const lines = fullSource.replace(/\r\n/g, "\n").split("\n");
      source = lines.slice(startLine - 1, endLine).join("\n");
      explanation =
        selectedGroup.aciklama +
        (selectedGroup.sinav ? `\nSınav notu: ${selectedGroup.sinav}` : "");
    }

    window.dispatchEvent(
      new CustomEvent("study-chat-context", {
        detail: {
          kind: "code",
          file: activeFile,
          startLine,
          endLine,
          source,
          explanation,
        },
      })
    );
    window.dispatchEvent(new CustomEvent("study-chat-open"));
  };

  return (
    <div className="space-y-5">
      <WeekDisclosure
        weeks={weeks}
        openWeek={openWeek}
        onToggle={handleToggleWeek}
        idPrefix="odevler"
        label="Ödev haftaları"
      >
        <div className="space-y-5">
          {openWeek !== null && (
            <div className={isDs ? "flex flex-wrap gap-x-4 gap-y-2" : "flex flex-wrap items-center gap-1.5"}>
              <span className="text-xs font-bold text-stone-400">{isDs ? (list.find((a) => a.week === openWeek)?.section ?? "") : `${openWeek}. Hafta`}</span>
              {list
                .filter((a) => a.week === openWeek)
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      if (a.id !== selected.id) {
                        setSelectedId(a.id);
                        setVariantSelection(null);
                        setSelectedGroup(null);
                        setRevealedGroupKey(null);
                      }
                    }}
                    title={a.title}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors pointer-coarse:min-h-11 pointer-coarse:min-w-11 pointer-coarse:justify-center pointer-coarse:px-3 pointer-coarse:text-sm ${
                      a.id === selected.id ? "bg-stone-900 text-white" : "bg-white text-stone-700 border border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    {a.done ? <CheckCircle className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {isDs ? list.indexOf(a) + 1 : `${a.week}.${a.no}`}
                  </button>
                ))}
            </div>
          )}

          <div ref={gridRef} className="relative grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Sol: ödev, açıklama, açıklamalı kod */}
        <section className="min-w-0 space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              {isDs ? `${selected.section} · Ödev ${list.indexOf(selected) + 1}` : `${selected.week}. Hafta · Ödev ${selected.no}`} · {selected.done ? "Tamamlandı" : "Bekliyor"}
            </p>
            <h2 className="mt-1 text-lg font-bold text-stone-900">{selected.title}</h2>
            <p className="mt-2 text-sm text-stone-700">{selected.brief}</p>
          </div>
          {selected.steps && (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-700">
              {selected.steps.map((s, i) => (
                <li key={i}>{inlineCode(s)}</li>
              ))}
            </ol>
          )}
          {selected.practice && selected.practice.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-800">Pratik yap</p>
              <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-stone-800">
                {selected.practice.map((p, i) => (
                  <li key={i}>{inlineCode(p)}</li>
                ))}
              </ul>
            </div>
          )}
          {activeFile ? (
            <div className="space-y-2">
              {selected.variants && selected.variants.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 pb-1" role="group" aria-label="Kod varyantları">
                  <span className="text-xs font-bold text-stone-400">Varyant:</span>
                  {selected.variants.map((variant) => {
                    const isActive = variant.file === activeFile;
                    return (
                      <button
                        key={variant.file}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => {
                          if (variant.file !== activeFile) {
                            setVariantSelection({ assignmentId: selected.id, file: variant.file });
                            setSelectedGroup(null);
                            setRevealedGroupKey(null);
                          }
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors pointer-coarse:min-h-11 pointer-coarse:px-3 pointer-coarse:text-sm ${
                          isActive
                            ? "bg-stone-900 text-white"
                            : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        {variant.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="break-all text-xs font-bold uppercase tracking-wide text-stone-500">{activeFile}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    aria-label="Kodu panoya kopyala"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 pointer-coarse:min-h-11 pointer-coarse:px-3.5 pointer-coarse:text-sm transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-400"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Kopyalandı</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-stone-500" />
                        <span>
                          {selectedGroup
                            ? `Satırları kopyala (${selectedGroup.satirlar[0]}-${selectedGroup.satirlar[1]})`
                            : "Kodu kopyala"}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAskCode}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 pointer-coarse:min-h-11 pointer-coarse:px-3.5 pointer-coarse:text-sm transition-colors hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>
                      {selectedGroup
                        ? `Aktif satırı sor (${selectedGroup.satirlar[0]}-${selectedGroup.satirlar[1]})`
                        : "Aktif kodu sor"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Anahtar Gezgini (Outline) */}
              {fileGroups.length > 0 && (
                <nav
                  aria-label="Kod adımları gezgini"
                  className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50/80 px-2.5 py-1.5"
                >
                  <span className="mr-1 select-none text-[11px] font-medium text-stone-500">Adımlar:</span>
                  {fileGroups.map((group, idx) => {
                    const isSelected =
                      selectedGroup?.satirlar[0] === group.satirlar[0] &&
                      selectedGroup?.satirlar[1] === group.satirlar[1];
                    const title = getGroupTitle(group);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedGroup(group)}
                        aria-current={isSelected ? "step" : undefined}
                        aria-label={`${idx + 1}. adım: ${title} (Satır ${group.satirlar[0]}-${group.satirlar[1]})`}
                        title={`${idx + 1}. ${title} (Satır ${group.satirlar[0]}-${group.satirlar[1]})`}
                        className={`h-2.5 rounded-full transition-all pointer-coarse:h-4 pointer-coarse:min-w-4 ${
                          isSelected
                            ? "w-7 bg-amber-500 shadow-sm"
                            : "w-2.5 bg-stone-300 hover:w-3.5 hover:bg-stone-400"
                        }`}
                      />
                    );
                  })}
                </nav>
              )}

              <PythonCode
                source={pySource(activeFile)}
                filename={activeFile}
                selectedGroup={selectedGroup}
                anchorRef={anchorRef}
                recallMode={recallMode}
                isRevealed={isRevealed}
                onReveal={() => setRevealedGroupKey(currentGroupKey)}
                onSelectGroup={(group) =>
                  setSelectedGroup((current) =>
                    current?.satirlar[0] === group.satirlar[0] && current.satirlar[1] === group.satirlar[1] ? null : group,
                  )
                }
              />
              {activeFile && (
                <p className="text-xs text-stone-500">
                  Çalıştır: <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-stone-800">
                    {selected.runCommand && activeFile === selected.file
                      ? selected.runCommand
                      : `python ${activeFile}`}
                  </code>
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">Kod henüz yazılmadı.</p>
          )}
        </section>

        {/* Sağ: canlı çalışan karşılık */}
        <section className="order-first min-w-0 space-y-3 rounded-xl border border-stone-200 bg-white p-5 lg:order-none">
          {selectedGroup && (
            <aside
              ref={cardRef}
              id="python-group-explanation"
              style={{ top: cardTop }}
              className="explanation-card absolute left-[calc(50%+0.625rem)] z-20 hidden w-[calc(50%-0.625rem)] rounded-[14px] border border-stone-200 bg-white px-4 py-3 text-stone-700 shadow-xl lg:block"
            >
              <button
                type="button"
                aria-label="Açıklamayı kapat"
                onClick={() => setSelectedGroup(null)}
                className="absolute right-3 top-3 rounded-md p-1 text-stone-500 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Üst satır: Rozet + Kısa Başlık (Kod etiketi kaldırıldı) */}
              <div key={`head-${selectedGroup.satirlar[0]}`} className="explanation-copy mb-2 flex items-center gap-2 pr-7">
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-900">
                  Satır {selectedGroup.satirlar[0]}-{selectedGroup.satirlar[1]}
                </span>
                <span className="truncate text-[13px] font-bold text-stone-900" title={getGroupTitle(selectedGroup)}>
                  {getGroupTitle(selectedGroup)}
                </span>
              </div>

              {/* Adım gezintisi & Aktif Hatırlama Çubuğu */}
              <div className="mb-3 flex items-center justify-between border-y border-stone-100 py-1.5 text-xs text-stone-600">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Önceki kod adımı"
                    disabled={currentGroupIndex <= 0}
                    onClick={handleStepPrev}
                    className="inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Önceki</span>
                  </button>
                  <span className="select-none text-stone-300">|</span>
                  <button
                    type="button"
                    aria-label="Sonraki kod adımı"
                    disabled={currentGroupIndex >= fileGroups.length - 1}
                    onClick={handleStepNext}
                    className="inline-flex items-center gap-0.5 rounded px-2 py-0.5 font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>Sonraki</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <span className="ml-1 font-mono text-[11px] text-stone-500">
                    {currentGroupIndex + 1} / {fileGroups.length}
                  </span>
                </div>

                <label className="flex cursor-pointer select-none items-center gap-1.5 text-[11.5px] text-stone-600">
                  <input
                    type="checkbox"
                    checked={recallMode}
                    onChange={handleToggleRecall}
                    aria-label="Önce kendin açıkla aktif hatırlama modu"
                    className="h-3.5 w-3.5 rounded border-stone-300 accent-amber-600"
                  />
                  <span>Önce kendin açıkla</span>
                </label>
              </div>

              {/* Aktif hatırlama gizle/göster veya açıklama metni */}
              {recallMode && !isRevealed ? (
                <div className="my-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/70 p-3 text-center">
                  <p className="text-xs font-medium text-amber-950">Bu satırlar ne yapıyor? Önce kendin düşün.</p>
                  <button
                    type="button"
                    onClick={() => setRevealedGroupKey(currentGroupKey)}
                    className="mt-2.5 inline-flex items-center rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
                  >
                    Cevabı göster
                  </button>
                </div>
              ) : (
                <>
                  <p
                    key={`body-${selectedGroup.satirlar[0]}`}
                    className="explanation-copy max-w-[62ch] whitespace-pre-wrap text-[13px] leading-[1.6] min-[900px]:text-[14px]"
                  >
                    {explanationText(selectedGroup.aciklama)}
                  </p>
                  {selectedGroup.sinav && (
                    <div key={`exam-${selectedGroup.satirlar[0]}`}>
                      {renderExamNote(selectedGroup.sinav)}
                    </div>
                  )}
                </>
              )}
            </aside>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
              {selected.images?.length ? "GitHub çıktı görselleri" : "Canlı çalıştır"}<span className="font-semibold normal-case tracking-normal text-stone-400 lg:hidden"> · {selected.title}</span>
            </p>
            {selected.sourceUrl && (
              <a
                href={selected.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-amber-700 underline hover:text-amber-800"
              >
                GitHub Kaynağı
              </a>
            )}
          </div>
          {selected.images && selected.images.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {selected.images.map((img, i) => (
                  <div key={i} className="space-y-1.5 rounded-lg border border-stone-200 bg-stone-50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="h-auto w-full rounded border border-stone-200 object-contain bg-white"
                      loading="lazy"
                    />
                    <p className="text-center text-xs text-stone-600">{img.alt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selected.demo === "resize" && <ResizeDemo />}
          {selected.demo === "quantize" && <QuantizeDemo />}
          {selected.demo === "quadrants" && <QuadrantsDemo />}
          {selected.demo === "histogram" && <HistogramDemo />}
          {selected.demo === "histogramTiming" && <HistogramTimingDemo />}
          {selected.demo === "brightness" && <BrightnessDemo />}
          {selected.ds && <VeriYapisiDemo key={selected.id} kind={selected.ds} />}
          {selected.ds && selected.output && <TerminalOutput filename={selected.output} title={`Gerçek Python çıktısı: ${selected.runCommand ?? ""}`} />}
          {!selected.demo && !selected.ds && (!selected.images || selected.images.length === 0) && (
            <p className="text-sm text-stone-500">Bu ödev yapılınca burada çalışacak.</p>
          )}
          </section>
        </div>
      </div>
    </WeekDisclosure>
  </div>
);
}

