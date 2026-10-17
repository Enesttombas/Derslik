"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { AkisKart, AkisTur } from "@/lib/akis-paket";
import { pakKartId, type Secim } from "@/lib/akis-olay";
import {
  etiketZayifligi, ilerlemeKaydet, kapsamSecenekleri, kartlariSec,
  type AkisDers, type AkisSecim, type Ilerleme, type Kapsam,
} from "@/lib/akis-oturum";
import { AKIS_KARTLARI, KAPSAM, kodBlogu, type KodSatiri } from "@/lib/akis-yukle";
import { AkisKartGovde } from "./akis-kart";

const DERSLER: { kod: AkisDers; ad: string }[] = [
  { kod: "EBLG351", ad: "Görüntü İşleme" },
  { kod: "EBLG359", ad: "Algoritma Analizi" },
];
const SECIM_ANAHTARI = "derslik-akis-secim-v2";
const ILERLEME_ANAHTARI = "derslik-akis-ilerleme-v1";
const BEKLEYEN_ANAHTARI = "derslik-akis-bekleyen-v1";

// Sunucuya gidemeyen olaylar aynı eventId ile saklanır; sunucu idempotent olduğundan tekrar göndermek güvenli.
const gonder = async (olay: Record<string, unknown>): Promise<boolean> => {
  try {
    const r = await fetch("/api/feed/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(olay),
      keepalive: true,
    });
    return r.ok || (r.status >= 400 && r.status < 500 && r.status !== 401); // kalıcı red: tekrar deneme
  } catch {
    return false;
  }
};
const bekleyenleriGonder = async () => {
  const liste = oku<Record<string, unknown>[]>(BEKLEYEN_ANAHTARI) ?? [];
  const kalan: Record<string, unknown>[] = [];
  for (const o of liste) if (!(await gonder(o))) kalan.push(o);
  yaz(BEKLEYEN_ANAHTARI, kalan);
};
const olayYolla = async (olay: Record<string, unknown>) => {
  if (await gonder(olay)) return;
  yaz(BEKLEYEN_ANAHTARI, [...(oku<Record<string, unknown>[]>(BEKLEYEN_ANAHTARI) ?? []), olay].slice(-200));
};

interface SunucuDurumu {
  durumlar: { id: string; dogru: number; yanlis: number; tercih: "like" | "dislike" | null; due: boolean }[];
  uretilenler?: AkisKart[];
}
// Sunucu doğruluk kaynağıdır: yerel sayaçların üstüne yazar, vade ve tercihi getirir.
const sunucuyuBirlestir = (yerel: Ilerleme, s: SunucuDurumu): Ilerleme => {
  const sonuc: Ilerleme = { ...yerel };
  for (const d of s.durumlar) {
    const eski = yerel[d.id];
    sonuc[d.id] = {
      d: d.dogru,
      y: d.yanlis,
      son: eski?.son ?? (d.yanlis > d.dogru ? "y" : d.dogru > 0 ? "d" : null),
      due: d.due,
      tercih: d.tercih,
    };
  }
  return sonuc;
};
const sunucuDurumu = async (): Promise<SunucuDurumu | null> => {
  try {
    const r = await fetch("/api/feed/akis", { signal: AbortSignal.timeout(2500) });
    return r.ok ? ((await r.json()) as SunucuDurumu) : null;
  } catch {
    return null;
  }
};

const oku = <T,>(anahtar: string): T | null => {
  try {
    const h = localStorage.getItem(anahtar);
    return h ? (JSON.parse(h) as T) : null;
  } catch {
    return null;
  }
};
const yaz = (anahtar: string, deger: unknown) => {
  try {
    localStorage.setItem(anahtar, JSON.stringify(deger));
  } catch {
    /* özel pencere: sessizce geç */
  }
};

const kapsamEtiketi = (ders: AkisDers, k: Kapsam) => {
  if (k.tip === "genel") return "Genel";
  const kp = KAPSAM[ders];
  if (k.tip === "not") return `Hafta ${k.hafta} notları`;
  return k.odev ? `${kp.odevler[k.odev]?.[0] ?? ""} ${kp.odevler[k.odev]?.[1] ?? k.odev}`.trim() : `Hafta ${k.hafta} ödevleri`;
};

