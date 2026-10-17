"use client";

import React, { useState } from "react";

// Python ödevlerinin tarayıcıdaki karşılığı: her işlem "adım" (eleman okuma/yazma/karşılaştırma/kaydırma) sayar.
// Amaç büyük-O farkını gözle görmek; sayaçlar .py dosyalarındaki islem/adim sayaçlarıyla aynı mantıkta.

export type DsKind =
  | "dizi" | "vector" | "liste1" | "liste2" | "yigin" | "kuyruk1" | "kuyruk2" | "hash" | "heap" | "bst" | "karsilastirma";

const MAX_LOG = 6;

function useCost() {
  const [log, setLog] = useState<{ text: string; cost: number }[]>([]);
  const [total, setTotal] = useState(0);
  return {
    log,
    total,
    record: (text: string, cost: number) => {
      setLog((l) => [{ text, cost }, ...l].slice(0, MAX_LOG));
      setTotal((t) => t + cost);
    },
    reset: () => { setLog([]); setTotal(0); },
  };
}

type Cost = ReturnType<typeof useCost>;

function Btn({ onClick, children, tone = "dark", disabled }: { onClick: () => void; children: React.ReactNode; tone?: "dark" | "light" | "warn"; disabled?: boolean }) {
  const cls = tone === "dark" ? "bg-stone-900 text-white hover:bg-stone-800" : tone === "warn" ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100" : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:px-4 pointer-coarse:text-sm ${cls}`}>
      {children}
    </button>
  );
}

function NumInput({ value, onChange, label = "değer", width = "w-16" }: { value: string; onChange: (v: string) => void; label?: string; width?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      placeholder={label}
      className={`${width} rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 pointer-coarse:min-h-11 pointer-coarse:text-base outline-none focus:border-amber-500`}
    />
  );
}

function CostPanel({ cost, hint }: { cost: Cost; hint?: string }) {
  return (
    <div className="space-y-1.5 rounded-xl bg-stone-950 p-3 font-mono text-[12px] leading-relaxed text-emerald-300">
      {cost.log.length === 0 ? (
        <p className="text-stone-400">{hint ?? "Bir işlem yap; kaç adım sürdüğünü burada gör."}</p>
      ) : (
        cost.log.map((l, i) => (
          <p key={i} className={`break-words ${i === 0 ? "" : "opacity-60"}`}>
            {l.text} <span className="text-amber-300">· {l.cost} adım</span>
          </p>
        ))
      )}
      <p className="flex items-center justify-between border-t border-stone-700 pt-1.5 text-stone-300">
        <span>Toplam: {cost.total} adım</span>
        {cost.log.length > 0 && (
          <button type="button" onClick={cost.reset} className="text-[11px] text-stone-400 underline hover:text-stone-200">sıfırla sayacı</button>
        )}
      </p>
    </div>
  );
}

function Cell({ label, index, tone = "plain", small }: { label: React.ReactNode; index?: number | string; tone?: "plain" | "empty" | "hit" | "mark"; small?: boolean }) {
  const cls =
    tone === "empty" ? "border-dashed border-stone-300 bg-stone-50 text-stone-300"
    : tone === "hit" ? "border-amber-500 bg-amber-100 text-amber-950"
    : tone === "mark" ? "border-emerald-500 bg-emerald-50 text-emerald-900"
    : "border-stone-400 bg-white text-stone-900";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`flex ${small ? "h-8 min-w-8" : "h-10 min-w-10"} items-center justify-center rounded-md border-2 px-1.5 font-mono text-[13px] font-semibold ${cls}`}>{label}</div>
      {index !== undefined && <span className="font-mono text-[10px] text-stone-400">{index}</span>}
    </div>
  );
}

function toInt(s: string, fallback: number): number {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : fallback;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-stone-500">{children}</p>;
}

/* ---------- 1. Statik dizi ---------- */
const DIZI_KAP = 8;

