# Blake Johnson — Locked Design Spec

Status: **LOCKED** · November 25, 2026 (homepage simplified the same evening)
Reference mockups: https://claude.ai/artifact/UNimQxvCtdiVm2pFHzuLqP (boards "Magazine-style home" and "Post with header image — magazine style")

Change anything here only on purpose. Claude Code should treat this file as the source of truth for the public site's look.

---

## 1. Overall direction

- A literary journal in print: mostly black, white and grey, with serif type and thin rules. Keep it simple, and closer to a quiet personal journal than a busy magazine homepage.
- Quiet and elevated: no ornament, no gradients, no shadows on the public site.
- **Blue only sparingly**, for Subscribe buttons and the "Continue reading →" link.
- **No crest or logo.** The name is set in type only.

## 2. Color palette

| Role | Hex | Use |
|---|---|---|
| Ink | `#141414` | Headlines, labels, rules, top bar, footer |
| Body text | `#2A2723` | Article text, drop cap |
| Slate grey | `#5C5852` | Kickers, dates, bylines, captions |
| Rule grey | `#DDD8CF` | Hairline dividers between list items |
| Warm light grey | `#F2F1EE` | Newsletter box, subscriber gate |
| White | `#FFFFFF` | Page background |
| Navy (accent) | `#1F3A68` | Subscribe buttons, "Continue reading →", checkbox accents, link hover only |

Rule of thumb: about 60% white, 30% ink and grey, and under 10% navy.

## 3. Typography (Google Fonts)

| Element | Font | Notes |
|---|---|---|
| Masthead name, headlines, section display | **Libre Caslon Display** | Weight 400 |
| List titles, pull quotes | **Libre Caslon Text** | Regular and italic |
| Body text, UI | **EB Garamond** | 21px desktop / 16–17px mobile, line-height 1.65–1.7 |
| Drop cap only | **Cormorant Garamond 500** | See §5 |

- Section labels: small all caps, 15px, weight 600, letter-spacing 0.24em, ink color, with a 1px ink rule beneath and an italic grey "More…" link.
- Kickers (e.g., "Essay · Advent"): 13–14px all caps, letter-spacing ~0.22em, slate grey.
- Subtitles: EB Garamond italic, 24–26px desktop.

## 4. Site structure

**Homepage**
1. Black top strip with the tagline line, Sign in, and a navy Subscribe button
2. Centered masthead: date line, "Blake Johnson" (~88px), italic tagline *"Reading, thinking, and writing in the light of faith"*, and nav between a thin top rule and a double bottom rule: Essays · Commonplace · Letters to the Parish · Sermons · Archive · About
3. **Lead story in one centered column (max 860px)**: 2:1 image, kicker, headline, italic subtitle, byline, opening paragraph with drop cap, and "Continue reading →". **No sidebar.**
4. **"The Latest" directly under the lead story**, same column: simple rows of type label (small caps, grey), title (Caslon Text) and date or meta, separated by hairlines
5. Newsletter box (warm grey) with checkboxes: Essays (every other Monday), Letters to the Parish (Sundays)
6. "From the Commonplace Book": two quotes with sources
7. Black footer: name, tagline, link columns (Read / Parish / About), © line, and the ESV credit line

Removed for now (can return later): the three-column row (Essays / Letters / Sermons) and the "This Season" liturgical panel.

**Post page**
1. Black top strip, then a compact header (name left, nav right) over a double rule
2. Centered title block: kicker → title (~72px Caslon) → italic subtitle → 48px rule → byline line (BY BLAKE JOHNSON · DATE · X MIN READ)
3. **Header image**: full content width (max 1180px), aspect ratio **21:9**, with a caption row below (italic caption on the left, small-caps credit on the right, hairline under it)
4. Body in a 680px column: drop cap opening, section headings in small caps, pull quotes centered between thin ink rules in Libre Caslon Text italic
5. Subscriber gate: the text fades out, then a warm grey panel with "Subscribe to keep reading" and a navy Subscribe button
6. Tags ("Filed under"), "More to read" (three items), black footer

## 5. Drop cap (locked)

- First letter: **Cormorant Garamond 500**, color `#2A2723` (not navy), about 3 lines tall (84px at 21px body; 66px at 16px mobile), `line-height: 0.8`, floated left with ~10px right padding.
- Lead-in: the rest of the first few words in small capitals (uppercase at 0.8em, letter-spacing 0.06em), in the text color.
- Applied automatically to the first paragraph of every essay. Shrinks proportionally on phones.
- No boxes, tiles, frames or illuminated ornament.

