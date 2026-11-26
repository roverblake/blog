# Launch checklist

Work down the list. Every item has a plain test. The README has step-by-step help for each.

## Accounts and settings

- [ ] Railway: project created on the **Hobby** plan, with website, Postgres, and a bucket (or volume)
- [ ] Image storage: a volume is attached to the website service at mount path `/data`, and the variable `MEDIA_DIR` is `/data/media`. Test: the red storage notice at the top of Studio is gone, and an image you upload is still there after the next redeploy
- [ ] All variables entered in the website service (README §1d and §7). Double-check `ADMIN_EMAIL` is your address
- [ ] `BETTER_AUTH_SECRET` and `CRON_SECRET` are long random passwords, saved in your password manager
- [ ] Resend: domain shows **Verified**; `RESEND_API_KEY` and `EMAIL_FROM` set (README §2)
- [ ] Studio, then Settings: **mailing address** filled in (required in every email)
- [ ] Studio, then Settings: **About** page written and saved

## Domain

- [ ] Railway shows a green tick for both `yourdomain.com` and `www.yourdomain.com` (README §3)
- [ ] `https://yourdomain.com` loads with a padlock; `https://www.yourdomain.com` loads too
- [ ] `SITE_URL` and `BETTER_AUTH_URL` changed to `https://yourdomain.com`, and the site redeployed

## Safety

- [ ] **`TEST_ADMIN_PASSWORD` deleted** from Railway's Variables (the yellow "Test sign-in is on" bar in the Studio disappears)
- [ ] **Database backups turned on** in Railway, Postgres, Backups (README §6)
- [ ] Studio, then Settings, then **Export everything** downloads a zip that opens
- [ ] Scheduler service runs every 5 minutes and logs `200` (README §5)

## Try it as a reader (use a second email address, or a phone)

- [ ] Homepage looks right on a computer and on a phone (masthead, lead story, drop cap, The Latest, newsletter box, quotes, footer)
- [ ] Subscribe from the homepage box, then a **confirmation email** arrives, then clicking it says "You're subscribed"
- [ ] Sign in with that address, then open a Subscribers-only post, and the whole post shows
- [ ] Sign out, then the same post stops at the paywall line, fades, and shows "Subscribe to keep reading"
- [ ] The unsubscribe link at the bottom of an email says "You're unsubscribed"

## Try it as the writer

- [ ] Sign in at `/sign-in` with `ADMIN_EMAIL`; the black strip shows **Studio**
- [ ] Write a test post with a heading, a block quote with a source, a pull quote, an image with a caption, a footnote and a paywall line
- [ ] **Check spelling & grammar** finds a deliberate typo; **Fix** works; **Add to dictionary** remembers a word
- [ ] **Preview** matches the public look; for a Subscribers-only post, "Show as non-subscriber" stops at the paywall line
- [ ] **Schedule** the test post 10 minutes ahead; it goes live by itself and the email arrives
- [ ] The newsletter email looks right (serif, black and white, navy button, your address and unsubscribe links at the bottom)
- [ ] Unpublish and delete the test post; remove the test subscriber in Studio, then Subscribers

## Search engines and sharing

- [ ] `https://yourdomain.com/sitemap.xml` and `/rss.xml` open
- [ ] Paste a post link into a message to yourself: the preview shows the title and header image
- [ ] Optional: add the site in [Google Search Console](https://search.google.com/search-console) and submit the sitemap

## Go

- [ ] Publish your first essay
