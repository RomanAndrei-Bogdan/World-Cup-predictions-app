// Date demo ca să poți testa aplicația fără token de API.
// Rulează: npm run seed:demo
// La prima sincronizare reală, meciurile demo sunt șterse automat.
import { createClient } from "@libsql/client";

const db = createClient({ url: process.env.DATABASE_URL ?? "file:local.db" });

// aceeași schemă ca în src/lib/db.ts, ca să poată rula înainte de primul start
await db.execute(`CREATE TABLE IF NOT EXISTS matches (
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
)`);

const now = Date.now();
const h = 3600 * 1000;
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();

const crest = (code) => `https://crests.football-data.org/${code}.png`;

// Doar Argentina (762) are un ID real de stemă pe CDN-ul football-data.org;
// pentru restul lăsăm null ca să se vadă fallback-ul. La sincronizarea reală,
// API-ul trimite URL-ul corect pentru fiecare echipă.
const matches = [
  // terminate ieri
  ["demo-1", "GROUP_STAGE", "Group A", "Mexic", "Polonia", null, null, iso(-26 * h), "FINISHED", 2, 1],
  ["demo-2", "GROUP_STAGE", "Group A", "Canada", "Maroc", null, null, iso(-22 * h), "FINISHED", 1, 1],
  // live acum
  ["demo-3", "GROUP_STAGE", "Group B", "SUA", "Anglia", null, null, iso(-0.5 * h), "IN_PLAY", 0, 1],
  // azi mai târziu / mâine
  ["demo-4", "GROUP_STAGE", "Group B", "România", "Franța", null, null, iso(4 * h), "TIMED", null, null],
  ["demo-5", "GROUP_STAGE", "Group C", "Argentina", "Nigeria", 762, null, iso(22 * h), "TIMED", null, null],
  ["demo-6", "GROUP_STAGE", "Group C", "Brazilia", "Croația", null, null, iso(26 * h), "TIMED", null, null],
  ["demo-7", "GROUP_STAGE", "Group D", "Spania", "Japonia", null, null, iso(49 * h), "TIMED", null, null],
  ["demo-8", "GROUP_STAGE", "Group D", "Germania", "Portugalia", null, null, iso(53 * h), "TIMED", null, null],
];

for (const [id, stage, group, home, away, hc, ac, date, status, hs, as] of matches) {
  await db.execute({
    sql: `INSERT INTO matches (id, stage, group_name, home, away, home_crest, away_crest,
            utc_date, status, home_score, away_score, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            utc_date = excluded.utc_date, status = excluded.status,
            home_score = excluded.home_score, away_score = excluded.away_score`,
    args: [
      id, stage, group, home, away,
      hc ? crest(hc) : null, ac ? crest(ac) : null,
      date, status, hs, as, new Date().toISOString(),
    ],
  });
}

console.log(`Am inserat ${matches.length} meciuri demo în local.db.`);
console.log("Pornește aplicația cu: npm run dev");
