"use client";

import React, { useRef, useState } from "react";
import { LoaderCircle, SendHorizontal, Sparkles, X } from "lucide-react";
import type { Course } from "@/app/derslik-client";
import type { FeedCard } from "@/lib/study-feed";
import { SvgSekil } from "@/components/svg-sekil";
import { svgBul } from "@/lib/svg-guvenli";

const TIPLER: { id: string; ad: string }[] = [
  { id: "kavram", ad: "Kavram" },
  { id: "sinav", ad: "Sınav tarzı" },
  { id: "tuzakli", ad: "Tuzaklı" },
  { id: "hesap", ad: "Hesaplamalı" },
  { id: "karsilastir", ad: "Karşılaştırma" },
  { id: "ozet", ad: "Özet" },
];
const ADETLER = [3, 5, 8];

interface UretSonucu {
  eklenen?: number;
  dersler?: { kod: string; adet: number; hata: boolean }[];
  error?: string;
}

async function uretIste(govde: Record<string, unknown>): Promise<UretSonucu & { ok: boolean }> {
  try {
    const r = await fetch("/api/cards/uret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(govde),
    });
    const j = (await r.json().catch(() => ({}))) as UretSonucu;
    return { ...j, ok: r.ok && (j.eklenen ?? 0) > 0, error: r.ok ? j.error : j.error || `Soru üretilemedi (sunucu ${r.status}).` };
  } catch {
    return { ok: false, error: "Sunucuya ulaşılamadı." };
  }
}

const ozet = (s: UretSonucu) =>
  `${s.eklenen} soru eklendi` +
  (s.dersler && s.dersler.length > 1 ? ` · ${s.dersler.filter((d) => d.adet > 0).map((d) => `${d.kod} ${d.adet}`).join(", ")}` : "") +
  " · yapay zekâ üretimi, doğrulanmadı";

// Üst çubuktaki "Üret" sayfası: ders (ya da tüm dersler), tür, serbest istek ve adet.
export function UretPaneli({ courses, courseId, onKapat, onUretildi }: { courses: Course[]; courseId: string | null; onKapat: () => void; onUretildi: () => void }) {
  const [ders, setDers] = useState<string>(courseId ?? "");
  const [tip, setTip] = useState<string | null>(null);
  const [istek, setIstek] = useState("");
  const [adet, setAdet] = useState(5);
  const [bekle, setBekle] = useState(false);
  const [mesaj, setMesaj] = useState<{ ok: boolean; metin: string } | null>(null);

  const gonder = async () => {
    if (bekle) return;
    setBekle(true);
    setMesaj(null);
    const s = await uretIste({ ...(ders ? { courseId: ders } : {}), ...(tip ? { tip } : {}), ...(istek.trim() ? { istek: istek.trim() } : {}), adet });
    setBekle(false);
    if (s.ok) {
      setMesaj({ ok: true, metin: ozet(s) });
      onUretildi();
    } else setMesaj({ ok: false, metin: s.error || "Soru üretilemedi." });
  };

  return (
    <div className="sf-perde" onClick={onKapat}>
      <div className="sf-sayfa" role="dialog" aria-label="Soru üret" onClick={(e) => e.stopPropagation()}>
        <div className="sf-sayfa-ust">
          <h3>Soru üret</h3>
          <button type="button" aria-label="Kapat" onClick={onKapat}><X size={18} /></button>
        </div>

        <label className="sf-etiket" htmlFor="sf-ders">Ders</label>
        <select id="sf-ders" className="sf-alan" value={ders} onChange={(e) => setDers(e.target.value)}>
          <option value="">Tüm dersler (her birinden 3)</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
          ))}
        </select>

        <span className="sf-etiket">Tür</span>
        <div className="sf-cipler" role="group" aria-label="Soru türü">
          <button type="button" aria-pressed={tip === null} onClick={() => setTip(null)}>Karışık</button>
          {TIPLER.map((t) => (
            <button key={t.id} type="button" aria-pressed={tip === t.id} onClick={() => setTip(t.id)}>{t.ad}</button>
          ))}
        </div>

        <label className="sf-etiket" htmlFor="sf-istek">İstediğin konu ya da tarz <small>(isteğe bağlı)</small></label>
        <textarea id="sf-istek" className="sf-alan" rows={3} maxLength={300} value={istek} onChange={(e) => setIstek(e.target.value)} placeholder="Örn. “vize için histogram eşitleme”, “bunun gibi, ama daha zor”" />

        <div className="sf-satir">
          <div className="sf-cipler" role="group" aria-label="Adet">
            {ADETLER.map((a) => (
              <button key={a} type="button" aria-pressed={adet === a} disabled={ders === "" && a > 3} onClick={() => setAdet(a)}>{a} soru</button>
            ))}
          </div>
          <button type="button" className="sf-ana" disabled={bekle} onClick={() => void gonder()}>
            {bekle ? <LoaderCircle className="sf-don" size={16} /> : <Sparkles size={16} />}
            <span>{bekle ? "Üretiliyor…" : "Üret"}</span>
          </button>
        </div>
        {mesaj && <p className="sf-mesaj" data-ok={mesaj.ok} role={mesaj.ok ? "status" : "alert"}>{mesaj.metin}</p>}
      </div>
    </div>
  );
}

