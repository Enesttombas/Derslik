"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Eye, Lightbulb, X } from "lucide-react";

const TUR_AD: Record<string, string> = {
  "kod-oku": "Kod oku",
  "ne-olur": "Ne olur?",
  "cikti-tahmin": "Çıktı tahmini",
  "hata-bul": "Hata bul",
  acikla: "Açıkla",
  sinav: "Doğru / Yanlış",
  odev: "Sıralama",
  karmasiklik: "Karmaşıklık",
};
const HARF = ["A", "B", "C", "D", "E"];

// Anında, ağsız ipucu merdiveni: yön → daralt → neredeyse söyle. Kademe sayısı olaya yazılır.
const YON: Record<string, string> = {
  "kod-oku": "Kodu satır satır izle; her satırdan sonra değişkenlerin değerini aklında yaz.",
  "ne-olur": "Değişen ifadenin hangi değeri ya da koşulu etkilediğine bak.",
  "cikti-tahmin": "Küçük bir girdiyle elle çalıştır; döngünün her turunu yaz.",
  "hata-bul": "Girdiyi elle koştur; ilk beklenmeyen değerin çıktığı satır hatalıdır.",
  acikla: "Cevabı önce kendi cümlelerinle söyle, sonra aç.",
  sinav: "\"Her zaman\", \"asla\" gibi kesin ifadelere dikkat et.",
  odev: "Önce veriyi hazırlayan adımı bul, sonucu üreten adım en sonda gelir.",
  karmasiklik: "İç içe döngüleri say; her biri kaç kez dönüyor?",
};
const ilkCumle = (t: string) => (t.match(/^[^.!?]+[.!?]/)?.[0] ?? t).replace(/`/g, "").trim();
const yarim = (t: string) => {
  const c = ilkCumle(t);
  const kes = c.slice(0, Math.max(24, Math.floor(c.length * 0.45)));
  return kes.replace(/[ ]+[^ ]*$/, "") + " …";
};
function ipucuMetni(kart: AkisKart, seviye: number): string {
  if (seviye === 1) return `${kart.etiketler.slice(0, 2).join(" · ")} — ${YON[kart.tur] ?? "Soruyu parçalara böl."}`;
  if (kart.tur === "hata-bul") {
    const a = kart.hataSatir;
    return seviye === 2 ? `Hata ${Math.max(1, a - 3)}–${a + 3}. satırlar arasında.` : `Hata ${Math.max(1, a - 1)}–${a + 1}. satırlar arasında; ortadaki en şüpheli.`;
  }
  if ("secenekler" in kart) return seviye === 2 ? "İki yanlış şık elendi." : "Yalnız iki şık kaldı.";
  return seviye === 2 ? yarim(kart.aciklama) : ilkCumle(kart.aciklama);
}
import type { AkisKart } from "@/lib/akis-paket";
import type { Secim } from "@/lib/akis-olay";
import { secenekSirasi } from "@/lib/akis-oturum";
import { KAPSAM, type KodSatiri } from "@/lib/akis-yukle";
import { Karalama } from "@/components/karalama";
import { AkisKod } from "./akis-kod";
import { AkisSor } from "./akis-sor";

interface Props {
  kart: AkisKart;
  kod: KodSatiri[];
  tohum: number;
  /** kart ilk kez çözüldüğünde bir kez çağrılır */
  onCevap: (dogruMu: boolean, secim: Secim, ipucu: number) => void;
  onIlerle: () => void;
  /** akıştaki sıra numarası (1'den) */
  no?: number;
}

// `kod` parçalarını satır içi koda çevirir.
function Metin({ t }: { t: string }) {
  return (
    <>
      {t.split("`").map((p, i) => (i % 2 ? <code key={i}>{p}</code> : <span key={i}>{p}</span>))}
    </>
  );
}

