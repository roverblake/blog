/**
 * Database schema for the whole project.
 *
 * Stage 1 uses: auth tables, posts, tags, media, subscribers and lists,
 * email sends, settings, dictionary, rate limits.
 * Stages 2 to 4 tables are created now (empty) so later work only adds
 * features, not rewrites: notes, sources, highlights, outlines, ideas,
 * calendar, sermons.
 *
 * Rich text (posts, notes, sermons) is stored as TipTap JSON in `content`,
 * with a plain-text copy in `contentText` for search, word counts and email.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Auth (Better Auth core tables, plus a `role` column)                */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["admin", "subscriber"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("subscriber"),
  ...timestamps,
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

/** Shared by Better Auth (sign-in) and our own subscribe form. */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Storage key of the original upload in the bucket. */
  storageKey: text("storage_key").notNull().unique(),
  originalName: text("original_name"),
  mimeType: text("mime_type").notNull(),
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"),
  alt: text("alt"),
  /** Resized web versions: [{ width, storageKey, format }]. */
  variants: jsonb("variants").$type<{ width: number; storageKey: string; format: string }[]>()
    .notNull()
    .default([]),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

export const postType = pgEnum("post_type", [
  "essay",
  "commonplace",
  "parish_letter",
  "sermon", // reserved for Stage 4
]);
export const postStatus = pgEnum("post_status", ["draft", "scheduled", "published"]);
export const postVisibility = pgEnum("post_visibility", ["everyone", "subscribers"]);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: postType("type").notNull().default("essay"),
    status: postStatus("status").notNull().default("draft"),
    visibility: postVisibility("visibility").notNull().default("everyone"),
    /** Subscribers-only posts: when true, visitors see only the title and subtitle (no opening). */
    fullyLocked: boolean("fully_locked").notNull().default(false),
    title: text("title").notNull().default(""),
    subtitle: text("subtitle"),
    kicker: text("kicker"),
    slug: text("slug").notNull().unique(),
    summary: text("summary"),
    /** TipTap document JSON. The paywall line is a node inside it. */
    content: jsonb("content").notNull().default({ type: "doc", content: [] }),
    contentText: text("content_text").notNull().default(""),
    wordCount: integer("word_count").notNull().default(0),
    headerImageId: uuid("header_image_id").references(() => media.id, { onDelete: "set null" }),
    headerCaption: text("header_caption"),
    headerCredit: text("header_credit"),
    /** Newsletter lists to email on publish, e.g. ["essays"]. */
    emailLists: text("email_lists").array().notNull().default(sql`'{}'::text[]`),
    /** When a scheduled post should go live (stored in UTC). */
    publishAt: timestamp("publish_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("posts_status_published_idx").on(t.status, t.publishedAt),
    index("posts_type_idx").on(t.type),
    index("posts_publish_at_idx").on(t.publishAt),
  ],
);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ...timestamps,
});

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] }), index("post_tags_tag_idx").on(t.tagId)],
);

/* ------------------------------------------------------------------ */
/* Subscribers and newsletters                                         */
/* ------------------------------------------------------------------ */

/** Newsletter lists. Seeded with "essays" and "parish". */
export const lists = pgTable("lists", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
});

export const subscriberStatus = pgEnum("subscriber_status", ["pending", "confirmed"]);

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  status: subscriberStatus("status").notNull().default("pending"),
  /** SHA-256 of the double opt-in token; cleared once confirmed. */
  confirmTokenHash: text("confirm_token_hash"),
  confirmTokenExpiresAt: timestamp("confirm_token_expires_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  /** Stable secret used in one-click unsubscribe links. */
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  /** "form", "admin", or "import". */
  source: text("source").notNull().default("form"),
  ...timestamps,
});

export const subscriberLists = pgTable(
  "subscriber_lists",
  {
    subscriberId: uuid("subscriber_id")
      .notNull()
      .references(() => subscribers.id, { onDelete: "cascade" }),
    listSlug: text("list_slug")
      .notNull()
      .references(() => lists.slug, { onDelete: "cascade" }),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
    /** Set when they unsubscribe from this list; null means active. */
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.subscriberId, t.listSlug] })],
);

/** One row per (post, list) newsletter send, so a post is never emailed twice. */
export const emailSends = pgTable(
  "email_sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    listSlug: text("list_slug")
      .notNull()
      .references(() => lists.slug),
    status: text("status").notNull().default("pending"), // pending | sending | sent | failed
    recipientCount: integer("recipient_count").notNull().default(0),
    resendIds: jsonb("resend_ids").$type<string[]>().notNull().default([]),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("email_sends_post_list_uq").on(t.postId, t.listSlug)],
);

/* ------------------------------------------------------------------ */
/* Settings and editor helpers                                         */
/* ------------------------------------------------------------------ */