// Üç grup yeter: kod okuma/çıktı/hata kartları, teori (doğru-yanlış, sıralama, karmaşıklık) ve hepsi.
const TURLER: { turler: AkisTur[]; ad: string }[] = [
  { turler: [], ad: "Hepsi" },
  { turler: ["ne-olur", "cikti-tahmin", "kod-oku", "hata-bul"], ad: "Kod" },
  { turler: ["sinav", "odev", "karmasiklik"], ad: "Teori" },
];

export function AkisFeed() {
  const [secim, setSecim] = useState<AkisSecim | null>(null);
  const [ilerleme, setIlerleme] = useState<Ilerleme>({});
  const [kartlar, setKartlar] = useState<AkisKart[]>([]);
  const [idx, setIdx] = useState(0);
  const [kodlar, setKodlar] = useState<Record<string, KodSatiri[]>>({});
  const [cevaplar, setCevaplar] = useState<Record<string, boolean>>({});
  const [tohum, setTohum] = useState(1);
  const tekrarEdilen = useRef<Set<string>>(new Set());
  const idxRef = useRef(0);
  const havuz = useRef<AkisKart[]>(AKIS_KARTLARI); // paket kartları + kullanıcının ürettikleri
  const [sayfa, setSayfa] = useState(false);
  const [hazir, setHazir] = useState(false);
  const [en, setEn] = useState(0); // ulaşılan en ileri kart: görülen kartların cevap durumu bellekte kalır
  const akis = useRef<HTMLDivElement>(null);

  const baslat = useCallback((s: AkisSecim, il: Ilerleme) => {
    setSecim(s);
    setKartlar(kartlariSec(havuz.current, s, il));
    setIdx(0);
    setEn(0);
    akis.current?.scrollTo({ top: 0 });
    tekrarEdilen.current = new Set();
    setCevaplar({});
    setTohum((t) => t + 1);
    setSayfa(false);
    yaz(SECIM_ANAHTARI, s);
  }, []);

  useEffect(() => {
    // localStorage yalnız istemcide var; ilk boyamadan sonra oku.
    let iptal = false;
    void (async () => {
      await bekleyenleriGonder();
      const sunucu = await sunucuDurumu();
      if (iptal) return;
      havuz.current = [...AKIS_KARTLARI, ...(sunucu?.uretilenler ?? [])];
      const yerel = oku<Ilerleme>(ILERLEME_ANAHTARI) ?? {};
      const il = sunucu ? sunucuyuBirlestir(yerel, sunucu) : yerel;
      const s = oku<AkisSecim>(SECIM_ANAHTARI);
      setIlerleme(il);
      if (s && AKIS_KARTLARI.some((k) => k.ders === s.ders)) baslat(s, il);
      else setSayfa(true);
      setHazir(true);
    })();
    return () => {
      iptal = true;
    };
  }, [baslat]);

  // "Benzer soru üret" yeni kartları havuza ekler ve geçerli kartın hemen arkasına koyar.
  useEffect(() => {
    const dinle = (e: Event) => {
      const yeni = (e as CustomEvent<AkisKart[]>).detail ?? [];
      havuz.current = [...havuz.current, ...yeni];
      setKartlar((liste) => {
        const var_ = new Set(liste.map((k) => k.id));
        const ek = yeni.filter((k) => !var_.has(k.id));
        const kopya = [...liste];
        kopya.splice(Math.min(kopya.length, idxRef.current + 1), 0, ...ek);
        return kopya;
      });
    };
    window.addEventListener("akis-uretildi", dinle);
    return () => window.removeEventListener("akis-uretildi", dinle);
  }, []);

  // Aktif ve sonraki kartın kodunu önceden yükle.
  useEffect(() => {
    for (const k of kartlar.slice(idx, idx + 3)) {
      if (kodlar[k.id]) continue;
      void kodBlogu(k).then((s) => setKodlar((o) => ({ ...o, [k.id]: s })));
    }
  }, [kartlar, idx, kodlar]);

  const bitti = kartlar.length > 0 && idx >= kartlar.length;
  const kart = kartlar[idx];
  const kartKimligi = kart?.id;
  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  // Kart ekrandan çıkınca görülme süresini bildir (yeni/görülmüş ayrımı için).
  useEffect(() => {
    if (!kartKimligi) return;
    const basla = Date.now();
    return () => {
      void olayYolla({
        eventId: crypto.randomUUID(), cardId: pakKartId(kartKimligi), kind: "view", mode: "learn",
        durationMs: Math.min(1_800_000, Date.now() - basla),
      });
    };
  }, [kartKimligi]);

  const git = useCallback((d: 1 | -1) => {
    const el = akis.current;
    if (!el) return;
    const hedef = Math.min(Math.max(Math.round(el.scrollTop / el.clientHeight) + d, 0), kartlar.length);
    el.scrollTo({ top: hedef * el.clientHeight, behavior: "smooth" });
  }, [kartlar.length]);

  // Yerel scroll-snap kaydırması; geçerli kartı kaydırma konumundan türet.
  const kaydirildi = useCallback(() => {
    const el = akis.current;
    if (!el || el.clientHeight === 0) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    setIdx((o) => (o === i ? o : i));
    setEn((o) => Math.max(o, i));
  }, []);

  const cevapla = useCallback(
    (id: string, dogruMu: boolean, secim: Secim, ipucu: number) => {
      void olayYolla({ eventId: crypto.randomUUID(), cardId: pakKartId(id), kind: "answer", mode: "practice", secim, ...(ipucu ? { ipucu } : {}) });
      // Yanlış kart aynı oturumda bir kez, birkaç kart sonra geri gelir.
      if (!dogruMu && !tekrarEdilen.current.has(id)) {
        tekrarEdilen.current.add(id);
        setKartlar((liste) => {
          const kendisi = liste.find((k) => k.id === id);
          if (!kendisi) return liste;
          const yeni = [...liste];
          yeni.splice(Math.min(yeni.length, idxRef.current + 4), 0, kendisi);
          return yeni;
        });
      }
      setCevaplar((c) => ({ ...c, [id]: dogruMu }));
      setIlerleme((il) => {
        const yeni = ilerlemeKaydet(il, id, dogruMu);
        yaz(ILERLEME_ANAHTARI, yeni);
        return yeni;
      });
    },
    [],
  );

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (sayfa || (e.target as HTMLElement | null)?.closest("textarea, input")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); git(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); git(-1); }
      else if (e.key === "Escape") setSayfa(false);
    };
    window.addEventListener("keydown", tus);
    return () => window.removeEventListener("keydown", tus);
  }, [git, sayfa]);

  const zayif = useMemo(() => (bitti ? etiketZayifligi(kartlar, ilerleme).slice(0, 3) : []), [bitti, kartlar, ilerleme]);
  const dogruSayisi = Object.values(cevaplar).filter(Boolean).length;
  const cozulen = Object.keys(cevaplar).length;

  if (!hazir) return null;

  return (
    <div className="akis-sahne">
      <header className="akis-ust">
        <button type="button" className="akis-hap" onClick={() => setSayfa(true)} aria-label="Kapsamı değiştir">
          <span>{secim ? `${DERSLER.find((d) => d.kod === secim.ders)?.ad} · ${kapsamEtiketi(secim.ders, secim.kapsam)}` : "Kapsam seç"}</span>
          <ChevronDown />
        </button>
        <span className="akis-sag">
          {kartlar.length > 0 && !bitti && <span className="akis-sayac">{idx + 1}/{kartlar.length}</span>}
          <button type="button" className="akis-asistan" aria-label="Çalışma asistanını aç" onClick={() => window.dispatchEvent(new CustomEvent("study-chat-open"))}>
            <MessageSquare />
          </button>
        </span>
      </header>

      {kartlar.length > 1 && (
        <div className="akis-cubuk" role="progressbar" aria-valuemin={0} aria-valuemax={kartlar.length} aria-valuenow={Math.min(idx, kartlar.length)}>
          <i style={{ width: `${(Math.min(idx + 1, kartlar.length) / kartlar.length) * 100}%` }} />
        </div>
      )}

      <div ref={akis} className="akis-akis" onScroll={kaydirildi}>
        {kartlar.map((k, i) => {
          const sayi = kartlar.slice(0, i).filter((x) => x.id === k.id).length;
          return (
            <section key={`${k.id}#${sayi}`} className="akis-slayt" aria-label={`Kart ${i + 1}`}>
              <article className="akis-kart" data-tur={k.tur}>
                {i <= en + 1 && (
                  <div className="akis-kaydir">
                    <AkisKartGovde
                      kart={k}
                      kod={kodlar[k.id] ?? []}
                      tohum={tohum}
                      onCevap={(d, secim, ipucu) => cevapla(k.id, d, secim, ipucu)}
                      onIlerle={() => git(1)}
                      no={i + 1}
                    />
                  </div>
                )}
                {i === 0 && idx === 0 && (
                  <span className="akis-kaydir-ipucu" aria-hidden><ChevronUp /> kaydır</span>
                )}
              </article>
            </section>
          );
        })}

        {kartlar.length > 0 && (
          <section className="akis-slayt" aria-label="Özet">
            <article className="akis-kart akis-ozet">
              <svg viewBox="0 0 120 120" className="akis-halka" aria-label={`${dogruSayisi}/${cozulen}`}>
                <circle cx="60" cy="60" r="52" className="akis-halka-iz" />
                <circle
                  cx="60" cy="60" r="52" className="akis-halka-dolu" pathLength={100}
                  strokeDasharray={`${cozulen ? (dogruSayisi / cozulen) * 100 : 0} 100`}
                />
                <text x="60" y="68" textAnchor="middle">{dogruSayisi}/{cozulen}</text>
              </svg>
              {zayif.length > 0 && (
                <p className="akis-zayif">{zayif.map((z) => z.etiket).join(" · ")}</p>
              )}
              <div className="akis-ikili">
                <button type="button" aria-label="Tekrar başlat" className="akis-yuvarlak" onClick={() => secim && baslat(secim, ilerleme)}><RotateCcw /></button>
                <button type="button" aria-label="Kapsamı değiştir" className="akis-yuvarlak" onClick={() => setSayfa(true)}><SlidersHorizontal /></button>
              </div>
            </article>
          </section>
        )}

        {kartlar.length === 0 && !sayfa && (
          <p className="akis-bos">Bu kapsamda kart yok.</p>
        )}
      </div>

      {sayfa && (
        <KapsamSayfasi
          baslangic={secim?.ders ?? "EBLG351"}
          onKapat={() => secim && setSayfa(false)}
          onSec={(s) => baslat(s, ilerleme)}
        />
      )}
    </div>
  );
}