## 6. "Read more" (locked: Option A)

- An italic text link at the end of the teaser paragraph: **"Continue reading →"** in navy `#1F3A68`.
- No button, no underline by default; underline on hover.

## 7. Buttons and forms

- Primary (Subscribe): navy fill, white text, small caps 14px with 0.14em letter-spacing, square corners, 52px tall in forms.
- Secondary: 1px ink outline, transparent fill, same type.
- Inputs: square corners, 1px ink border, EB Garamond 18px. Every input has a label (visible or screen-reader only).
- Minimum tap target 44px.

## 8. Images

- Header images: 21:9, real photography (your church, windows, books, landscapes). Always captioned and credited.
- Homepage lead: 2:1.
- Sources: your own photos, Unsplash, or Wikimedia Commons, with credit in the caption line.

## 9. Do not

- Add a crest or logo (removed by choice)
- Put a sidebar beside the lead story
- Add the three-column section row or the season panel (not for now)
- Use navy for headings, section labels, panels or backgrounds
- Use ornamental or boxed drop caps
- Use gradients, drop shadows or rounded "app-style" cards on the public site

---

## Amendments

### Nov 25, 2026 — Block quotes (chosen by Blake)

- Block quotes in posts use the **Commonplace style**, the same as the homepage "From the Commonplace Book" quotes: left-aligned **Libre Caslon Text italic**, 22px desktop / 19px mobile, line-height 1.45, ink color, no rules or indent.
- An optional **source line** sits beneath in EB Garamond 16px, slate grey (e.g. "Pascal, *Pensées* 139").
- Pull quotes are unchanged (centered between thin ink rules, §4).
- Commonplace notes: the first block quote (or pull quote) and its source are what the homepage shows.

### Nov 25, 2026: black top strip removed

At Blake's request, the black top strip (section line, Sign in, Subscribe) is removed from every public page. Pages now open with the masthead or compact header. Sign-in stays at /sign-in, and the subscriber gate still links to it.

### Nov 25, 2026: menu bar removed, simple blog look

At Blake's request ("simple blog like look for now"), the ruled menu bar under the masthead and the menu on post pages are removed. The header is the date line, the name and the tagline over a single rule. Sections stay reachable from the footer and the "More…" links.

### Nov 25, 2026: quieter signup box, editable wording, footer sign-in

At Blake's request the home page newsletter box is smaller and quieter: no warm-grey panel, just thin rules above and below, a 24–26px heading, 17px description, the choices on one line, and a slimmer email field. The label, heading, description, button wording and the newsletter choices (name, how often, shown or hidden, ticked by default) are edited in Studio → Settings → Signup box. A small "Sign in" link (or "Studio · Sign out" when signed in) sits in the footer's bottom line.

### Nov 25, 2026: no date line; fleur-de-lis rule under the masthead

At Blake's request the date line above the name is removed. The full-width rule under the masthead is replaced by a centered 1px ink rule, at most 560px wide, with a small fleur-de-lis (18px, ink) at each end.

### Nov 25, 2026: links line, softer rules, light footer, new text styles

At Blake's request: a single line of small-capital links (Essays, Commonplace, Letters, Sermons, Archive, About) in slate, 13px, sits under the fleur-de-lis rule. Section labels ("The Latest") now use a 1px rule-grey line, so the fleur rule is the only black line. The footer is white with a thin rule-grey line on top, ink and slate text. Posts may now use a "Heading" (h3: Caslon Display 26px, ink), strikethrough, underline and inline code, alongside the existing small-capital section label (h2).

### Nov 25, 2026: commonplace posts, video, audio, wide images

At Blake's request (mockup approved): a Commonplace post leads with its quotation in the pull-quote style (Caslon Text italic, 30px desktop / 24px mobile, between 1px ink rules, source in small capitals), then a small fleur-de-lis between two short rule-grey lines, then the note in 19px body text (17px on phones), with no drop cap and no large title. Videos (YouTube, Vimeo) show a 16:9 still with a quiet round play mark and load the player only when pressed. Audio shows its title in small capitals over a slim player between rule-grey lines. In-text images may be "Text width" or "Wide" (up to 860px). The post page header uses a single rule-grey line instead of the double rule.

### Nov 25, 2026: tapered rule under the masthead

At Blake's request (option G), the fleur-de-lis rule under the masthead is replaced by a centered 1.5px ink rule, at most 560px wide, that fades to nothing at both ends. The small fleur-de-lis remains only as the divider inside Commonplace posts.

