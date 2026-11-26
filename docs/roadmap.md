# Roadmap: Blake Johnson

A quiet, literary journal for essays, commonplace notes, letters to the parish,
and (later) sermons. Built in four stages. The database is designed in Stage 1
so that Stages 2 to 4 fit in without rewrites.

**Ground rules for every stage**

- Public styling follows `docs/design-spec.md` exactly. No invented styles.
- No AI writing, rewriting, or generation features anywhere.
- No tracking pixels or third-party analytics.
- All secrets live in environment variables (see `.env.example`).
- Small steps, frequent commits, and a plain-English "what to test" after each step.

**Tech:** Next.js (App Router) + TypeScript + Tailwind CSS · PostgreSQL on
Railway with Drizzle ORM and migrations · Better Auth (email magic links;
roles ADMIN and SUBSCRIBER) · Resend for all email · TipTap editor · Harper
grammar checking in the browser · Railway storage bucket for images · Railway
Hobby plan, deployed from GitHub, with Railway cron for scheduled publishing ·
Domain at Namecheap.

---

## Stage 1: Public site, private editor, subscriptions and newsletters

Goal: go live with essays.

**Public site**
- Homepage: black top strip (Sign in, navy Subscribe), centered masthead (date
  line, name, tagline, nav), single-column lead story with drop cap and
  "Continue reading →", "The Latest" list, newsletter box, "From the
  Commonplace Book" quotes, black footer.
- Post page: compact header, centered title block, 21:9 header image with
  caption and credit, 680px reading column, automatic drop cap, pull quotes,
  small-caps section headings, tags, "More to read".
- Subscriber gate: Free or Subscribers-only posts, with a paywall line placed
  in the editor. Gated text is never sent to non-subscribers' browsers.
- Pages: Archive (year/month, filter by type and tag), Tag pages, About,
  Commonplace index, Letters to the Parish index, Privacy.
- Post types: Essay, Commonplace note, Parish letter (Sermon reserved).
- Responsive, accessible, fast; SEO with titles, descriptions, Open Graph
  images, sitemap, RSS.

**Private editor (/studio, admin only)**
- Dashboard of posts with status, type, date, search and filter.
- TipTap WYSIWYG editor styled like the public post, with toolbar, "/" menu,
  floating selection toolbar, images, footnotes, paywall line, autosave.
- "Check spelling & grammar" (Harper, on demand) with Fix / Ignore / Add to
  dictionary; personal dictionary saved in the database.
- Post settings: type, audience, web address, summary, tags, header image,
  caption, credit, email lists.
- Preview, Publish now, Schedule (America/Chicago), Unpublish, Delete.
- Word count and reading time.
- "Export everything": zip of posts as Markdown, images, and subscribers CSV.

**Subscribers and newsletters**
- Subscribe form with Essays and Letters to the Parish lists; double opt-in.
- Magic-link sign-in for subscribers.
- Optional email of each post to chosen lists on publish (now or scheduled).
- One-click per-list unsubscribe and a footer with name and mailing address.
- Admin subscriber lists, counts, CSV export, manual add/remove.
- Rate limiting on subscribe and sign-in.

**Data model prepared now for later stages:** notes, note links, sources and
highlights, outlines, ideas/board state, calendar entries, sermons and series.

---

## Stage 2: Notebook (Zettelkasten)

- Note cards: fleeting, literature, and permanent.
- `[[links]]` between notes, automatic backlinks, and a graph view.
- Zotero import of sources and highlights into an inbox for processing.

## Stage 3: Outliner, idea board, and calendar

- Outliner with nested bullets; drag notes in; "Draft from outline" creates a
  draft post from the outline's structure (no AI writing).
- Idea board: Ideas → Drafting → Editing → Ready → Scheduled → Published.
- Calendar with publishing rhythm, liturgical-year overlay, and reminders.

## Stage 4: Sermons

- Sermon Manager: grid, radial, and list views; add a whole series at once;
  lectionary.
- Sermon Builder.
- ESV API scripture insertion.
- Slides and handout export.
- Preaching mode.

## Parking lot

- Image search inside the editor: find and insert Unsplash or public-domain
  images (e.g. Wikimedia Commons), with the credit filled in automatically.
- Note kinds (fits Stage 2): today's public Notes are posts of type "note"
  (stored as `commonplace`). Later add a nullable `note_kind` column
  (fleeting, literature, permanent) and a `source_id` linking to a Sources
  table (book or article: title, author, year, ISBN/URL). Fleeting and
  literature notes stay private by default; any note can be published to
  the Notes page as it is today. A book review draft can be started from a
  source, gathering its literature notes into the editor (copied in, like
  "From my site"; no AI writing). No migration of existing notes needed:
  they become permanent notes with no source.
