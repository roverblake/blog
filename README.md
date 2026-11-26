# Blake Johnson

A quiet, literary journal: essays, commonplace notes, letters to the parish,
and (later) sermons. Public site plus a private editor at `/studio`.

- What's planned: [`docs/roadmap.md`](docs/roadmap.md)
- How it must look: [`docs/design-spec.md`](docs/design-spec.md) (the source of truth for all public styling)

**Tech:** Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL with
Drizzle ORM, Better Auth (email sign-in links), Resend (email), TipTap (editor),
Harper (spelling and grammar, in the browser). Hosted on Railway.

> This README grows as each step is built. Sections marked *(coming)* are
> filled in during the go-live step.

---

## Run it on your own computer (for developers)

You need Node.js 22+, pnpm, and a PostgreSQL database.

```bash
pnpm install
cp .env.example .env.local     # then fill in the values (see below)
pnpm db:migrate                # create the tables
pnpm db:seed                   # add the two newsletter lists and default settings
pnpm dev                       # open http://localhost:3000
```

Without `RESEND_API_KEY`, emails (including sign-in links) are printed in the
terminal instead of sent, so you can still sign in locally.

### Database commands

| Command | What it does |
| --- | --- |
| `pnpm db:generate` | After changing `src/db/schema.ts`, writes a new migration file into `drizzle/` |
| `pnpm db:migrate` | Applies any migrations the database hasn't had yet |
| `pnpm db:seed` | Inserts starting rows (safe to run again) |
| `pnpm db:studio` | Opens a browser view of the database |

---

## Environment variables

Every secret lives in an environment variable. Locally they go in
`.env.local`; on Railway they go in the web service's **Variables** tab.
`.env.example` lists them all.

| Variable | What it is | Where to get it |
| --- | --- | --- |
| `SITE_URL` | The site's public address, e.g. `https://blakejohnson.com` (no slash at the end) | Your domain |
| `DATABASE_URL` | How the site reaches the database | Railway fills it in: set it to `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | A long random password that protects sign-in cookies | Any password generator, 32+ characters. Never share it |
| `BETTER_AUTH_URL` | Same as `SITE_URL` | Your domain |
| `ADMIN_EMAIL` | The one email address allowed into `/studio` | Your own email |
| `RESEND_API_KEY` | Lets the site send email | resend.com, then **API Keys**, then **Create API key** |
| `EMAIL_FROM` | Who emails come from, e.g. `Blake Johnson <letters@yourdomain.com>` | Must use your Resend-verified domain |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Image storage | Railway bucket, **Credentials** tab |
| `CRON_SECRET` | A long random password the scheduled-publishing job uses | Any password generator |

---

## Who can sign in

- **Admin:** only the address in `ADMIN_EMAIL`. Changing that variable changes
  who the admin is; nothing else grants admin access.
- **Subscribers:** anyone who has subscribed and clicked the confirmation link.
- Anyone else who types their email into the sign-in form gets no email (the
  page still says "a link is on its way", so the form can't be used to find out
  who subscribes).
- Sign-in links work once and expire after 15 minutes. Sign-in requests are
  rate limited (5 per 10 minutes per visitor).

---

## Deploy to Railway *(coming)*

## Connect your Namecheap domain *(coming)*

## Set up Resend and verify your domain *(coming)*

## Turn on database backups *(coming)*