### Amendment: Studio dashboard (Nov 26, 2026)
The private Studio (Posts, Subscribers, Settings) now uses a plain sans-serif dashboard look modeled on Substack: a left sidebar, rounded buttons and panels, sentence-case labels. This spec governs the public site only; the Studio is not reader-facing. The writing surface in the editor keeps the public serif type so drafts look like the finished post.

### Amendment: editable site name and tagline (Nov 26, 2026)
The site name and the italic tagline are now set in Studio → Settings → Site name. They appear in the masthead, post header, both footers, the browser tab title and the RSS feed. Defaults remain "Blake Johnson" and the §4 tagline. An empty site name falls back to the default; an empty tagline hides the tagline everywhere. Styling is unchanged. Bylines ("by Blake Johnson") and email headers still use the author's name.

### Amendment: commonplace quotes in "The Latest" (Nov 26, 2026)
On the home page, a commonplace post whose quotation is 45 words or fewer shows the whole quotation in its row instead of a title: Caslon italic 20px in curly quotes, with the source below in 16px slate. Longer quotations are cut to their first 30 words and end with an ellipsis (…) inside the closing quote mark; the whole row links to the post, where the full quotation and note appear. Only the free part of a post is read.

### Amendment: Substack-style reading features (Nov 26, 2026)
- Home: the list under the lead story is now labelled **Recent** (was "The Latest", which repeated the lead story's role).
- Post rows (home, section pages, tags, archive): the italic subtitle (17px slate) sits under the title, and a post with a header image shows a square thumbnail at the right of its row (88px; 64px on phones). Rows without an image stay text only.
- Archive: a search box (the newsletter box's inline form and navy button) above the type and tag filters. It searches titles, subtitles and summaries, and the text of free posts only; subscriber-only text is never searched.
- End of every post: a "Share" row styled like "Filed under" (Copy link, Email; no outside scripts), then the compact signup box, which is hidden when the subscriber gate is already showing.

### Amendment: fully locked subscriber posts (Nov 26, 2026)
A subscribers-only post can be set to "Title and subtitle only" in the post's Settings. Visitors who aren't subscribed see the kicker, title, subtitle, byline and header image, then the existing subscriber box; none of the text is sent to the browser. On the home page such a post shows no opening paragraph, only "Continue reading".

### Amendment: public cleanup (Nov 26, 2026)
- Post rows (everywhere): Substack-style stacking. A 13px uppercase meta line (type · date · Subscribers), then the title (Caslon Text 22px; hover underline) and italic subtitle, with a 96px square thumbnail at the right (72px on phones). Rows have 24px of space above and below. This replaces the three-column row, so long labels no longer wrap.
- Home: "From the Commonplace Book" is removed (short quotes already appear in Recent); it stays on the Commonplace page.
- Archive: search is a single thin underline field (press Enter); type filters are small-caps words with the selected one underlined; tags are a plain "Tags:" line separated by middle dots; posts are grouped under one section label per month ("November 2026").
- End of posts: "Filed under" is plain text links separated by middle dots, not boxed buttons. (Share links were removed at Blake's request: no sharing features.)

### Amendment: editable footer (Nov 26, 2026)
The footer's link columns (up to four, each with a heading and up to ten links) and the credit line are edited in Studio → Settings → Footer. Defaults are the §4 columns and the ESV credit. Styling is unchanged. The site has no sharing features.

### Amendment: signup box on a warm panel (Nov 26, 2026)
The compact signup box (home page and end of posts) now sits on the warm panel colour used by the subscriber box (`bg-warm`), with no top or bottom rules, so it reads as its own block instead of another line in the list above. Type and spacing are unchanged.

### Amendment: navy hover everywhere (Nov 26, 2026)
Every link on the public site (titles in lists, the masthead name and menu, footer links, tags, archive filters, Sign in) now turns navy on hover with a soft 0.15s fade, instead of some links turning black or underlining. Navy remains reserved for hover, Subscribe, "Continue reading" and checkboxes. Planned link previews use black rules (not the warm grey hairline).

### Amendment: Notes replace the Commonplace Book (Nov 26, 2026)
There are two kinds of writing: Posts (essays, letters, sermons) and Notes. A note has no title. It can hold a pull quote with its source, a short comment, images, video, audio and link previews. The section is called "Notes" (menu, home, footer, archive) and lives at /notes; old /commonplace addresses redirect there. Notes appear as a stream: a small-caps date line ("Friday · Nov 20"), then the note in full. The home page shows the latest three notes under "Notes", below Recent and above the signup box. A single note page opens with "Note · Friday, November 20, 2026" and ends with "← All notes".

### Amendment: link previews (Nov 26, 2026, chosen by Blake: style A)
A link can be shown as a preview block: publication in small caps (11px, slate), the article title (Caslon 20px), then "by Author · Read at domain →" in italic slate. It sits between two black rules (1px, `#000`), inset 40px on each side (12px on phones), with no box or fill. On hover only the title turns navy. In the editor: paste a link on an empty line, or choose More → Link preview; the publication, title and author are filled in automatically and can be edited.

### Amendment: insert from my site (Nov 26, 2026)
In the editor, More → From my site lists recent writing. A post goes in as a link preview; a note is copied in. There is no automatic weekly digest email.

### Amendment: fewer lines (Nov 26, 2026)
Lines are kept only where they separate sections. Removed: the rule under the compact header, the second rule inside the footer, the rule after the last row of any list, and the rules between "More to read" items. Remaining rules: section labels, between rows, link previews, and the top of the footer.

### Amendment: simpler menu and calmer home page (Nov 26, 2026)
- The top menu has three items: Posts, Notes, About (wider spacing between them).
- Posts (/posts) replaces the Archive: search, type filters (All, then only the types that have writing), tags, and posts grouped by month. Notes are not listed there. /archive redirects to /posts.
- Home: the lead post, then "Posts" (four latest, "All posts" link), then "Notes" (two latest, "All notes" link), then the signup box. Space between sections is doubled (80px, 96px on wide screens).
- The default footer has two link columns: Read (Posts, Notes) and About (About Blake, Subscribe, Privacy). Saved footer links to /archive now show as Posts.

### Amendment: italic book titles in quote sources (Nov 26, 2026)
In a quote's source line, select a book title and press ⌘I (Ctrl+I on Windows) to italicize it, e.g. "C.S. Lewis, *The Screwtape Letters*". The rest of the source line stays roman. Works in block quotes and pull quotes, on the site and in emails.

### Amendment: one home feed (Nov 26, 2026)
Below the lead post, the home page has a single "Latest" feed: the eight newest posts and notes together, newest first. Posts use the usual row; notes appear in full with a "Note · Friday · Nov 20" line. Under the feed: "All posts · All notes" in italic. This replaces the separate Posts and Notes sections.

### Amendment: editing around blocks (Nov 26, 2026)
In the editor: click the space between two blocks that aren't text (a quote and a link preview, two images) to start a new line there; Enter on an empty line, or the down arrow on the last line, leaves a quote; quotes, link previews and images show hover tools ("Plain text" for quotes, "Delete"). Link-preview titles drop a trailing publication name ("… - First Things").

### Amendment: notes stay off the home page (Nov 26, 2026)
Replaces "one home feed". Below the lead post, "Latest" lists the five newest posts only, with an "All posts" link. Notes are reached from the menu.

### Amendment: clipped notes in lists (Nov 26, 2026)
On the Notes page, a note longer than about 80 words (pictures count as 60, link previews as 25) is cut at the next paragraph with "…", followed by "Read the whole note →" in navy italic. The cut is made on the server. A note's own page always shows it in full.

### Amendment: signup box symmetry (Nov 26, 2026)
The email field and Subscribe button in the compact signup box now span the full inner width of the warm panel, so the space on the left and right is equal.

### Amendment: two-line drop cap; no blank gaps (Nov 26, 2026)
The drop cap is a true two-line drop: its top lines up with the tall letters of the first line and its foot sits on the second line's baseline (80px desktop, 62px phones), so no third line is indented beside empty space. Empty paragraphs left in the editor are not shown on the public page, so they no longer create extra gaps.

### Amendment: notes set apart in the stream (Nov 26, 2026)
On the Notes page, each note has 64px above and below (48px on phones) with the hairline between notes, while the parts inside a note sit closer together (16px), so each note reads as one unit. Pull quotes inside the stream are smaller (22px, less padding). Quotes longer than about 45 words are cut after about 40 words with "…" and "Read the whole note →".

### Amendment: subscriber marking (Nov 27, 2026)
Subscriber posts say so everywhere: the home lead story's byline ends "· Subscribers", and a fully locked lead shows "For subscribers · Continue reading →" in place of the opening. On the post page the byline ends "· Subscribers" (or "· Subscribers only" when the whole post is locked), which the owner also sees while signed in.
