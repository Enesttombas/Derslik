"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine, Trash2, Undo2, X } from "lucide-react";

type Nokta = { x: number; y: number };
type Cizgi = { pts: Nokta[]; renk: string | null; kalinlik: number; sil: boolean };

const RENKLER: { ad: string; deger: string | null; gorunum: string }[] = [
  { ad: "Siyah", deger: null, gorunum: "#1c1917" },
  { ad: "Mavi", deger: "#2563eb", gorunum: "#2563eb" },
  { ad: "Kırmızı", deger: "#dc2626", gorunum: "#dc2626" },
  { ad: "Yeşil", deger: "#16a34a", gorunum: "#16a34a" },
];
const KALINLIKLAR = [
  { ad: "İnce", deger: 2 },
  { ad: "Orta", deger: 4 },
  { ad: "Kalın", deger: 8 },
];
const SILGI_CARPANI = 4;

const dugme = "grid h-9 w-9 place-items-center rounded-full text-stone-600 transition-colors hover:bg-stone-200";

// Soru üstünde işlem yapmak için serbest çizim alanı (parmak/kalem). Karta özel, kaydedilmez.
// `yan`: kalem düğmesinin yanında (aynı satırda) gösterilecek ek düğmeler.
// Kontrollü kip: `acik` verilirse açma düğmesi çizilmez, dışarıdaki araç çubuğu açıp kapatır.
export function Karalama({ yan, acik: dis, onKapat }: { yan?: React.ReactNode; acik?: boolean; onKapat?: () => void }) {
  const [ic, setIc] = useState(false);
  const kontrollu = dis !== undefined;
  const acik = kontrollu ? dis : ic;
  const setAcik = (f: boolean | ((a: boolean) => boolean)) => {
    const yeni = typeof f === "function" ? f(acik) : f;
    if (kontrollu) {
      if (!yeni) onKapat?.();
    } else setIc(yeni);
  };
  const [renk, setRenk] = useState<string | null>(null);
  const [kalinlik, setKalinlik] = useState(2);
  const [silgi, setSilgi] = useState(false);
  const tuval = useRef<HTMLCanvasElement>(null);
  const cizgiler = useRef<Cizgi[]>([]);
  const aktif = useRef<Cizgi | null>(null);

  const ciz = useCallback(() => {
    const c = tuval.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const k = window.devicePixelRatio || 1;
    const varsayilan = getComputedStyle(c).color;
    g.clearRect(0, 0, c.width, c.height);
    g.lineCap = "round";
    g.lineJoin = "round";
    for (const cz of [...cizgiler.current, ...(aktif.current ? [aktif.current] : [])]) {
      if (cz.pts.length === 0) continue;
      g.globalCompositeOperation = cz.sil ? "destination-out" : "source-over";
      g.lineWidth = cz.kalinlik * (cz.sil ? SILGI_CARPANI : 1) * k;
      g.strokeStyle = cz.renk ?? varsayilan;
      g.beginPath();
      g.moveTo(cz.pts[0].x, cz.pts[0].y);
      for (const p of cz.pts.slice(1)) g.lineTo(p.x, p.y);
      if (cz.pts.length === 1) g.lineTo(cz.pts[0].x + 0.1, cz.pts[0].y);
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";
  }, []);

  useEffect(() => {
    const c = tuval.current;
    if (!acik || !c) return;
    const boyutla = () => {
      const k = window.devicePixelRatio || 1;
      const r = c.getBoundingClientRect();
      c.width = Math.round(r.width * k);
      c.height = Math.round(r.height * k);
      ciz();
    };
    boyutla();
    const ro = new ResizeObserver(boyutla);
    ro.observe(c);
    return () => ro.disconnect();
  }, [acik, ciz]);

  const nokta = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = tuval.current!;
    const r = c.getBoundingClientRect();
    const k = c.width / r.width;
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
  };

  return (
    <div className="flex flex-col gap-2" onWheel={(e) => e.stopPropagation()}>
      {!kontrollu && (
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={acik ? "Karalamayı kapat" : "Karalama alanı"}
          aria-pressed={acik}
          onClick={() => setAcik((a) => !a)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
        >
          <PenLine className="h-5 w-5" />
        </button>
        {yan}
      </div>
      )}
      {acik && (
        <div className="overflow-hidden rounded-2xl border border-stone-200">
          <div className="bg-[repeating-linear-gradient(transparent,transparent_27px,var(--border)_28px)]">
            <canvas
              ref={tuval}
              aria-label="Karalama tuvali"
              className="block h-44 sm:h-56 w-full touch-none text-stone-900"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                aktif.current = { pts: [nokta(e)], renk, kalinlik, sil: silgi };
                ciz();
              }}
              onPointerMove={(e) => {
                if (!aktif.current) return;
                aktif.current.pts.push(nokta(e));
                ciz();
              }}
              onPointerUp={() => {
                if (aktif.current) cizgiler.current.push(aktif.current);
                aktif.current = null;
                ciz();
              }}
              onPointerCancel={() => {
                aktif.current = null;
                ciz();
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-stone-200 bg-stone-50/80 px-2 py-1.5" role="toolbar" aria-label="Karalama araçları">
            <div className="flex items-center gap-1" role="group" aria-label="Renk">
              {RENKLER.map((r) => (
                <button
                  key={r.ad}
                  type="button"
                  aria-label={r.ad}
                  aria-pressed={!silgi && renk === r.deger}
                  onClick={() => {
                    setRenk(r.deger);
                    setSilgi(false);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full"
                >
                  <span
                    className="h-5 w-5 rounded-full border-2"
                    style={{
                      background: r.gorunum,
                      borderColor: !silgi && renk === r.deger ? "#78716c" : "transparent",
                      boxShadow: "0 0 0 1px rgba(0,0,0,.15)",
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1" role="group" aria-label="Kalınlık">
              {KALINLIKLAR.map((k) => (
                <button
                  key={k.ad}
                  type="button"
                  aria-label={k.ad}
                  aria-pressed={kalinlik === k.deger}
                  onClick={() => setKalinlik(k.deger)}
                  className={`${dugme} ${kalinlik === k.deger ? "bg-stone-200" : ""}`}
                >
                  <span className="rounded-full bg-stone-800" style={{ width: 6 + k.deger * 1.5, height: 6 + k.deger * 1.5 }} />
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-0.5">
              <button type="button" aria-label="Silgi" aria-pressed={silgi} onClick={() => setSilgi((s) => !s)} className={`${dugme} ${silgi ? "bg-stone-200 text-stone-900" : ""}`}>
                <Eraser className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Geri al"
                onClick={() => {
                  cizgiler.current.pop();
                  ciz();
                }}
                className={dugme}
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Tümünü temizle"
                onClick={() => {
                  cizgiler.current = [];
                  ciz();
                }}
                className={dugme}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Kapat" onClick={() => setAcik(false)} className={dugme}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