function KapsamSayfasi({ baslangic, onKapat, onSec }: { baslangic: AkisDers; onKapat: () => void; onSec: (s: AkisSecim) => void }) {
  const [ders, setDers] = useState<AkisDers>(baslangic);
  const [tur, setTur] = useState<AkisTur[]>([]);
  const o = useMemo(() => kapsamSecenekleri(AKIS_KARTLARI, ders), [ders]);
  const sec = (kapsam: Kapsam) => onSec({ ders, kapsam, turler: tur, adet: 12 });

  return (
    <div className="akis-perde" onClick={onKapat}>
      <div className="akis-sayfa" role="dialog" aria-label="Kapsam" onClick={(e) => e.stopPropagation()}>
        <div className="akis-segment" role="tablist">
          {DERSLER.map((d) => (
            <button key={d.kod} type="button" role="tab" aria-selected={ders === d.kod} onClick={() => setDers(d.kod)}>{d.ad}</button>
          ))}
        </div>

        <div className="akis-turler" role="group" aria-label="Kart türü">
          {TURLER.map((t) => (
            <button key={t.ad} type="button" aria-pressed={tur.join() === t.turler.join()} onClick={() => setTur(t.turler)}>{t.ad}</button>
          ))}
        </div>

        <button type="button" className="akis-genel" onClick={() => sec({ tip: "genel" })}>
          <span>Karışık tekrar</span>
          <small>{o.genel}</small>
        </button>

        {o.notlar.length > 0 && (
          <div className="akis-hafta-grup">
            <p>Ders notları · hafta</p>
            <div className="akis-hafta-izgara">
              {o.notlar.filter((x) => x.adet > 0).map((x) => (
                <button key={x.hafta} type="button" onClick={() => sec({ tip: "not", hafta: x.hafta })}>{x.hafta}</button>
              ))}
            </div>
          </div>
        )}
        {o.odevHaftalari.length > 0 && (
          <div className="akis-hafta-grup">
            <p>Ödevler · hafta</p>
            <div className="akis-hafta-izgara">
              {o.odevHaftalari.filter((x) => x.adet > 0).map((x) => (
                <button key={x.hafta} type="button" onClick={() => sec({ tip: "odev", hafta: x.hafta })}>{x.hafta}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
