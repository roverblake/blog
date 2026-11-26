import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Connections open lazily on the first query, so the site can be built
// without a database; a missing DATABASE_URL shows up as a query error.
const connectionString = process.env.DATABASE_URL ?? "postgres://missing-database-url@localhost:1/none";

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client = globalForDb.pg ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