/** Key/value site settings: mailing address, About page, tagline, etc. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  ...timestamps,
});

/** Personal dictionary for the spelling and grammar check. */
export const dictionaryWords = pgTable("dictionary_words", {
  word: text("word").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Stage 2: Notebook                                                   */
/* ------------------------------------------------------------------ */

export const noteKind = pgEnum("note_kind", ["fleeting", "literature", "permanent"]);

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  zoteroKey: text("zotero_key").unique(),
  itemType: text("item_type"),
  title: text("title").notNull(),
  authors: jsonb("authors").$type<{ first?: string; last?: string; name?: string }[]>()
    .notNull()
    .default([]),
  year: text("year"),
  url: text("url"),
  citation: text("citation"),
  raw: jsonb("raw"),
  ...timestamps,
});

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: noteKind("kind").notNull().default("fleeting"),
    title: text("title").notNull().default(""),
    content: jsonb("content").notNull().default({ type: "doc", content: [] }),
    contentText: text("content_text").notNull().default(""),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("notes_kind_idx").on(t.kind)],
);

/** [[links]] between notes. Backlinks are the same rows read the other way. */
export const noteLinks = pgTable(
  "note_links",
  {
    fromNoteId: uuid("from_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    toNoteId: uuid("to_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.fromNoteId, t.toNoteId] }),
    index("note_links_to_idx").on(t.toNoteId),
  ],
);

export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.tagId] })],
);

/** Notes that fed into a post (for "sources of this essay" later). */
export const postNotes = pgTable(
  "post_notes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.noteId] })],
);

export const highlightStatus = pgEnum("highlight_status", ["inbox", "processed", "dismissed"]);

/** Zotero highlights land here as an inbox to process into notes. */
export const highlights = pgTable(
  "highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    zoteroKey: text("zotero_key").unique(),
    text: text("text").notNull(),
    comment: text("comment"),
    page: text("page"),
    color: text("color"),
    status: highlightStatus("status").notNull().default("inbox"),
    noteId: uuid("note_id").references(() => notes.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("highlights_status_idx").on(t.status)],
);

/* ------------------------------------------------------------------ */
/* Stage 3: Outliner, idea board, calendar                             */
/* ------------------------------------------------------------------ */

export const outlines = pgTable("outlines", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default(""),
  /** The draft created by "Draft from outline", if any. */
  postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
  ...timestamps,
});

export const outlineItems = pgTable(
  "outline_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    outlineId: uuid("outline_id")
      .notNull()
      .references(() => outlines.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    position: integer("position").notNull().default(0),
    text: text("text").notNull().default(""),
    /** A note dragged into the outline. */
    noteId: uuid("note_id").references(() => notes.id, { onDelete: "set null" }),
    collapsed: boolean("collapsed").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("outline_items_outline_idx").on(t.outlineId, t.parentId, t.position)],
);

export const ideaStage = pgEnum("idea_stage", [
  "ideas",
  "drafting",
  "editing",
  "ready",
  "scheduled",
  "published",
]);

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  stage: ideaStage("stage").notNull().default("ideas"),
  position: integer("position").notNull().default(0),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
  outlineId: uuid("outline_id").references(() => outlines.id, { onDelete: "set null" }),
  ...timestamps,
});

/** Calendar items and reminders. The liturgical year is computed, not stored. */
export const calendarEntries = pgTable(
  "calendar_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("reminder"), // reminder | deadline | event
    date: date("date").notNull(),
    remindAt: timestamp("remind_at", { withTimezone: true }),
    done: boolean("done").notNull().default(false),
    postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
    ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("calendar_entries_date_idx").on(t.date)],
);

/* ------------------------------------------------------------------ */
/* Stage 4: Sermons                                                    */
/* ------------------------------------------------------------------ */

export const sermonSeries = pgTable("sermon_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: date("start_date"),
  color: text("color"),
  ...timestamps,
});

export const sermonStatus = pgEnum("sermon_status", ["planned", "drafting", "ready", "preached"]);

export const sermons = pgTable(
  "sermons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seriesId: uuid("series_id").references(() => sermonSeries.id, { onDelete: "set null" }),
    position: integer("position").notNull().default(0),
    title: text("title").notNull().default(""),
    preachDate: date("preach_date"),
    occasion: text("occasion"), // e.g. "Third Sunday of Advent"
    lectionary: text("lectionary"), // e.g. "RCL Year A"
    readings: jsonb("readings").$type<string[]>().notNull().default([]),
    status: sermonStatus("status").notNull().default("planned"),
    content: jsonb("content").notNull().default({ type: "doc", content: [] }),
    contentText: text("content_text").notNull().default(""),
    outlineId: uuid("outline_id").references(() => outlines.id, { onDelete: "set null" }),
    /** The public post, if the sermon is published on the site. */
    postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("sermons_preach_date_idx").on(t.preachDate)],
);

/** Cache of ESV API passages (respecting their caching terms). */
export const scripturePassages = pgTable("scripture_passages", {
  reference: text("reference").primaryKey(),
  version: text("version").notNull().default("ESV"),
  text: text("text").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
});
