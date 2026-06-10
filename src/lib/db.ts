import { createClient, type Client } from "@libsql/client";

// Local: fișier SQLite (local.db). Producție (Vercel): Turso, prin
// DATABASE_URL + DATABASE_AUTH_TOKEN.
let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL ?? "file:local.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return client;
}

async function createSchema(c: Client): Promise<void> {
  await c.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        pass_hash TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        stage TEXT,
        group_name TEXT,
        home TEXT NOT NULL,
        away TEXT NOT NULL,
        home_crest TEXT,
        away_crest TEXT,
        utc_date TEXT NOT NULL,
        status TEXT NOT NULL,
        home_score INTEGER,
        away_score INTEGER,
        updated_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS predictions (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        home INTEGER NOT NULL,
        away INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, match_id)
      )`,
      `CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      )`,
    ],
    "write"
  );
}

export async function db(): Promise<Client> {
  const c = getClient();
  if (!schemaReady) {
    schemaReady = createSchema(c).catch((err) => {
      schemaReady = null; // permite reîncercarea la următorul request
      throw err;
    });
  }
  await schemaReady;
  return c;
}

export async function getMeta(key: string): Promise<string | null> {
  const c = await db();
  const rs = await c.execute({ sql: "SELECT value FROM meta WHERE key = ?", args: [key] });
  return rs.rows.length ? String(rs.rows[0].value) : null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const c = await db();
  await c.execute({
    sql: "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [key, value],
  });
}
