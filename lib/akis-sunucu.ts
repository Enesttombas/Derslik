// Akış v2 sunucu tarafı: `pak:` kart olayları, sunucuda doğruluk, akis_kart_durumu (SM2) ve durum okuma.
import { env } from "cloudflare:workers";
import { etiketZayifligi, type Ilerleme } from "./akis-oturum";
import { degerlendir, gecTekrarHesapla, pakCevapSchema, pakKimligi } from "./akis-olay";
import { akisKartSchema, type AkisKart } from "./akis-paket";
import { uretKartiMi } from "./akis-uret";
import { AKIS_KARTLARI } from "./akis-yukle";
import { canonicalJson, feedEventSchema } from "./study-feed";

const KATALOG = new Map(AKIS_KARTLARI.map((k) => [k.id, k]));

type Sonuc =
  | { status: 200; data: { eventId: string; duplicate: boolean; outcome?: "correct" | "incorrect" } }
  | { status: 400 | 404 | 409 | 500; error: string };

type Olay =
  | { kind: "view" }
  | { kind: "preference"; preference: "like" | "dislike" | null }
  | { kind: "answer"; outcome: "correct" | "incorrect" };

// Paket kartı ya da bu kullanıcının ürettiği kart; başkasının üretimi hiç görünmez.
export async function kartBul(userId: string, id: string): Promise<AkisKart | undefined> {
  const paket = KATALOG.get(id);
  if (paket || !uretKartiMi(id) || !env.DB) return paket;
  const satir = await env.DB.prepare("SELECT kart FROM akis_uretilen WHERE user_id = ? AND id = ?").bind(userId, id).first<{ kart: string }>();
  if (!satir) return undefined;
  try {
    const r = akisKartSchema.safeParse(JSON.parse(satir.kart));
    return r.success ? r.data : undefined;
  } catch {
    return undefined;
  }
}

const gunSonra = (iso: string, gun: number) => new Date(Date.parse(iso) + gun * 86400000).toISOString();

// Mevcut study_items SM2'siyle aynı kurallar: yanlış → 1 gün, doğru → 1, 3, sonra aralık*kolaylık.
function durumUpsert(db: D1Database, userId: string, kartId: string, olay: Olay, nowIso: string) {
  if (olay.kind === "view") {
    return db
      .prepare(
        `INSERT INTO akis_kart_durumu (user_id, kart_id, sonraki_tekrar, goruldu, guncellendi)
         VALUES (?1, ?2, ?3, 1, ?3)
         ON CONFLICT(user_id, kart_id) DO UPDATE SET goruldu = goruldu + 1, guncellendi = ?3`
      )
      .bind(userId, kartId, nowIso);
  }
  if (olay.kind === "preference") {
    return db
      .prepare(
        `INSERT INTO akis_kart_durumu (user_id, kart_id, sonraki_tekrar, tercih, guncellendi)
         VALUES (?1, ?2, ?3, ?4, ?3)
         ON CONFLICT(user_id, kart_id) DO UPDATE SET tercih = ?4, guncellendi = ?3`
      )
      .bind(userId, kartId, nowIso, olay.preference);
  }
  const dogru = olay.outcome === "correct" ? 1 : 0;
  return db
    .prepare(
      `INSERT INTO akis_kart_durumu (user_id, kart_id, sonraki_tekrar, aralik, kolaylik, tekrar, dogru, yanlis, guncellendi)
       VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(user_id, kart_id) DO UPDATE SET
         sonraki_tekrar = strftime('%Y-%m-%dT%H:%M:%fZ', ?8, '+' || (
           CASE WHEN ?9 = 0 THEN 1 WHEN tekrar = 0 THEN 1 WHEN tekrar = 1 THEN 3
                ELSE CAST(MAX(1, ROUND(aralik * kolaylik)) AS INTEGER) END
         ) || ' days'),
         aralik = CASE WHEN ?9 = 0 THEN 1 WHEN tekrar = 0 THEN 1 WHEN tekrar = 1 THEN 3
                       ELSE CAST(MAX(1, ROUND(aralik * kolaylik)) AS INTEGER) END,
         kolaylik = CASE WHEN ?9 = 0 THEN MAX(1.3, kolaylik - 0.2) ELSE kolaylik END,
         tekrar = CASE WHEN ?9 = 0 THEN 0 ELSE tekrar + 1 END,
         dogru = dogru + ?6, yanlis = yanlis + ?7, guncellendi = ?8`
    )
    .bind(userId, kartId, gunSonra(nowIso, 1), dogru ? 2.5 : 2.3, dogru, dogru, 1 - dogru, nowIso, dogru);
}

