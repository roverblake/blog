# Blake Johnson

A quiet, literary journal: essays, commonplace notes, letters to the parish,
and (later) sermons. A public website, plus a private writing studio at `/studio`.

- What's planned: [`docs/roadmap.md`](docs/roadmap.md)
- How it must look: [`docs/design-spec.md`](docs/design-spec.md) (the source of truth for all public styling)
- Before going live: [`docs/launch-checklist.md`](docs/launch-checklist.md)

**Tech:** Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL with
Drizzle ORM, Better Auth (email sign-in links), Resend (email), TipTap
(editor), Harper (spelling and grammar, in the browser). Hosted on Railway.

---

## Contents

1. [Going live on Railway (step by step)](#1-going-live-on-railway)
2. [Setting up Resend (email)](#2-setting-up-resend-email)
3. [Connecting your Namecheap domain](#3-connecting-your-namecheap-domain)
4. [If Namecheap won't verify: move DNS to Cloudflare (free)](#4-plan-b-move-dns-to-cloudflare)
5. [Scheduled publishing (Railway cron)](#5-scheduled-publishing-railway-cron)
6. [Database backups](#6-database-backups)
7. [Every environment variable, explained](#7-environment-variables)
8. [Using the Studio](#8-using-the-studio)
9. [For developers: running it locally](#9-for-developers-running-it-locally)

Words you'll see: a **service** is one running piece in Railway (the
website, the database, the scheduler). A **variable** is a setting you
type into Railway, such as a password or an address. A **DNS record** is a
line in your domain's settings that points the domain somewhere.

---

## 1. Going live on Railway

You need: a GitHub account (you have one), a Railway account on the Hobby
plan (about $5 a month), and about 30 minutes.

**a. Create the project**

1. Go to [railway.com](https://railway.com) and click **Login**, then **Login with GitHub**.
2. Choose the **Hobby** plan under your account's billing settings.
3. Click **New Project**, then **Deploy from GitHub repo**, and pick **roverblake/blog**.
   If it isn't listed, click **Configure GitHub App** and give Railway access to that repository.
4. Railway starts building straight away. The first build will fail because
   nothing is set up yet. That's expected.

**b. Add the database**

1. In the project, click **+ Create** (or **New**), then **Database**, then **PostgreSQL**.
2. Wait until it shows a green tick.

**c. Add image storage**

Choose one of these. The bucket is better.

- **Bucket (recommended):** click **+ Create**, then **Bucket**. Open it, go to the
  **Credentials** tab, and keep that page open. You'll copy five values from it in step d.
- **Volume (simpler):** click the website service, open **Settings**, find **Volumes**,
  and add a volume mounted at `/data`. Then in step d set `MEDIA_DIR` to `/data/media`
  and leave the `S3_…` variables out.

**d. Enter the settings (variables)**

Click the website service (named after your repo), then the **Variables** tab,
then **Raw Editor**. Paste the following, replacing the parts in angle brackets:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
SITE_URL=https://<your domain, e.g. blakejohnson.com>
BETTER_AUTH_URL=https://<same as SITE_URL>
BETTER_AUTH_SECRET=<a long random password, see below>
ADMIN_EMAIL=<your own email address>
RESEND_API_KEY=<from Resend, see section 2>
EMAIL_FROM=Blake Johnson <letters@<your domain>>
CRON_SECRET=<another long random password>
S3_ENDPOINT=<from the bucket's Credentials tab>
S3_REGION=<from the bucket's Credentials tab, or auto>
S3_BUCKET=<bucket name>
S3_ACCESS_KEY_ID=<from the bucket's Credentials tab>
S3_SECRET_ACCESS_KEY=<from the bucket's Credentials tab>
```

For the two random passwords, any password generator will do (for example
1Password or Apple Passwords). Make them at least 32 characters, and don't reuse them anywhere else.

Until your domain is connected, use the Railway address for `SITE_URL` and
`BETTER_AUTH_URL`. Get it from the service's **Settings**, then **Networking**,
then **Generate Domain**; it looks like `https://blog-production-1234.up.railway.app`.
Change both variables once your own domain works.

Click **Deploy** (or **Apply changes**). Railway rebuilds the site, sets up
the database automatically (that's `scripts/migrate.mjs`, which runs before every deploy),
and starts the site.

**e. Check it works**

1. Open the Railway address. You should see the homepage, saying "The first essay is on its way."
2. Go to `/sign-in`, enter your `ADMIN_EMAIL`, and click the link in your email.
3. You land in the Studio. Write a test post, then Preview, Publish, and look at it on the site.

---

## 2. Setting up Resend (email)

Resend sends the sign-in links, subscription confirmations and newsletters.

1. Sign up at [resend.com](https://resend.com) (the free plan covers 3,000 emails a month; upgrade later if needed).
2. Go to **Domains**, click **Add Domain**, and type your domain (e.g. `blakejohnson.com`).
   Choose the region nearest you (US East is fine).
3. Resend shows a short list of DNS records, usually:
   - an **MX** record on `send`
   - a **TXT** record on `send` (it starts `v=spf1`)
   - a **TXT** record on `resend._domainkey` (a long value starting `p=`)
   - optionally a **TXT** record on `_dmarc`. Add it: `v=DMARC1; p=none;`
4. Add each one in Namecheap. See section 3, part c.
5. Back in Resend, click **Verify DNS Records**. It can take from a few minutes up to a few hours.
6. Go to **API Keys**, click **Create API Key**, name it "Website", and choose **Sending access** for your domain.
   Copy the key (it starts `re_`) and paste it into Railway as `RESEND_API_KEY`.
7. Set `EMAIL_FROM` to an address on that domain, such as `Blake Johnson <letters@blakejohnson.com>`.
   That address doesn't need its own inbox, but replies will go there, so you may want to forward it to your email.

Open counts: Resend can count opens (Domains, then your domain, then **Open tracking**).
It's off by default. Turn it on only if you want rough read counts; the Privacy page mentions it.

---

## 3. Connecting your Namecheap domain

**a. Tell Railway about your domain**

1. In Railway, click the website service, then **Settings**, then **Networking**, then **Custom Domain**.
2. Type your bare domain (`blakejohnson.com`) and click **Add**. Railway shows a
   **CNAME target** (something like `abc123.up.railway.app`) and possibly a **TXT** verification record.
3. Add a second custom domain for `www.blakejohnson.com`. Railway shows a target for it too.
   Keep this page open.

**b. Add the records in Namecheap**

1. Log in to Namecheap, then **Domain List**, then **Manage** next to your domain, then the **Advanced DNS** tab.
2. Under **Host Records**, delete the parking records Namecheap added
   (usually a **CNAME** for `www` pointing at `parkingpage.namecheap.com`, and a **URL Redirect** for `@`).
3. Click **Add New Record** and add:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| **ALIAS Record** | `@` | the target Railway showed for the bare domain | 5 min |
| **CNAME Record** | `www` | the target Railway showed for `www` | 5 min |
| **TXT Record** | whatever Railway showed (e.g. `_railway-verify`) | the value Railway showed | Automatic |

4. Click the green tick on each row to save it.

In the Host box, type only the part before your domain: `@` means the bare
domain, and `www` means `www.yourdomain.com`. Namecheap adds the rest.

**c. Add the Resend email records (from section 2)**

- For the **TXT** records: Type **TXT Record**, Host `send` (or `resend._domainkey`, or `_dmarc`), and Value exactly as Resend shows.
- For the **MX** record: scroll to **Mail Settings** on the same page and set it to **Custom MX**.
  Then add **MX Record**, Host `send`, Value as Resend shows (e.g. `feedback-smtp.us-east-1.amazonses.com`), and Priority `10`.
  This only affects `send.yourdomain.com`, not any email you already receive.
  If you already use Namecheap email forwarding on the bare domain, keep those records too.

**d. Wait and check**

Railway shows a green tick on each domain once it sees the records, and it sets up
the padlock (HTTPS) by itself. This usually takes 5 to 30 minutes and can take up to a day.
Then change `SITE_URL` and `BETTER_AUTH_URL` in Railway to `https://yourdomain.com`.

---

## 4. Plan B: move DNS to Cloudflare

Only do this if Railway still can't verify the bare domain after a day.

1. Sign up at [cloudflare.com](https://cloudflare.com) (free plan), click **Add a domain**, type your domain, and choose **Free**.
2. Cloudflare copies your existing records. Check that the Resend records came across.
3. In Cloudflare, under **DNS**, then **Records**:
   - Delete any ALIAS record it couldn't import.
   - Add **CNAME**, Name `@`, Target = Railway's bare-domain target, **Proxy status: DNS only** (grey cloud).
   - Add **CNAME**, Name `www`, Target = Railway's `www` target, **DNS only** (grey cloud).
   - Add the Railway TXT record if there was one.
4. Cloudflare shows two **nameservers** (like `ada.ns.cloudflare.com`). In Namecheap, go to **Domain List**,
   **Manage**, then **Nameservers**, choose **Custom DNS**, enter both, and click the tick.
5. Wait for Cloudflare to email you that the domain is active (usually under an hour). Railway then verifies.

Keep the cloud **grey** (DNS only) for the Railway records, so Railway can issue the HTTPS certificate.

---

## 5. Scheduled publishing (Railway cron)

Scheduled posts go live when a small job checks every 5 minutes.

1. In the Railway project, click **+ Create**, then **GitHub Repo**, and pick **roverblake/blog** again.
   This creates a second service; rename it "Scheduler" in its Settings.
2. In the Scheduler's **Settings**:
   - **Custom Start Command:** `node scripts/cron-publish.mjs`
   - **Cron Schedule:** `*/5 * * * *` (every 5 minutes)
   - **Custom Build Command:** `echo skip` (the scheduler doesn't need the whole site built)
3. In the Scheduler's **Variables**, add:
   ```
   SITE_URL=${{<website service name>.SITE_URL}}
   CRON_SECRET=${{<website service name>.CRON_SECRET}}
   ```
   (or paste the same values as the website service.)
4. Deploy. In the Scheduler's **Deployments** list, each run should log `200 {"published":0}`.

When a scheduled post's time comes, it is published and emailed to its lists, just like **Publish now**.
Times are entered and shown in Chicago time.

---

## 6. Database backups

**Please turn these on before you publish anything you'd hate to lose.**

1. In Railway, click the **Postgres** service, then the **Backups** tab.
2. Turn on a schedule: **Daily**, if offered.
3. If your plan doesn't show Backups, use Studio, then Settings, then **Export everything**
   once a week and keep the zip file somewhere safe (it contains every post as a Markdown file, all images, and your subscribers).

---

## 7. Environment variables

Every secret lives in an environment variable, never in the code. Locally they
go in `.env.local`; on Railway they go in the website service's **Variables** tab.
`.env.example` lists them all.

| Variable | What it is | Where to get it |
| --- | --- | --- |
| `SITE_URL` | The site's public address, e.g. `https://blakejohnson.com` (no slash at the end). Used in emails, RSS, sharing previews | Your domain |
| `DATABASE_URL` | How the site reaches the database | On Railway: `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | A long random password that protects sign-in cookies. Changing it signs everyone out | A password generator, 32+ characters |
| `BETTER_AUTH_URL` | Same as `SITE_URL` | Your domain |
| `ADMIN_EMAIL` | The **only** email address allowed into `/studio` | Your own email |
| `RESEND_API_KEY` | Lets the site send email. Without it, emails are printed in the server log instead | Resend, then API Keys |
| `EMAIL_FROM` | Who emails come from, e.g. `Blake Johnson <letters@blakejohnson.com>` | Must use your Resend-verified domain |
| `CRON_SECRET` | Password the Scheduler uses to trigger publishing | A password generator |
| `S3_ENDPOINT` | Image bucket address | Railway bucket, Credentials tab |
| `S3_REGION` | Image bucket region (`auto` is fine if none is shown) | Railway bucket, Credentials tab |
| `S3_BUCKET` | Image bucket name | Railway bucket, Credentials tab |
| `S3_ACCESS_KEY_ID` | Image bucket username | Railway bucket, Credentials tab |
| `S3_SECRET_ACCESS_KEY` | Image bucket password | Railway bucket, Credentials tab |
| `TEST_ADMIN_PASSWORD` | **Testing only.** A password (8+ characters) that lets you into the Studio from `/sign-in` without email. **Delete it before launch** | Make one up |
| `MEDIA_DIR` | Only if using a volume instead of a bucket: where to save images, e.g. `/data/media` | Your volume's mount path |

---

## 8. Using the Studio

Go to `/studio` (or click **Studio** in the black top strip when signed in).

- **Posts:** every post with its status (Draft, Scheduled, Published), type and date. Search and filter at the top.
  Choose a type and click **New post** to start one.
- **Writing:** type straight onto the page. It looks just like the public post.
  Select text for a small toolbar (bold, italic, link, quote, footnote), or type **/** for a menu of inserts.
  Drag or paste images straight in. Your work saves itself; watch for **Saved** at the top.
- **Paywall line:** for Subscribers-only posts, put the line where the free part should end.
  Everything after it is held back on the server for readers who aren't subscribed.
- **Check spelling & grammar:** runs only when you press it, entirely in your browser (no AI, nothing sent anywhere).
  Go through the issues with **Fix**, **Ignore**, or **Add to dictionary**.
- **Post settings** (right side): type, who can read, web address, kicker, summary, tags, header image
  (with caption, credit and a description for screen readers), and which email lists get it.
- **Preview** opens the exact public page. For Subscribers-only posts you can switch to what non-subscribers see.
- **Publish now**, **Schedule…** (Chicago time), **Unpublish**, **Delete**.
- **Subscribers:** counts per newsletter, add or remove people, CSV downloads.
- **Settings:** your mailing address (required in every email), the About page, your dictionary, and **Export everything**.

Who can sign in: only `ADMIN_EMAIL` (to the Studio) and confirmed subscribers (to read gated posts).
Anyone else who tries gets no email, and the page doesn't reveal who subscribes. Sign-in links work once, expire after
15 minutes, and are rate limited.

---

## 9. For developers: running it locally

You need Node.js 22+, pnpm, and PostgreSQL.

```bash
pnpm install
cp .env.example .env.local     # fill in DATABASE_URL, BETTER_AUTH_SECRET, ADMIN_EMAIL at least
pnpm db:migrate                # create the tables
pnpm db:seed                   # newsletter lists and default settings
pnpm db:seed:demo              # optional: sample posts (refuses to run on production)
pnpm dev                       # http://localhost:3000
```

Without `RESEND_API_KEY`, emails (sign-in links, confirmations, newsletters) are printed in the terminal.
Without `S3_BUCKET`, images are saved in `./.media`.

| Command | What it does |
| --- | --- |
| `pnpm db:generate` | After changing `src/db/schema.ts`, writes a new migration into `drizzle/` |
| `pnpm db:migrate` | Applies migrations (drizzle-kit, for development) |
| `pnpm db:migrate:deploy` | Applies migrations and required rows (what Railway runs before each deploy) |
| `pnpm db:studio` | A browser view of the database |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | Checks |

**Where things are**

- `src/app/` pages: public site, `studio/` (admin), `api/` (sign-in, cron, one-click unsubscribe)
- `src/components/site/` public layout pieces; `src/components/editor/` the Studio editor
- `src/lib/content/` the post format, server-side gating (`gate.ts`), text, and Markdown export
- `src/db/schema.ts` all tables, including the empty ones for Stages 2 to 4 (notes, sources, outlines, ideas, calendar, sermons)
- `src/emails/` sign-in, confirmation and newsletter emails

**Rules for anyone changing this code**

- Public styling comes from `docs/design-spec.md`. Don't invent styles; tokens live in `src/app/globals.css`.
- No AI writing, rewriting or generation features anywhere.
- No tracking pixels or third-party analytics.
- Gated text must never reach the browser: render posts only through `viewablePost()` / `gateDoc()`.