export function AkisKartGovde({ kart, kod, tohum, onCevap, onIlerle, no }: Props) {
  const [sonuc, setSonuc] = useState<"d" | "y" | null>(null);
  const [secilen, setSecilen] = useState<number | null>(null);
  const [acildi, setAcildi] = useState(false);
  const [sira, setSira] = useState<number[]>([]);

  const [ipucu, setIpucu] = useState(0);
  const [karalama, setKaralama] = useState(false);

  const bitir = (dogruMu: boolean, secim: Secim) => {
    if (sonuc) return;
    setSonuc(dogruMu ? "d" : "y");
    onCevap(dogruMu, secim, ipucu);
  };

  const secenekler = "secenekler" in kart ? kart.secenekler : [];
  const sirali = useMemo(() => secenekSirasi(kart.id, secenekler.length, tohum), [kart.id, secenekler.length, tohum]);
  const elenen = useMemo(() => {
    if (!("dogru" in kart) || secenekler.length === 0) return new Set<number>();
    const yanlislar = sirali.filter((g) => g !== kart.dogru);
    return new Set(yanlislar.slice(0, ipucu >= 3 ? yanlislar.length - 1 : ipucu >= 2 ? Math.ceil(yanlislar.length / 2) : 0));
  }, [kart, secenekler.length, sirali, ipucu]);
  const adimSirasi = useMemo(
    () => (kart.tur === "odev" ? secenekSirasi(kart.id, kart.adimlar.length, tohum) : []),
    [kart, tohum],
  );

  const meta =
    kart.odev && kart.dosya && kart.satirlar
      ? `${KAPSAM[kart.ders].odevler[kart.odev]?.[0] ?? ""} ${kart.dosya.split("/").pop()} · ${kart.satirlar[0]}–${kart.satirlar[1]}`.trim()
      : `Hafta ${kart.hafta} · ${KAPSAM[kart.ders].notlar[String(kart.hafta)] ?? "Ders notu"}`;

  return (
    <div className="akis-govde">
      <div className="akis-baslik">
        <span className="akis-tur" data-tur={kart.tur}>{TUR_AD[kart.tur] ?? kart.tur}</span>
        {kart.id.startsWith("uret-") && <span className="akis-tur" data-tur="uret">Üretilmiş · doğrulanmadı</span>}
        {no !== undefined && <span className="akis-sira-no" aria-hidden>{String(no).padStart(2, "0")}</span>}
      </div>
      <p className="akis-meta">{meta}</p>
      <h2 className="akis-soru"><Metin t={kart.soru} /></h2>

      {kart.tur === "ne-olur" && (
        <p className="akis-fark"><del>{kart.degisiklik.eski}</del><ins>{kart.degisiklik.yeni}</ins></p>
      )}
      {kart.tur === "hata-bul" ? (
        <AkisKod
          dosya={kart.dosya?.split("/").pop()}
          satirlar={kod}
          onSatir={sonuc ? undefined : (n) => { setSecilen(n); bitir(n === kart.hataSatir, { tip: "satir", n }); }}
          secili={secilen}
          dogru={sonuc ? kart.hataSatir : null}
        />
      ) : (
        <AkisKod satirlar={kod} dosya={kart.dosya?.split("/").pop()} />
      )}

      {!sonuc && ipucu > 0 && (
        <div className="akis-ipucu" role="status">
          <Lightbulb aria-hidden />
          <ol>
            {Array.from({ length: ipucu }, (_, i) => (
              <li key={i}><Metin t={ipucuMetni(kart, i + 1)} /></li>
            ))}
          </ol>
        </div>
      )}

      <AkisSor key={kart.id} kartId={kart.id} yanlis={sonuc === "y"} cevaplandi={!!sonuc} ipucu={ipucu} onIpucu={() => setIpucu((n) => Math.min(3, n + 1))} karalamaAcik={karalama} onKaralama={() => setKaralama((k) => !k)} />
      {!sonuc && karalama && <Karalama acik onKapat={() => setKaralama(false)} />}

      {secenekler.length > 0 && "dogru" in kart && (
        <div className="akis-secenekler" role="group">
          {sirali.map((gercek) => {
            const durum = !sonuc ? (elenen.has(gercek) ? "elendi" : undefined) : gercek === kart.dogru ? "dogru" : gercek === secilen ? "yanlis" : "sonuk";
            return (
              <button
                key={gercek}
                type="button"
                disabled={!!sonuc || elenen.has(gercek)}
                data-durum={durum}
                className="akis-secenek"
                onClick={() => { setSecilen(gercek); bitir(gercek === kart.dogru, { tip: "sik", index: gercek }); }}
              >
                <b className="akis-harf" aria-hidden>{HARF[sirali.indexOf(gercek)]}</b>
                <span className="akis-secenek-metin"><Metin t={secenekler[gercek]} /></span>
              </button>
            );
          })}
        </div>
      )}

      {kart.tur === "sinav" && !sonuc && (
        <div className="akis-ikili">
          <button type="button" aria-label="Yanlış" className="akis-yuvarlak" data-tur="yanlis" onClick={() => bitir(kart.dogruMu === false, { tip: "dogruMu", deger: false })}><X /></button>
          <button type="button" aria-label="Doğru" className="akis-yuvarlak" data-tur="dogru" onClick={() => bitir(kart.dogruMu === true, { tip: "dogruMu", deger: true })}><Check /></button>
        </div>
      )}

      {kart.tur === "odev" && (
        <ol className="akis-adimlar">
          {adimSirasi.map((gercek) => {
            const no = sira.indexOf(gercek);
            return (
              <li key={gercek}>
                <button
                  type="button"
                  disabled={!!sonuc || no !== -1}
                  data-secili={no !== -1 || undefined}
                  className="akis-secenek"
                  onClick={() => {
                    const yeni = [...sira, gercek];
                    setSira(yeni);
                    if (gercek !== yeni.length - 1) bitir(false, { tip: "sira", sira: yeni });
                    else if (yeni.length === kart.adimlar.length) bitir(true, { tip: "sira", sira: yeni });
                  }}
                >
                  {no !== -1 && <b className="akis-no">{no + 1}</b>}
                  <span>{kart.adimlar[gercek]}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {kart.tur === "acikla" && !sonuc && (
        !acildi ? (
          <div className="akis-ikili">
            <button type="button" aria-label="Açıklamayı göster" className="akis-yuvarlak" onClick={() => setAcildi(true)}><Eye /></button>
          </div>
        ) : (
          <div className="akis-ikili">
            <button type="button" aria-label="Tekrar" className="akis-yuvarlak" data-tur="yanlis" onClick={() => bitir(false, { tip: "kendi", anladim: false })}><X /></button>
            <button type="button" aria-label="Anladım" className="akis-yuvarlak" data-tur="dogru" onClick={() => bitir(true, { tip: "kendi", anladim: true })}><Check /></button>
          </div>
        )
      )}

      {(sonuc || (kart.tur === "acikla" && acildi)) && (
        <div className="akis-aciklama" data-durum={sonuc ?? undefined}>
          {sonuc && <span className="akis-isaret" aria-hidden>{sonuc === "d" ? <Check /> : <X />}</span>}
          <p><Metin t={kart.aciklama} /></p>
          {"kanit" in kart && <pre className="akis-kanit">{kart.kanit}</pre>}
        </div>
      )}

      {sonuc && (
        <button type="button" aria-label="Sonraki" className="akis-sonraki" onClick={onIlerle}><ChevronDown /></button>
      )}
    </div>
  );
}