export async function recordPakEvent(userId: string, raw: unknown): Promise<Sonuc> {
  const db = env.DB;
  if (!db) return { status: 500, error: "Veritabanı bağlantısı kurulamadı." };

  const kind = (raw as { kind?: unknown } | null)?.kind;
  let eventId: string;
  let cardId: string;
  let mode: string;
  let olay: Olay;
  let payload: string;
  let outcome: "correct" | "incorrect" | null = null;
  let secimJson: string | null = null;

  if (kind === "answer") {
    const p = pakCevapSchema.safeParse(raw);
    if (!p.success) return { status: 400, error: p.error.issues[0]?.message || "Geçersiz olay verisi." };
    const id = pakKimligi(p.data.cardId);
    const kart = id ? await kartBul(userId, id) : undefined;
    if (!kart) return { status: 404, error: "Akış kartı bulunamadı." };
    const d = degerlendir(kart, p.data.secim);
    if (!d.ok) return { status: 400, error: d.hata };
    outcome = d.outcome;
    secimJson = canonicalJson(p.data.secim);
    ({ eventId, cardId, mode } = p.data);
    payload = canonicalJson(p.data);
    olay = { kind: "answer", outcome };
  } else {
    const p = feedEventSchema.safeParse(raw);
    if (!p.success) return { status: 400, error: p.error.issues[0]?.message || "Geçersiz olay verisi." };
    if (p.data.kind === "answer") return { status: 400, error: "Akış cevabı secim ister." };
    const id = pakKimligi(p.data.cardId);
    if (!id || !(await kartBul(userId, id))) return { status: 404, error: "Akış kartı bulunamadı." };
    ({ eventId, cardId, mode } = p.data);
    payload = canonicalJson(p.data);
    olay = p.data.kind === "view" ? { kind: "view" } : { kind: "preference", preference: p.data.preference };
  }

  const oku = () =>
    db
      .prepare("SELECT payload, outcome FROM akis_olaylari WHERE user_id = ? AND event_id = ? LIMIT 1")
      .bind(userId, eventId)
      .first<{ payload: string; outcome: string | null }>();
  const tekrarYaniti = (m: { payload: string; outcome: string | null }): Sonuc =>
    m.payload !== payload
      ? { status: 409, error: "Aynı eventId farklı bir içerikle zaten kaydedilmiş." }
      : { status: 200, data: { eventId, duplicate: true, ...(m.outcome ? { outcome: m.outcome as "correct" | "incorrect" } : {}) } };

  const mevcut = await oku();
  if (mevcut) return tekrarYaniti(mevcut);

  const nowIso = new Date().toISOString();
  const ekle = db
    .prepare(
      `INSERT INTO akis_olaylari (event_id, user_id, kart_id, kind, mode, outcome, secim, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(eventId, userId, cardId, olay.kind, mode, outcome, secimJson, payload, nowIso);

  try {
    // Tek batch = tek işlem: olay satırı unique indekse takılırsa durum güncellemesi de geri alınır.
    await db.batch([ekle, durumUpsert(db, userId, cardId, olay, nowIso)]);
    return { status: 200, data: { eventId, duplicate: false, ...(outcome ? { outcome } : {}) } };
  } catch {
    const yarisan = await oku();
    return yarisan ? tekrarYaniti(yarisan) : { status: 500, error: "Olay kaydedilemedi." };
  }
}

export interface AkisDurumu {
  id: string;
  dogru: number;
  yanlis: number;
  goruldu: number;
  tercih: "like" | "dislike" | null;
  sonrakiTekrar: string;
  tekrar: number;
  due: boolean;
}

// Yalnız çağıran kullanıcının satırları (user_id = ?); başka kullanıcının durumu sorguya girmez.
export async function akisDurumuOku(userId: string) {
  const db = env.DB;
  if (!db) {
    return { durumlar: [] as AkisDurumu[], zayif: [] as ReturnType<typeof etiketZayifligi>, gecTekrar: gecTekrarHesapla([]), uretilenler: [] as AkisKart[] };
  }
  const { results } = await db
    .prepare(
      `SELECT kart_id, dogru, yanlis, goruldu, tercih, sonraki_tekrar, tekrar
       FROM akis_kart_durumu WHERE user_id = ? ORDER BY kart_id`
    )
    .bind(userId)
    .all<{ kart_id: string; dogru: number; yanlis: number; goruldu: number; tercih: string | null; sonraki_tekrar: string; tekrar: number }>();
  const simdi = new Date().toISOString();
  const durumlar: AkisDurumu[] = [];
  for (const r of results ?? []) {
    const id = pakKimligi(r.kart_id);
    if (!id || !(KATALOG.has(id) || uretKartiMi(id))) continue;
    durumlar.push({
      id,
      dogru: Number(r.dogru),
      yanlis: Number(r.yanlis),
      goruldu: Number(r.goruldu),
      tercih: r.tercih === "like" || r.tercih === "dislike" ? r.tercih : null,
      sonrakiTekrar: r.sonraki_tekrar,
      tekrar: Number(r.tekrar),
      // Vade yalnız en az bir kez cevaplanmış kartta anlamlı; yalnız görülen kart "tekrar" sayılmaz.
      due: Number(r.dogru) + Number(r.yanlis) > 0 && r.sonraki_tekrar <= simdi,
    });
  }
  const ilerleme: Ilerleme = Object.fromEntries(durumlar.map((d) => [d.id, { d: d.dogru, y: d.yanlis, son: null }]));
  const cevaplar = await db
    .prepare("SELECT kart_id, outcome, created_at FROM akis_olaylari WHERE user_id = ? AND kind = 'answer' ORDER BY sequence")
    .bind(userId)
    .all<{ kart_id: string; outcome: string; created_at: string }>();
  const gecTekrar = gecTekrarHesapla(
    (cevaplar.results ?? []).map((r) => ({ kart: r.kart_id, dogru: r.outcome === "correct", t: Date.parse(r.created_at) }))
  );
  const uretilenler = await uretilenKartlar(userId);
  return { durumlar, zayif: etiketZayifligi(AKIS_KARTLARI, ilerleme).slice(0, 10), gecTekrar, uretilenler };
}

export async function uretilenKartlar(userId: string): Promise<AkisKart[]> {
  const db = env.DB;
  if (!db) return [];
  const { results } = await db
    .prepare("SELECT kart FROM akis_uretilen WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
    .bind(userId)
    .all<{ kart: string }>();
  const kartlar: AkisKart[] = [];
  for (const r of results ?? []) {
    try {
      const p = akisKartSchema.safeParse(JSON.parse(r.kart));
      if (p.success) kartlar.push(p.data);
    } catch {
      /* bozuk satır atlanır */
    }
  }
  return kartlar;
}
