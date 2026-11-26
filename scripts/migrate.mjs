// Runs before each deploy on Railway (see railway.json): applies any new
// database migrations, then makes sure the two newsletter lists exist.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });
await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
await sql`insert into lists (slug, name, position) values ('essays', 'Essays', 0), ('parish', 'Letters to the Parish', 1) on conflict do nothing`;
await sql`insert into settings (key, value) values ('mailingAddress', '""'::jsonb) on conflict do nothing`;
console.log("Database is up to date.");
await sql.end();
