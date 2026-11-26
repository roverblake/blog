/** Inserts the starting rows the site needs. Safe to run more than once. */
import { db, schema } from "./index";

async function main() {
  await db
    .insert(schema.lists)
    .values([
      { slug: "essays", name: "Essays", position: 0 },
      { slug: "parish", name: "Letters to the Parish", position: 1 },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.settings)
    .values([
      { key: "mailingAddress", value: "" },
      { key: "tagline", value: "" },
      { key: "about", value: { type: "doc", content: [] } },
    ])
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
