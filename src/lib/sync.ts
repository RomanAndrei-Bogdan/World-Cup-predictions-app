import { db, getMeta, setMeta } from "@/lib/db";

// Sincronizare cu football-data.org (competiția WC = Cupa Mondială).
// Planul gratuit ajunge: tot turneul vine într-un singur request.
const API_URL = "https://api.football-data.org/v4/competitions/WC/matches";
const SYNC_THROTTLE_MS = 5 * 60 * 1000;

type ApiMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string | null;
  group: string | null;
  homeTeam: { name: string | null; shortName: string | null; crest: string | null };
  awayTeam: { name: string | null; shortName: string | null; crest: string | null };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
  };
};

function teamName(t: ApiMatch["homeTeam"]): string {
  return t.shortName ?? t.name ?? "Necunoscută";
}

export async function syncMatches(): Promise<{ synced: number }> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    throw new Error(
      "FOOTBALL_DATA_TOKEN nu este setat. Creează un cont gratuit pe football-data.org și pune token-ul în .env.local."
    );
  }

  const res = await fetch(API_URL, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data.org a răspuns cu ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { matches: ApiMatch[] };
  const matches = data.matches ?? [];
  if (matches.length === 0) return { synced: 0 };

  const c = await db();
  const now = new Date().toISOString();

  const statements = matches.map((m) => ({
    sql: `INSERT INTO matches (id, stage, group_name, home, away, home_crest, away_crest,
            utc_date, status, home_score, away_score, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            stage = excluded.stage,
            group_name = excluded.group_name,
            home = excluded.home,
            away = excluded.away,
            home_crest = excluded.home_crest,
            away_crest = excluded.away_crest,
            utc_date = excluded.utc_date,
            -- meciurile corectate manual de admin (locked=1) își păstrează
            -- statusul și scorul; restul se actualizează de la API
            status = CASE WHEN matches.locked = 1 THEN matches.status ELSE excluded.status END,
            home_score = CASE WHEN matches.locked = 1 THEN matches.home_score ELSE excluded.home_score END,
            away_score = CASE WHEN matches.locked = 1 THEN matches.away_score ELSE excluded.away_score END,
            updated_at = excluded.updated_at`,
    args: [
      String(m.id),
      m.stage,
      m.group,
      teamName(m.homeTeam),
      teamName(m.awayTeam),
      m.homeTeam.crest,
      m.awayTeam.crest,
      m.utcDate,
      m.status,
      m.score.fullTime.home,
      m.score.fullTime.away,
      now,
    ],
  }));

  // Curăță meciurile care nu mai există la API (de ex. datele demo).
  const ids = matches.map((m) => String(m.id));
  statements.push({
    sql: `DELETE FROM matches WHERE id NOT IN (${ids.map(() => "?").join(",")})`,
    args: ids,
  });

  await c.batch(statements, "write");
  await setMeta("last_sync", now);
  return { synced: matches.length };
}

// Sincronizare „leneșă”: apelată la fiecare citire de meciuri, dar rulează
// efectiv doar dacă au trecut 5 minute de la ultima — așa nu avem nevoie de
// cron-uri și rămânem lejer sub limita de 10 requesturi/minut.
export async function maybeLazySync(): Promise<void> {
  if (!process.env.FOOTBALL_DATA_TOKEN) return;
  const last = await getMeta("last_sync");
  if (last && Date.now() - new Date(last).getTime() < SYNC_THROTTLE_MS) return;
  try {
    await syncMatches();
  } catch (err) {
    // Nu blocăm afișarea meciurilor dacă API-ul e momentan indisponibil.
    console.error("Sincronizare eșuată:", err);
  }
}