function DiziDemo() {
  const [cells, setCells] = useState<(number | null)[]>([4, 9, 2, null, null, null, null, null]);
  const [val, setVal] = useState("7");
  const [hl, setHl] = useState<number[]>([]);
  const cost = useCost();
  const size = cells.filter((c) => c !== null).length;
  const x = toInt(val, 0);

  const sona = () => {
    if (size >= DIZI_KAP) { cost.record("sona_ekle: dizi dolu → IndexError", 0); return; }
    const c = [...cells]; c[size] = x; setCells(c); setHl([size]);
    cost.record(`sona_ekle(${x})`, 1);
  };
  const basa = () => {
    if (size >= DIZI_KAP) { cost.record("araya_ekle(0): dizi dolu → IndexError", 0); return; }
    const c = [...cells];
    for (let i = size; i > 0; i--) c[i] = c[i - 1];
    c[0] = x; setCells(c); setHl([0]);
    cost.record(`araya_ekle(0, ${x}) — ${size} eleman sağa kaydı`, size + 1);
  };
  const bastanSil = () => {
    if (size === 0) { cost.record("sil(0): dizi boş", 0); return; }
    const c = [...cells];
    for (let i = 0; i < size - 1; i++) c[i] = c[i + 1];
    c[size - 1] = null; setCells(c); setHl([]);
    cost.record(`sil(0) — ${size - 1} eleman sola kaydı`, size);
  };
  const ara = () => {
    const idx = cells.findIndex((c) => c === x);
    setHl(idx >= 0 ? [idx] : []);
    cost.record(idx >= 0 ? `ara(${x}) → indeks ${idx}` : `ara(${x}) → bulunamadı`, idx >= 0 ? idx + 1 : size);
  };
  const getir = () => {
    const i = Math.min(Math.max(x, 0), DIZI_KAP - 1);
    setHl([i]);
    cost.record(`getir(${i}) → ${cells[i] ?? "boş"}`, 1);
  };

  return (
    <div className="space-y-3">
      <Hint>Kapasite {DIZI_KAP} sabit. Başa ekleme her elemanı kaydırır; sona ekleme ve indeksle erişim tek adım.</Hint>
      <div className="flex flex-wrap gap-1.5">
        {cells.map((c, i) => <Cell key={i} index={i} label={c ?? "·"} tone={hl.includes(i) ? "hit" : c === null ? "empty" : "plain"} />)}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <NumInput value={val} onChange={setVal} />
        <Btn onClick={sona}>sona ekle</Btn>
        <Btn onClick={basa} tone="warn">başa ekle</Btn>
        <Btn onClick={bastanSil} tone="warn">baştan sil</Btn>
        <Btn onClick={ara} tone="light">ara</Btn>
        <Btn onClick={getir} tone="light">getir(i)</Btn>
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

/* ---------- 2. Vector ---------- */
function VectorDemo() {
  const [items, setItems] = useState<number[]>([]);
  const [cap, setCap] = useState(1);
  const [kopya, setKopya] = useState(0);
  const [genisleme, setGenisleme] = useState(0);
  const [next, setNext] = useState(1);
  const cost = useCost();

  const ekle = (state: { items: number[]; cap: number; kopya: number; gen: number; next: number }) => {
    let c = 0;
    if (state.items.length === state.cap) { c += state.items.length; state.kopya += state.items.length; state.cap *= 2; state.gen += 1; }
    state.items = [...state.items, state.next]; state.next += 1; c += 1;
    return c;
  };
  const run = (times: number) => {
    const st = { items, cap, kopya, gen: genisleme, next };
    let c = 0; let grew = 0;
    for (let i = 0; i < times; i++) { const before = st.cap; c += ekle(st); if (st.cap !== before) grew += 1; }
    setItems(st.items); setCap(st.cap); setKopya(st.kopya); setGenisleme(st.gen); setNext(st.next);
    cost.record(times === 1 ? `sona_ekle → kapasite ${st.cap}${grew ? " (büyüdü, kopyalandı)" : ""}` : `${times} kez sona_ekle (${grew} kez büyüdü)`, c);
  };
  const cikar = () => {
    if (items.length === 0) { cost.record("son_cikar: boş", 0); return; }
    setItems(items.slice(0, -1)); cost.record("son_cikar", 1);
  };
  const reset = () => { setItems([]); setCap(1); setKopya(0); setGenisleme(0); setNext(1); cost.reset(); };
  const n = items.length;
  const shown = Math.min(cap, 64);

  return (
    <div className="space-y-3">
      <Hint>Dolunca kapasite 2 katına çıkar ve tüm elemanlar kopyalanır. Tek ekleme bazen pahalıdır, ortalaması (amortize) O(1).</Hint>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: shown }, (_, i) => <Cell key={i} small label={i < n ? items[i] : "·"} tone={i < n ? "plain" : "empty"} />)}
        {cap > shown && <span className="self-center text-xs text-stone-400">… +{cap - shown} boş</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {[["boy (n)", n], ["kapasite", cap], ["büyüme", genisleme], ["toplam kopya", kopya]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5"><p className="text-[10px] uppercase tracking-wide text-stone-500">{k}</p><p className="font-mono text-sm font-bold text-stone-900">{v}</p></div>
        ))}
      </div>
      <p className="text-xs text-stone-600">Kopya / eleman = <strong className="font-mono">{n ? (kopya / n).toFixed(2) : "0.00"}</strong> (her zaman &lt; 2: amortize sabit).</p>
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={() => run(1)}>sona ekle</Btn>
        <Btn onClick={() => run(10)} tone="light">10 ekle</Btn>
        <Btn onClick={() => run(100)} tone="light">100 ekle</Btn>
        <Btn onClick={cikar} tone="light">son çıkar</Btn>
        <Btn onClick={reset} tone="light">sıfırla</Btn>
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

/* ---------- 3-4. Bağlı listeler ---------- */
function ListeDemo({ cift }: { cift: boolean }) {
  const [nodes, setNodes] = useState<number[]>([12, 7, 30]);
  const [val, setVal] = useState("5");
  const [hl, setHl] = useState<number | null>(null);
  const cost = useCost();
  const x = toInt(val, 0);

  const basa = () => { setNodes([x, ...nodes]); setHl(0); cost.record(`basa_ekle(${x})`, 1); };
  const sona = () => { setNodes([...nodes, x]); setHl(nodes.length); cost.record(`sona_ekle(${x}) — son işaretçisi sayesinde`, 1); };
  const ara = () => {
    const i = nodes.indexOf(x); setHl(i >= 0 ? i : null);
    cost.record(i >= 0 ? `ara(${x}) → ${i + 1}. düğümde` : `ara(${x}) → bulunamadı`, i >= 0 ? i + 1 : nodes.length);
  };
  const silDeger = () => {
    const i = nodes.indexOf(x);
    if (i < 0) { cost.record(`sil(${x}) → bulunamadı`, nodes.length); return; }
    setNodes(nodes.filter((_, k) => k !== i)); setHl(null);
    cost.record(`sil(${x}) — önce aranır`, i + 1);
  };
  const silDugum = (i: number) => {
    setNodes(nodes.filter((_, k) => k !== i)); setHl(null);
    if (cift) cost.record(`dugumu_sil(düğüm ${nodes[i]}) — elde düğüm var, arama yok`, 1);
    else cost.record(`sil(${nodes[i]}) — baştan yürümek gerekir`, i + 1);
  };
  const ters = () => { setNodes([...nodes].reverse()); setHl(null); cost.record("ters_cevir (üç işaretçiyle, yerinde)", nodes.length); };

  return (
    <div className="space-y-3">
      <Hint>{cift ? "Çift bağlı liste: düğüme tıkla → elindeki düğümü O(1) siler (önceki işaretçisi var)." : "Tek bağlı liste: düğüme tıkla → silmek için baştan o düğüme yürümek gerekir, O(n)."}</Hint>
      <div className="flex flex-wrap items-center gap-y-2">
        <span className="mr-1 font-mono text-[10px] text-stone-400">bas</span>
        {nodes.map((v, i) => (
          <React.Fragment key={`${i}-${v}`}>
            <button type="button" onClick={() => silDugum(i)} title="Bu düğümü sil" className={`rounded-md border-2 px-2.5 py-1.5 font-mono text-[13px] font-semibold ${hl === i ? "border-amber-500 bg-amber-100 text-amber-950" : "border-stone-400 bg-white text-stone-900 hover:border-rose-400"}`}>{v}</button>
            <span className="px-1 font-mono text-xs text-stone-400">{cift ? "⇄" : "→"}</span>
          </React.Fragment>
        ))}
        <span className="font-mono text-[11px] text-stone-400">None</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <NumInput value={val} onChange={setVal} />
        <Btn onClick={basa}>başa ekle</Btn>
        <Btn onClick={sona}>sona ekle</Btn>
        <Btn onClick={ara} tone="light">ara</Btn>
        <Btn onClick={silDeger} tone="warn">değere göre sil</Btn>
        {!cift && <Btn onClick={ters} tone="light">ters çevir</Btn>}
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

/* ---------- 5. Yığın ---------- */
const PARANTEZ: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

function parantezIzi(metin: string) {
  const st: string[] = []; const iz: string[] = [];
  for (const ch of metin) {
    if ("([{".includes(ch)) { st.push(ch); iz.push(`it ${ch}`); }
    else if (ch in PARANTEZ) {
      if (st.length === 0 || st[st.length - 1] !== PARANTEZ[ch]) { iz.push(`${ch}: eşleşme yok`); return { ok: false, iz }; }
      st.pop(); iz.push(`${ch}: çık`);
    }
  }
  const ok = st.length === 0;
  if (!ok) iz.push(`yığında ${st.length} açık parantez kaldı`);
  return { ok, iz };
}

function sonekIzi(metin: string) {
  const st: number[] = []; const iz: string[] = [];
  for (const t of metin.trim().split(/\s+/)) {
    if (/^-?\d+(\.\d+)?$/.test(t)) { st.push(parseFloat(t)); iz.push(`it ${t}`); continue; }
    if (!"+-*/".includes(t) || t.length !== 1 || st.length < 2) { return { sonuc: null as number | null, iz: [...iz, `${t}: geçersiz`] }; }
    const b = st.pop() as number; const a = st.pop() as number;
    const r = t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b;
    st.push(r); iz.push(`${a} ${t} ${b} = ${r}`);
  }
  return { sonuc: st.length === 1 ? st[0] : null, iz };
}

function YiginDemo() {
  const [items, setItems] = useState<number[]>([3, 8]);
  const [val, setVal] = useState("5");
  const [par, setPar] = useState("{[()]}");
  const [sonek, setSonek] = useState("3 4 + 2 *");
  const cost = useCost();
  const x = toInt(val, 0);
  const p = parantezIzi(par);
  const s = sonekIzi(sonek);

  return (
    <div className="space-y-3">
      <Hint>LIFO: son giren ilk çıkar. Yalnız tepeye dokunulur, bu yüzden her işlem O(1).</Hint>
      <div className="flex items-end gap-4">
        <div className="flex min-h-12 w-20 flex-col-reverse gap-1 rounded-lg border-2 border-t-0 border-stone-400 p-1.5">
          {items.map((v, i) => <div key={i} className={`rounded border px-2 py-1 text-center font-mono text-[13px] font-semibold ${i === items.length - 1 ? "border-amber-500 bg-amber-100" : "border-stone-300 bg-white"}`}>{v}</div>)}
        </div>
        <p className="pb-1 text-xs text-stone-500">{items.length === 0 ? "yığın boş" : `tepe = ${items[items.length - 1]}`}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <NumInput value={val} onChange={setVal} />
        <Btn onClick={() => { setItems([...items, x]); cost.record(`it(${x})`, 1); }}>it (push)</Btn>
        <Btn onClick={() => { if (!items.length) { cost.record("cik: boş yığın → IndexError", 0); return; } cost.record(`cik() → ${items[items.length - 1]}`, 1); setItems(items.slice(0, -1)); }} tone="warn">çık (pop)</Btn>
        <Btn onClick={() => cost.record(items.length ? `tepe() → ${items[items.length - 1]}` : "tepe: boş", items.length ? 1 : 0)} tone="light">tepe</Btn>
      </div>
      <CostPanel cost={cost} />
      <div className="space-y-1.5 rounded-xl border border-stone-200 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Uygulama 1: parantez denetimi</p>
        <NumInput value={par} onChange={setPar} label="parantez" width="w-full" />
        <p className={`text-xs font-semibold ${p.ok ? "text-emerald-700" : "text-rose-700"}`}>{p.ok ? "dengeli" : "dengesiz"}</p>
        <p className="break-words font-mono text-[11px] text-stone-500">{p.iz.join(" · ")}</p>
      </div>
      <div className="space-y-1.5 rounded-xl border border-stone-200 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Uygulama 2: sonek (postfix) hesabı</p>
        <NumInput value={sonek} onChange={setSonek} label="3 4 + 2 *" width="w-full" />
        <p className="text-xs font-semibold text-stone-800">sonuç: {s.sonuc === null ? "geçersiz ifade" : s.sonuc}</p>
        <p className="break-words font-mono text-[11px] text-stone-500">{s.iz.join(" · ")}</p>
      </div>
    </div>
  );
}

/* ---------- 6. Dairesel kuyruk ---------- */
const KUYRUK_KAP = 6;

function Kuyruk1Demo() {
  const [buf, setBuf] = useState<(number | null)[]>(Array(KUYRUK_KAP).fill(null));
  const [bas, setBas] = useState(0);
  const [boy, setBoy] = useState(0);
  const [next, setNext] = useState(1);
  const cost = useCost();
  const ek = (bas + boy) % KUYRUK_KAP;

  const ekle = () => {
    if (boy === KUYRUK_KAP) { cost.record("kuyruga_ekle: dolu → IndexError", 0); return; }
    const b = [...buf]; b[ek] = next; setBuf(b); setBoy(boy + 1); setNext(next + 1);
    cost.record(`kuyruga_ekle(${next}) → indeks (${bas}+${boy}) % ${KUYRUK_KAP} = ${ek}`, 1);
  };
  const cikar = () => {
    if (boy === 0) { cost.record("kuyruktan_cikar: boş → IndexError", 0); return; }
    const b = [...buf]; const v = b[bas]; b[bas] = null; setBuf(b);
    cost.record(`kuyruktan_cikar() → ${v}; bas ${bas} → ${(bas + 1) % KUYRUK_KAP}`, 1);
    setBas((bas + 1) % KUYRUK_KAP); setBoy(boy - 1);
  };

  return (
    <div className="space-y-3">
      <Hint>Dizi sabit, kaydırma yok: bas ve ekleme indeksi modulo ile başa sarılır. Ekle ve çıkar O(1).</Hint>
      <div className="flex flex-wrap gap-1.5">
        {buf.map((c, i) => {
          const isBas = i === bas && boy > 0; const isEk = i === ek && boy < KUYRUK_KAP;
          return (
            <div key={i} className="flex flex-col items-center">
              <span className="h-3 font-mono text-[9px] text-amber-700">{isBas ? "bas" : ""}</span>
              <Cell index={i} label={c ?? "·"} tone={c === null ? "empty" : isBas ? "hit" : "plain"} />
              <span className="h-3 font-mono text-[9px] text-emerald-700">{isEk ? "ekle▲" : ""}</span>
            </div>
          );
        })}
      </div>
      <p className="font-mono text-xs text-stone-600">bas={bas} · boy={boy} · ekleme_indeksi=(bas+boy)%{KUYRUK_KAP}={ek}</p>
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={ekle}>kuyruğa ekle</Btn>
        <Btn onClick={cikar} tone="warn">kuyruktan çıkar</Btn>
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

function Col({ ad, a }: { ad: string; a: number[] }) {
  return (
    <div className="space-y-1"><p className="text-[11px] font-semibold text-stone-500">{ad}</p>
      <div className="flex min-h-12 w-24 flex-col-reverse gap-1 rounded-lg border-2 border-t-0 border-stone-400 p-1.5">
        {a.slice(-8).map((v, i, arr) => <div key={i} className={`rounded border px-2 py-0.5 text-center font-mono text-xs font-semibold ${i === arr.length - 1 ? "border-amber-500 bg-amber-100" : "border-stone-300 bg-white"}`}>{v}</div>)}
        {a.length > 8 && <span className="text-center text-[10px] text-stone-400">+{a.length - 8} eski</span>}
      </div>
    </div>
  
  );
}

/* ---------- 7. İki yığınla kuyruk ---------- */
function Kuyruk2Demo() {
  const [gelen, setGelen] = useState<number[]>([]);
  const [giden, setGiden] = useState<number[]>([]);
  const [next, setNext] = useState(1);
  const [aktarim, setAktarim] = useState(0);
  const [eklenen, setEklenen] = useState(0);
  const cost = useCost();

  const ekle = (k: number) => {
    const yeni = Array.from({ length: k }, (_, i) => next + i);
    setGelen([...gelen, ...yeni]); setNext(next + k); setEklenen(eklenen + k);
    cost.record(k === 1 ? `kuyruga_ekle(${next}) → gelen'e it` : `${k} kez kuyruga_ekle`, k);
  };
  const cikar = () => {
    if (gelen.length === 0 && giden.length === 0) { cost.record("kuyruktan_cikar: boş", 0); return; }
    let g = gelen; let o = giden; let c = 1;
    if (o.length === 0) { o = [...g].reverse(); c += g.length; setAktarim(aktarim + g.length); g = []; }
    const v = o[o.length - 1]; setGelen(g); setGiden(o.slice(0, -1));
    cost.record(`kuyruktan_cikar() → ${v}${c > 1 ? ` (giden boştu: ${c - 1} eleman aktarıldı)` : ""}`, c);
  };

  return (
    <div className="space-y-3">
      <Hint>Çıkarma, giden boşsa gelen&apos;i ters çevirerek aktarır (tek seferde O(n)); ama her eleman en çok bir kez aktarıldığı için ortalama O(1).</Hint>
      <div className="flex gap-6"><Col ad="gelen (ekleme)" a={gelen} /><Col ad="giden (çıkarma)" a={giden} /></div>
      <p className="font-mono text-xs text-stone-600">eklenen={eklenen} · toplam aktarım={aktarim} {eklenen > 0 && aktarim <= eklenen ? "≤ n ✓" : ""}</p>
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={() => ekle(1)}>ekle</Btn>
        <Btn onClick={() => ekle(5)} tone="light">5 ekle</Btn>
        <Btn onClick={cikar} tone="warn">çıkar</Btn>
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

/* ---------- 8. Hash tablosu ---------- */
function metinHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

function HashDemo() {
  const [kovalar, setKovalar] = useState<string[][]>([[], [], [], []]);
  const [key, setKey] = useState("elma");
  const [hl, setHl] = useState<string | null>(null);
  const [rehash, setRehash] = useState(0);
  const cost = useCost();
  const n = kovalar.reduce((a, k) => a + k.length, 0);
  const yuk = n / kovalar.length;
  const k = key.trim();

  const ekle = () => {
    if (!k) return;
    const idx = metinHash(k) % kovalar.length; const kova = kovalar[idx];
    const j = kova.indexOf(k);
    if (j >= 0) { cost.record(`ekle(${k}) zaten var → kova ${idx}`, j + 1); setHl(k); return; }
    let kv = kovalar.map((b) => [...b]); kv[idx].push(k);
    let c = kova.length + 1; let note = "";
    if ((n + 1) / kv.length > 0.75) {
      const m = kv.length * 2; const yeni: string[][] = Array.from({ length: m }, () => []);
      for (const b of kv) for (const a of b) { yeni[metinHash(a) % m].push(a); c += 1; }
      kv = yeni; setRehash(rehash + 1); note = ` → yük > 0.75: ${m} kovaya yeniden hash`;
    }
    setKovalar(kv); setHl(k);
    cost.record(`ekle(${k}) → kova ${idx}${note}`, c);
  };
  const ara = () => {
    const idx = metinHash(k) % kovalar.length; const j = kovalar[idx].indexOf(k);
    setHl(j >= 0 ? k : null);
    cost.record(j >= 0 ? `ara(${k}) → kova ${idx}, zincirde ${j + 1}. sırada` : `ara(${k}) → kova ${idx} içinde yok`, j >= 0 ? j + 1 : Math.max(kovalar[idx].length, 1));
  };
  const sil = () => {
    const idx = metinHash(k) % kovalar.length; const j = kovalar[idx].indexOf(k);
    if (j < 0) { cost.record(`sil(${k}) → yok`, Math.max(kovalar[idx].length, 1)); return; }
    const kv = kovalar.map((b) => [...b]); kv[idx].splice(j, 1); setKovalar(kv); setHl(null);
    cost.record(`sil(${k}) → kova ${idx}`, j + 1);
  };
  const hizli = () => {
    let kv = kovalar.map((b) => [...b]); let rh = rehash; let c = 0;
    for (const a of ["armut", "kiraz", "muz", "nar", "incir", "erik", "kayısı", "üzüm"]) {
      if (kv.some((b) => b.includes(a))) continue;
      const idx = metinHash(a) % kv.length; c += kv[idx].length + 1; kv[idx].push(a);
      if ((kv.reduce((s, b) => s + b.length, 0)) / kv.length > 0.75) {
        const m = kv.length * 2; const yeni: string[][] = Array.from({ length: m }, () => []);
        for (const b of kv) for (const e of b) { yeni[metinHash(e) % m].push(e); c += 1; }
        kv = yeni; rh += 1;
      }
    }
    setKovalar(kv); setRehash(rh); cost.record("8 meyve eklendi", c);
  };

  return (
    <div className="space-y-3">
      <Hint>Anahtar → <code className="font-mono">hash % kova_sayısı</code> ile kovaya gider; çakışanlar zincirde dizilir. Yük oranı 0.75&apos;i geçince kova sayısı ikiye katlanır.</Hint>
      <div className="space-y-1 font-mono text-[12px]">
        {kovalar.map((b, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1">
            <span className="w-6 text-right text-stone-400">{i}</span><span className="text-stone-400">│</span>
            {b.length === 0 ? <span className="text-stone-300">boş</span> : b.map((a) => <span key={a} className={`rounded border px-1.5 py-0.5 ${hl === a ? "border-amber-500 bg-amber-100" : "border-stone-300 bg-white"}`}>{a}</span>)}
          </div>
        ))}
      </div>
      <p className="font-mono text-xs text-stone-600">n={n} · kova={kovalar.length} · yük={yuk.toFixed(2)} · yeniden hash={rehash}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <NumInput value={key} onChange={setKey} label="anahtar" width="w-24" />
        <Btn onClick={ekle}>ekle</Btn>
        <Btn onClick={ara} tone="light">ara</Btn>
        <Btn onClick={sil} tone="warn">sil</Btn>
        <Btn onClick={hizli} tone="light">8 meyve ekle</Btn>
        <Btn onClick={() => { setKovalar([[], [], [], []]); setRehash(0); setHl(null); cost.reset(); }} tone="light">sıfırla</Btn>
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

/* ---------- 9. Min-heap ---------- */
function yukariSizdir(a: number[], start: number) {
  let i = start; let c = 0;
  while (i > 0) { const p = (i - 1) >> 1; c += 1; if (a[p] <= a[i]) break; [a[p], a[i]] = [a[i], a[p]]; c += 1; i = p; }
  return c;
}
function asagiSizdir(a: number[], start: number) {
  let i = start; let c = 0;
  for (;;) {
    const l = 2 * i + 1; const r = l + 1; let m = i;
    if (l < a.length) { c += 1; if (a[l] < a[m]) m = l; }
    if (r < a.length) { c += 1; if (a[r] < a[m]) m = r; }
    if (m === i) break;
    [a[m], a[i]] = [a[i], a[m]]; c += 1; i = m;
  }
  return c;
}

function HeapDemo() {
  const [arr, setArr] = useState<number[]>([3, 8, 5, 12, 9]);
  const [val, setVal] = useState("2");
  const cost = useCost();
  const x = toInt(val, 0);

  const ekle = () => {
    if (arr.length >= 15) { cost.record("ekle: gösterim en çok 15 eleman", 0); return; }
    const a = [...arr, x]; const c = yukariSizdir(a, a.length - 1); setArr(a);
    cost.record(`ekle(${x}) — sona koy, yukarı sızdır`, c + 1);
  };
  const cikar = () => {
    if (!arr.length) { cost.record("en_kucuk_cikar: boş", 0); return; }
    const a = [...arr]; const m = a[0]; const son = a.pop() as number;
    let c = 1;
    if (a.length) { a[0] = son; c += asagiSizdir(a, 0); }
    setArr(a); cost.record(`en_kucuk_cikar() → ${m} — son koke, aşağı sızdır`, c);
  };
  const rastgele = () => {
    const a = Array.from({ length: 12 }, (_, i) => ((i * 37 + 11) % 50) + 1);
    let c = 0; for (let i = (a.length >> 1) - 1; i >= 0; i--) c += asagiSizdir(a, i);
    setArr(a); cost.record("listeden_kur(12 eleman) — Floyd, aşağıdan yukarı", c);
  };

  const W = 360; const H = 4 * 44 + 24;
  const pos = (i: number) => { const lvl = Math.floor(Math.log2(i + 1)); const k = i + 1 - 2 ** lvl; return { x: ((k + 0.5) / 2 ** lvl) * W, y: 20 + lvl * 44 }; };

  return (
    <div className="space-y-3">
      <Hint>Dizi tabanlı ağaç: ebeveyn (i−1)//2, çocuklar 2i+1 ve 2i+2. Ekleme ve çıkarma ağacın yüksekliği kadar, O(log n).</Hint>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-stone-200 bg-stone-50" role="img" aria-label="Min-heap ağacı">
        {arr.map((_, i) => i > 0 && <line key={`l${i}`} x1={pos((i - 1) >> 1).x} y1={pos((i - 1) >> 1).y} x2={pos(i).x} y2={pos(i).y} stroke="#a8a29e" strokeWidth="1.5" />)}
        {arr.map((v, i) => (
          <g key={i}>
            <circle cx={pos(i).x} cy={pos(i).y} r="15" fill={i === 0 ? "#fef3c7" : "#fff"} stroke={i === 0 ? "#f59e0b" : "#78716c"} strokeWidth="2" />
            <text x={pos(i).x} y={pos(i).y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1c1917">{v}</text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-1">{arr.map((v, i) => <Cell key={i} small index={i} label={v} tone={i === 0 ? "hit" : "plain"} />)}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        <NumInput value={val} onChange={setVal} />
        <Btn onClick={ekle}>ekle</Btn>
        <Btn onClick={cikar} tone="warn">en küçüğü çıkar</Btn>
        <Btn onClick={rastgele} tone="light">12 elemanı O(n) kur</Btn>
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

/* ---------- 10. İkili arama ağacı ---------- */
interface BstNode { k: number; l: BstNode | null; r: BstNode | null }

function bstInsert(root: BstNode | null, k: number): { root: BstNode | null; steps: number; dup: boolean } {
  if (!root) return { root: { k, l: null, r: null }, steps: 1, dup: false };
  let cur = root; let steps = 0;
  for (;;) {
    steps += 1;
    if (k === cur.k) return { root, steps, dup: true };
    const yon = k < cur.k ? "l" : "r";
    if (!cur[yon]) { cur[yon] = { k, l: null, r: null }; return { root, steps: steps + 1, dup: false }; }
    cur = cur[yon] as BstNode;
  }
}
function bstClone(n: BstNode | null): BstNode | null { return n ? { k: n.k, l: bstClone(n.l), r: bstClone(n.r) } : null; }
function bstHeight(n: BstNode | null): number { return n ? 1 + Math.max(bstHeight(n.l), bstHeight(n.r)) : 0; }

function BstDemo() {
  const [root, setRoot] = useState<BstNode | null>(() => [50, 30, 70, 20, 40, 60, 80].reduce<BstNode | null>((r, k) => bstInsert(r, k).root, null));
  const [val, setVal] = useState("45");
  const [hl, setHl] = useState<number | null>(null);
  const cost = useCost();
  const x = toInt(val, 0);

  const nodes: { k: number; x: number; y: number; parent?: { x: number; y: number } }[] = [];
  let counter = 0;
  const walk = (n: BstNode | null, d: number, parent?: { x: number; y: number }) => {
    if (!n) return;
    walk(n.l, d + 1, undefined);
    const me = { k: n.k, x: counter++, y: d, parent };
    nodes.push(me);
    walk(n.r, d + 1, undefined);
  };
  walk(root, 0);
  // ebeveyn çizgileri için konumları ikinci geçişte bağla
  const posOf = new Map(nodes.map((n) => [n.k, n]));
  const edges: [number, number][] = [];
  const collect = (n: BstNode | null) => { if (!n) return; if (n.l) edges.push([n.k, n.l.k]); if (n.r) edges.push([n.k, n.r.k]); collect(n.l); collect(n.r); };
  collect(root);
  const SP = 30; const VH = 40; const h = bstHeight(root);
  const W = Math.max(nodes.length * SP + 20, 120); const H = Math.max(h * VH + 10, 60);
  const px = (k: number) => 14 + (posOf.get(k)?.x ?? 0) * SP; const py = (k: number) => 18 + (posOf.get(k)?.y ?? 0) * VH;

  const ekle = () => {
    if (nodes.length >= 30) { cost.record("ekle: gösterim en çok 30 düğüm", 0); return; }
    const r = bstInsert(bstClone(root), x);
    if (r.dup) { cost.record(`ekle(${x}) zaten var`, r.steps); return; }
    setRoot(r.root); setHl(x); cost.record(`ekle(${x}) — kökten aşağı yürüdü`, r.steps);
  };
  const ara = () => {
    let cur = root; let steps = 0;
    while (cur) { steps += 1; if (cur.k === x) break; cur = x < cur.k ? cur.l : cur.r; }
    setHl(cur ? x : null); cost.record(cur ? `ara(${x}) → bulundu` : `ara(${x}) → yok`, steps);
  };
  const sirali = () => {
    let r: BstNode | null = null; let c = 0;
    for (let i = 1; i <= 10; i++) { const o = bstInsert(r, i); r = o.root; c += o.steps; }
    setRoot(r); setHl(null); cost.record("1..10 sıralı eklendi → dejenere ağaç (bağlı liste gibi)", c);
  };
  const dengeli = () => {
    let r: BstNode | null = null; let c = 0;
    for (const i of [8, 4, 12, 2, 6, 10, 14, 1, 3, 5]) { const o = bstInsert(r, i); r = o.root; c += o.steps; }
    setRoot(r); setHl(null); cost.record("10 düğüm karışık sırada eklendi → dengeli", c);
  };

  return (
    <div className="space-y-3">
      <Hint>Sol alt ağaç &lt; düğüm &lt; sağ alt ağaç. Maliyet yüksekliğe bağlı: dengeliyse O(log n), sıralı eklenirse O(n).</Hint>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-stone-200 bg-stone-50" role="img" aria-label="İkili arama ağacı">
        {edges.map(([a, b]) => <line key={`${a}-${b}`} x1={px(a)} y1={py(a)} x2={px(b)} y2={py(b)} stroke="#a8a29e" strokeWidth="1.5" />)}
        {nodes.map((n) => (
          <g key={n.k}>
            <circle cx={px(n.k)} cy={py(n.k)} r="12" fill={hl === n.k ? "#fef3c7" : "#fff"} stroke={hl === n.k ? "#f59e0b" : "#78716c"} strokeWidth="2" />
            <text x={px(n.k)} y={py(n.k) + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1c1917">{n.k}</text>
          </g>
        ))}
      </svg>
      <p className="font-mono text-xs text-stone-600">düğüm={nodes.length} · yükseklik={h}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <NumInput value={val} onChange={setVal} />
        <Btn onClick={ekle}>ekle</Btn>
        <Btn onClick={ara} tone="light">ara</Btn>
        <Btn onClick={sirali} tone="warn">1..10 sıralı ekle</Btn>
        <Btn onClick={dengeli} tone="light">karışık ekle</Btn>
      </div>
      <CostPanel cost={cost} />
    </div>
  );
}

/* ---------- 11. Karşılaştırma ---------- */
const OZET: [string, string, string, string][] = [
  ["Dizi (list)", "O(1) sona · O(n) başa", "O(n)", "O(n)"],
  ["Tek bağlı liste", "O(1) başa/sona*", "O(n)", "O(n)"],
  ["Çift bağlı liste", "O(1) başa/sona", "O(n)", "O(1) düğüm eldeyse"],
  ["Yığın / Kuyruk", "O(1)", "O(n)", "O(1)"],
  ["Hash tablosu", "O(1) ort.", "O(1) ort.", "O(1) ort."],
  ["Min-heap", "O(log n)", "O(n)", "O(log n) kök"],
  ["BST (dengeli)", "O(log n)", "O(log n)", "O(log n)"],
];

function KarsilastirmaDemo() {
  const [n, setN] = useState(2000);
  const [olcum, setOlcum] = useState<{ n: number; sona: number; basa: number; liste: number }[] | null>(null);
  const [busy, setBusy] = useState(false);

  const olc = () => {
    setBusy(true);
    setTimeout(() => {
      const rows = [10000, 20000, 40000].map((m) => {
        let t = performance.now(); const a: number[] = []; for (let i = 0; i < m; i++) a.push(i); const sona = performance.now() - t;
        t = performance.now(); const b: number[] = []; for (let i = 0; i < m; i++) b.unshift(i); const basa = performance.now() - t;
        t = performance.now(); let head: { v: number; n: unknown } | null = null; for (let i = 0; i < m; i++) head = { v: i, n: head }; const liste = performance.now() - t;
        void head; return { n: m, sona, basa, liste };
      });
      setOlcum(rows); setBusy(false);
    }, 30);
  };

  return (
    <div className="space-y-4">
      <Hint>&ldquo;n eleman ekle&rdquo; işinin adım sayısı: sayaç tabanlı, makineden bağımsız. Python&apos;daki <code className="font-mono">karsilastirma.py</code> aynı tabloyu üretir.</Hint>
      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs font-semibold text-stone-700">n = <span className="font-mono">{n}</span>
          <input type="range" min={500} max={8000} step={500} value={n} onChange={(e) => setN(Number(e.target.value))} className="flex-1 accent-amber-600" />
        </label>
        <table className="w-full text-left text-xs">
          <thead><tr className="border-b border-stone-300 text-stone-500"><th className="py-1">Yapı</th><th>Başa ekle ×n</th><th>Sona ekle ×n</th></tr></thead>
          <tbody className="font-mono text-stone-800">
            <tr className="border-b border-stone-100"><td className="py-1 font-sans">list.insert(0)</td><td className="text-rose-700">{((n * (n - 1)) / 2).toLocaleString("tr-TR")}</td><td>{n.toLocaleString("tr-TR")}</td></tr>
            <tr className="border-b border-stone-100"><td className="py-1 font-sans">bağlı liste</td><td>{n.toLocaleString("tr-TR")}</td><td>{n.toLocaleString("tr-TR")}</td></tr>
            <tr><td className="py-1 font-sans">deque</td><td>{n.toLocaleString("tr-TR")}</td><td>{n.toLocaleString("tr-TR")}</td></tr>
          </tbody>
        </table>
        <p className="text-[11px] text-stone-500">Başa ekleme n(n−1)/2 kaydırma ister: n iki katına çıkınca iş dört katına çıkar (O(n²)).</p>
      </div>
      <div className="space-y-2">
        <Btn onClick={olc} tone="light" disabled={busy}>{busy ? "ölçülüyor…" : "Tarayıcıda gerçek süreyi ölç"}</Btn>
        {olcum && (
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-stone-300 text-stone-500"><th className="py-1">n</th><th>push</th><th>unshift</th><th>bağlı liste</th></tr></thead>
            <tbody className="font-mono text-stone-800">{olcum.map((r) => <tr key={r.n} className="border-b border-stone-100"><td className="py-1">{r.n}</td><td>{r.sona.toFixed(1)} ms</td><td className="text-rose-700">{r.basa.toFixed(1)} ms</td><td>{r.liste.toFixed(1)} ms</td></tr>)}</tbody>
          </table>
        )}
        <p className="text-[11px] text-stone-500">JavaScript motoru unshift&apos;i optimize edebilir; sayaç tablosu asıl öğreten kısımdır, süre makineye göre değişir.</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-500">Özet</p>
        <table className="w-full text-left text-xs">
          <thead><tr className="border-b border-stone-300 text-stone-500"><th className="py-1">Yapı</th><th>Ekle</th><th>Ara</th><th>Sil</th></tr></thead>
          <tbody className="text-stone-800">{OZET.map((r) => <tr key={r[0]} className="border-b border-stone-100 align-top">{r.map((c, i) => <td key={i} className={`py-1 ${i ? "font-mono" : "font-semibold"}`}>{c}</td>)}</tr>)}</tbody>
        </table>
        <p className="mt-1 text-[11px] text-stone-500">* son işaretçisi tutuluyorsa.</p>
      </div>
    </div>
  );
}

export default function VeriYapisiDemo({ kind }: { kind: DsKind }) {
  switch (kind) {
    case "dizi": return <DiziDemo />;
    case "vector": return <VectorDemo />;
    case "liste1": return <ListeDemo cift={false} />;
    case "liste2": return <ListeDemo cift />;
    case "yigin": return <YiginDemo />;
    case "kuyruk1": return <Kuyruk1Demo />;
    case "kuyruk2": return <Kuyruk2Demo />;
    case "hash": return <HashDemo />;
    case "heap": return <HeapDemo />;
    case "bst": return <BstDemo />;
    case "karsilastirma": return <KarsilastirmaDemo />;
  }
}
