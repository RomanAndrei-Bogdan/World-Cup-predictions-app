import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { points, POINTS_EXACT, POINTS_OUTCOME } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  const c = await db();
  const [usersRs, finishedRs, predsRs] = await Promise.all([
    c.execute("SELECT id, name FROM users"),
    c.execute(
      "SELECT id, home_score, away_score FROM matches WHERE status = 'FINISHED' AND home_score IS NOT NULL AND away_score IS NOT NULL"
    ),
    c.execute("SELECT user_id, match_id, home, away FROM predictions"),
  ]);

  const results = new Map<string, { home: number; away: number }>();
  for (const m of finishedRs.rows) {
    results.set(String(m.id), { home: Number(m.home_score), away: Number(m.away_score) });
  }

  const rows = new Map<
    number,
    { name: string; points: number; exact: number; outcome: number; predictions: number }
  >();
  for (const u of usersRs.rows) {
    rows.set(Number(u.id), {
      name: String(u.name),
      points: 0,
      exact: 0,
      outcome: 0,
      predictions: 0,
    });
  }

  for (const p of predsRs.rows) {
    const row = rows.get(Number(p.user_id));
    if (!row) continue;
    row.predictions++;
    const result = results.get(String(p.match_id));
    if (!result) continue;
    const pts = points(Number(p.home), Number(p.away), result.home, result.away);
    row.points += pts;
    if (pts === POINTS_EXACT) row.exact++;
    else if (pts === POINTS_OUTCOME) row.outcome++;
  }

  const leaderboard = [...rows.values()].sort(
    (a, b) => b.points - a.points || b.exact - a.exact || a.name.localeCompare(b.name, "ro")
  );

  return NextResponse.json({ me: session.name, leaderboard });
}
