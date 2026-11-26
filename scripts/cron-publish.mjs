// Run by the Railway cron service every 5 minutes. Asks the website to publish
// any scheduled posts whose time has come (and send their newsletters).
const site = (process.env.SITE_URL || "").replace(/\/$/, "");
const secret = process.env.CRON_SECRET;
if (!site || !secret) {
  console.error("SITE_URL and CRON_SECRET must be set.");
  process.exit(1);
}
const res = await fetch(`${site}/api/cron/publish`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
console.log(res.status, await res.text());
process.exit(res.ok ? 0 : 1);
