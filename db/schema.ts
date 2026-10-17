import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const units = sqliteTable("units", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pdfSources = sqliteTable("pdf_sources", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  unitId: text("unit_id"),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull().default("application/pdf"),
  storageKey: text("storage_key").notNull(),
  pageCount: integer("page_count"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const studyNotes = sqliteTable("study_notes", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  unitId: text("unit_id"),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const studyItems = sqliteTable("study_items", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  unitId: text("unit_id"),
  pdfSourceId: text("pdf_source_id"),
  sourcePage: integer("source_page"),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull().default("flashcard"), // 'question' | 'flashcard'
  prompt: text("prompt").notNull(),
  answer: text("answer").notNull(),
  hint: text("hint"),
  intervalDays: integer("interval_days").notNull().default(0),
  easeFactor: real("ease_factor").notNull().default(2.5),
  repetitionCount: integer("repetition_count").notNull().default(0),
  lastReviewedAt: text("last_reviewed_at"),
  nextReviewAt: text("next_review_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reviewEvents = sqliteTable("review_events", {
  id: text("id").primaryKey(),
  studyItemId: text("study_item_id").notNull().references(() => studyItems.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull(),
  userId: text("user_id").notNull(),
  rating: text("rating").notNull(), // 'again' | 'hard' | 'good' | 'easy'
  userResponse: text("user_response"),
  reviewedAt: text("reviewed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pdfWorkspaces = sqliteTable("pdf_workspaces", {
  pdfId: text("pdf_id")
    .primaryKey()
    .references(() => pdfSources.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  revision: integer("revision").notNull().default(0),
  document: text("document").notNull(),
  lastMutationId: text("last_mutation_id"),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const feedEvents = sqliteTable(
  "feed_events",
  {
    sequence: integer("sequence").primaryKey({ autoIncrement: true }),
    eventId: text("event_id").notNull(),
    userId: text("user_id").notNull(),
    cardId: text("card_id")
      .notNull()
      .references(() => studyItems.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull(),
    kind: text("kind").notNull(),
    mode: text("mode").notNull(),
    preference: text("preference"),
    outcome: text("outcome"),
    userResponse: text("user_response"),
    durationMs: integer("duration_ms"),
    payload: text("payload").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("feed_events_user_event_idx").on(table.userId, table.eventId),
    index("feed_events_user_card_seq_idx").on(table.userId, table.cardId, table.sequence),
  ]
);

// Akış v2 paket kartları (`pak:<id>`) study_items'ta yaşamaz; olay ve durum ayrı tablolarda tutulur.
export const akisOlaylari = sqliteTable(
  "akis_olaylari",
  {
    sequence: integer("sequence").primaryKey({ autoIncrement: true }),
    eventId: text("event_id").notNull(),
    userId: text("user_id").notNull(),
    kartId: text("kart_id").notNull(),
    kind: text("kind").notNull(),
    mode: text("mode").notNull(),
    outcome: text("outcome"),
    secim: text("secim"),
    payload: text("payload").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("akis_olaylari_user_event_idx").on(table.userId, table.eventId),
    index("akis_olaylari_user_kart_seq_idx").on(table.userId, table.kartId, table.sequence),
  ]
);

export const akisKartDurumu = sqliteTable(
  "akis_kart_durumu",
  {
    userId: text("user_id").notNull(),
    kartId: text("kart_id").notNull(),
    sonrakiTekrar: text("sonraki_tekrar").notNull(),
    aralik: integer("aralik").notNull().default(0),
    kolaylik: real("kolaylik").notNull().default(2.5),
    tekrar: integer("tekrar").notNull().default(0),
    dogru: integer("dogru").notNull().default(0),
    yanlis: integer("yanlis").notNull().default(0),
    goruldu: integer("goruldu").notNull().default(0),
    tercih: text("tercih"),
    guncellendi: text("guncellendi").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.kartId] })]
);

// Kullanıcının istediği, modelin ürettiği ve doğrulanmamış kartlar (kimlik `uret-` önekli; olaylarda `pak:uret-…`).
export const akisUretilen = sqliteTable(
  "akis_uretilen",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    kart: text("kart").notNull(), // AkisKart JSON
    istek: text("istek").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.id] })]
);