// Kart üstünde: bu karta Sor + bu karttan benzerini üret.
export function KartYZ({ card, cevapAcik, onUretildi }: { card: FeedCard; cevapAcik: boolean; onUretildi: () => void }) {
  const [acik, setAcik] = useState(false);
  const [menu, setMenu] = useState(false);
  const [soru, setSoru] = useState("");
  const [yanit, setYanit] = useState("");
  const [bekle, setBekle] = useState(false);
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [sekil, setSekil] = useState<string | null>(null);
  const iptal = useRef<AbortController | null>(null);

  const benzer = async (istek: string) => {
    if (bekle) return;
    setBekle(true);
    setHata("");
    setBilgi("");
    const s = await uretIste({ courseId: card.courseId, kartId: card.id, istek, adet: 3 });
    setBekle(false);
    if (s.ok) {
      setBilgi(ozet(s));
      onUretildi();
    } else setHata(s.error || "Soru üretilemedi.");
  };

  const ciz = async () => {
    if (bekle) return;
    setBekle(true);
    setHata("");
    setBilgi("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content:
                `Ders: ${card.courseTitle}\nSoru: ${card.prompt}\n` +
                (cevapAcik ? `Cevap: ${card.answer}\n` : "") +
                "\nBu soruyu anlatan TEK bir SVG şeması üret. Yalnız <svg>…</svg> döndür, başka metin yazma. " +
                "viewBox='0 0 320 180' benzeri, yalnız line/path/rect/circle/polygon/text/g, çizgilerde stroke='currentColor' fill='none' stroke-width='2', " +
                "özniteliklerde tek tırnak, script/style/image/href yok, etiketler kısa ve Türkçe, 320 genişliğe sığsın.",
            },
          ],
        }),
      });
      if (!res.ok || !res.body) throw new Error("yanıt alınamadı");
      const okuyucu = res.body.getReader();
      const cozucu = new TextDecoder();
      let tampon = "";
      let tum = "";
      for (;;) {
        const { done, value } = await okuyucu.read();
        if (done) break;
        tampon += cozucu.decode(value, { stream: true });
        const parcalar = tampon.split(/\r?\n\r?\n/);
        tampon = parcalar.pop() ?? "";
        for (const parca of parcalar) {
          const satir = parca.trim();
          if (!satir.startsWith("data:")) continue;
          try {
            const d = (JSON.parse(satir.slice(5).trim()) as { delta?: string }).delta;
            if (typeof d === "string") tum += d;
          } catch {
            /* bölünmüş parça */
          }
        }
      }
      const svg = svgBul(tum);
      if (svg) setSekil(svg);
      else setHata("Şema üretilemedi; tekrar dene.");
    } catch {
      setHata("Şema üretilemedi.");
    } finally {
      setBekle(false);
    }
  };

  const sor = async (metin: string) => {
    const m = metin.trim();
    if (!m || bekle) return;
    setBekle(true);
    setHata("");
    setBilgi("");
    setYanit("");
    iptal.current?.abort();
    const ac = new AbortController();
    iptal.current = ac;
    const baglam =
      `Öğrencinin çalıştığı kart (${card.courseCode} — ${card.courseTitle}):\nSoru: ${card.prompt}\n` +
      (cevapAcik ? `Cevap: ${card.answer}\n` : "Öğrenci henüz cevabı görmedi: doğru cevabı açıkça söyleme, yönlendir.\n") +
      `\nÖğrencinin mesajı: ${m}`;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: baglam }] }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error("yanıt alınamadı");
      const okuyucu = res.body.getReader();
      const cozucu = new TextDecoder();
      let tampon = "";
      for (;;) {
        const { done, value } = await okuyucu.read();
        if (done) break;
        tampon += cozucu.decode(value, { stream: true });
        const parcalar = tampon.split(/\r?\n\r?\n/);
        tampon = parcalar.pop() ?? "";
        for (const parca of parcalar) {
          const satir = parca.trim();
          if (!satir.startsWith("data:")) continue;
          const veri = satir.slice(5).trim();
          if (veri === "[DONE]") continue;
          try {
            const d = (JSON.parse(veri) as { delta?: string }).delta;
            if (typeof d === "string") setYanit((y) => y + d);
          } catch {
            /* bölünmüş parça */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setHata("Yanıt alınamadı.");
    } finally {
      setBekle(false);
    }
  };

  return (
    <div className="sf-yz">
      <div className="sf-yz-arac" role="toolbar" aria-label="Yapay zekâ araçları">
        <button type="button" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><Sparkles size={15} aria-hidden /><span>Yapay zekâ</span></button>
        {menu && (
          <>
            <button type="button" aria-expanded={acik} onClick={() => setAcik((x) => !x)}><span>Sor</span></button>
            <button type="button" disabled={bekle} onClick={() => void benzer("Bu karta benzer sorular")}><span>Benzer</span></button>
            <button type="button" disabled={bekle} onClick={() => void benzer("Bu konuda daha zor, tuzaklı sorular")}><span>Zor</span></button>
            <button type="button" disabled={bekle} onClick={() => void ciz()}><span>Şema</span></button>
          </>
        )}
        {bekle && <LoaderCircle className="sf-don" size={15} aria-label="Bekleniyor" />}
      </div>
      {acik && (
        <form className="sf-yz-form" onSubmit={(e) => { e.preventDefault(); void sor(soru); setSoru(""); }}>
          <input value={soru} maxLength={500} onChange={(e) => setSoru(e.target.value)} placeholder="Bu kart hakkında sor" aria-label="Bu karta sor" />
          <button type="submit" aria-label="Gönder" disabled={bekle || !soru.trim()}><SendHorizontal size={16} /></button>
        </form>
      )}
      {(yanit || (bekle && acik)) && <p className="sf-yz-yanit">{yanit || "…"}</p>}
      {sekil && <SvgSekil svg={sekil} />}
      {bilgi && <p className="sf-mesaj" data-ok="true" role="status">{bilgi}</p>}
      {hata && <p className="sf-mesaj" data-ok="false" role="alert">{hata}</p>}
    </div>
  );
}
