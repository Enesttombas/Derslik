"use client";

import { useRef, useState } from "react";
import { Lightbulb, PenLine, Plus, SendHorizontal, Sparkles } from "lucide-react";
import type { AkisKart } from "@/lib/akis-paket";

// "daha çok soru üret", "bu konuda soru ekle" gibi istekler sohbete değil üretim hattına gider.
const URET_ISTEGI = /(soru|kart)[^.?!]{0,40}(üret|ekle|hazırla|oluştur)|(üret|ekle|hazırla|oluştur)[^.?!]{0,40}(soru|kart)|daha[ ]+(çok|fazla)[^.?!]{0,20}soru|(benzer|bunun gibi|şu tarz|aynı tarz)[^.?!]{0,30}soru/i;
const HIZLI: { ad: string; istek: string }[] = [
  { ad: "Benzer 3 soru", istek: "Bu karta benzer sorular" },
  { ad: "Daha zor", istek: "Bu konuda daha zor, tuzaklı sorular" },
  { ad: "Farklı açıdan", istek: "Aynı konuyu farklı bir açıdan sınayan sorular" },
];
export const URETILDI_OLAYI = "akis-uretildi";

// Bağlamı (kod, şıklar, doğru cevap, öğrencinin seçimi) sunucu kart kimliğinden kendisi kurar; cevaplanmadan doğru cevap gizli kalır.
export function AkisSor({ kartId, yanlis, cevaplandi, ipucu, onIpucu, karalamaAcik, onKaralama }: { kartId: string; yanlis: boolean; cevaplandi: boolean; ipucu: number; onIpucu: () => void; karalamaAcik?: boolean; onKaralama?: () => void }) {
  const [acik, setAcik] = useState(false);
  const [soru, setSoru] = useState("");
  const [yanit, setYanit] = useState("");
  const [bekle, setBekle] = useState(false);
  const [hata, setHata] = useState("");
  const iptal = useRef<AbortController | null>(null);

  const uret = async (istek: string) => {
    if (bekle) return;
    setAcik(true);
    setBekle(true);
    setHata("");
    setYanit("");
    try {
      const res = await fetch("/api/feed/akis/uret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kartId, istek: istek.trim().slice(0, 300) || "Bu karta benzer sorular", adet: 3 }),
      });
      const j = (await res.json().catch(() => ({}))) as { kartlar?: AkisKart[]; error?: string };
      if (!res.ok || !j.kartlar?.length) throw new Error(j.error || `Soru üretilemedi (sunucu ${res.status}).`);
      window.dispatchEvent(new CustomEvent(URETILDI_OLAYI, { detail: j.kartlar }));
      setYanit(`${j.kartlar.length} soru eklendi (yapay zekâ üretimi, doğrulanmadı). Akışta bu karttan sonra gelecek.`);
    } catch (e) {
      setHata((e as Error).message);
    } finally {
      setBekle(false);
    }
  };

  const sor = async (metin: string) => {
    const mesaj = metin.trim();
    if (!mesaj || bekle) return;
    if (URET_ISTEGI.test(mesaj)) return uret(mesaj);
    setBekle(true);
    setHata("");
    setYanit("");
    iptal.current?.abort();
    const ac = new AbortController();
    iptal.current = ac;
    try {
      const res = await fetch("/api/feed/akis/sor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kartId, mesaj }),
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
    <div className="akis-sor">
      <div className="akis-arac" role="toolbar" aria-label="Kart araçları">
        {onKaralama && !cevaplandi && (
          <button type="button" className="akis-arac-dugme" data-ikon aria-pressed={karalamaAcik} aria-label="Karalama" title="Karalama" onClick={onKaralama}>
            <PenLine size={17} aria-hidden /> <span>Karala</span>
          </button>
        )}
        {!cevaplandi && ipucu < 3 && (
          <button type="button" className="akis-arac-dugme" data-ton="ipucu" aria-label={`İpucu ${ipucu + 1}/3`} onClick={onIpucu}>
            <Lightbulb size={17} aria-hidden /> <span>İpucu</span> <small>{ipucu}/3</small>
          </button>
        )}
        {yanlis && (
          <button type="button" className="akis-arac-dugme" disabled={bekle} onClick={() => { setAcik(true); void sor("Bu karta neden yanlış cevap verdim? Kısaca açıkla."); }}>
            <span>Neden yanlış?</span>
          </button>
        )}
        <button type="button" className="akis-arac-dugme" data-ikon disabled={bekle} aria-label="Benzer soru üret" title="Benzer soru üret" onClick={() => void uret("Bu karta benzer sorular")}>
          <Plus size={17} aria-hidden /> <span>Benzer</span>
        </button>
        <button type="button" className="akis-arac-dugme" data-ton="ana" aria-expanded={acik} onClick={() => setAcik((x) => !x)}>
          <Sparkles size={17} aria-hidden /> <span>Sor</span>
        </button>
      </div>
      {acik && (
        <div className="akis-hizli" role="group" aria-label="Hızlı soru üret">
          {HIZLI.map((h) => (
            <button key={h.ad} type="button" disabled={bekle} onClick={() => void uret(h.istek)}>{h.ad}</button>
          ))}
        </div>
      )}
      {acik && (
        <form className="akis-sor-form" onSubmit={(e) => { e.preventDefault(); void sor(soru); setSoru(""); }}>
          <input value={soru} maxLength={500} onChange={(e) => setSoru(e.target.value)} placeholder="Sor ya da “şuna benzer soru üret” yaz" aria-label="Bu karta sor" />
          <button type="submit" aria-label="Gönder" disabled={bekle || !soru.trim()}><SendHorizontal size={18} /></button>
        </form>
      )}
      {(yanit || bekle) && <p className="akis-sor-yanit">{yanit || "…"}</p>}
      {hata && <p className="akis-sor-yanit" role="alert">{hata}</p>}
    </div>
  );
}
