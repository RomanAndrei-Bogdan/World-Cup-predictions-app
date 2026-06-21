import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { maybeLazySync } from "@/lib/sync";
import { points } from "@/lib/scoring";

export const dynamic = "force-dynamic";

type PredictionRow = { user_id: number; match_id: string; name: string; home: number; away: number };

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  await maybeLazySync();

  const c = await db();
  const [matchesRs, predsRs] = await Promise.all([
    c.execute("SELECT * FROM matches ORDER BY utc_date ASC, id ASC"),
    c.execute(
      `SELECT p.user_id, p.match_id, u.name, p.home, p.away
       FROM predictions p JOIN users u ON u.id = p.user_id`
    ),
  ]);

  const predsByMatch = new Map<string, PredictionRow[]>();
  for (const row of predsRs.rows) {
    const p: PredictionRow = {
      user_id: Number(row.user_id),
      match_id: String(row.match_id),
      name: String(row.name),
      home: Number(row.home),
      away: Number(row.away),
    };
    const list = predsByMatch.get(p.match_id) ?? [];
    list.push(p);
    predsByMatch.set(p.match_id, list);
  }

  const now = Date.now();
  const matches = matchesRs.rows.map((m) => {
    const id = String(m.id);
    const locked = new Date(String(m.utc_date)).getTime() <= now;
    const finished = String(m.status) === "FINISHED" && m.home_score !== null && m.away_score !== null;
    const all = predsByMatch.get(id) ?? [];
    const mine = all.find((p) => p.user_id === session.uid) ?? null;

    return {
      id,
      stage: m.stage,
      group: m.group_name,
      home: String(m.home),
      away: String(m.away),
      homeCrest: m.home_crest,
      awayCrest: m.away_crest,
      utcDate: String(m.utc_date),
      status: String(m.status),
      homeScore: m.home_score === null ? null : Number(m.home_score),
      awayScore: m.away_score === null ? null : Number(m.away_score),
      locked,
      // rezultat corectat manual de admin (sincronizarea nu-l mai suprascrie)
      resultLocked: Number(m.locked) === 1,
      myPrediction: mine ? { home: mine.home, away: mine.away } : null,
      myPoints:
        finished && mine
          ? points(mine.home, mine.away, Number(m.home_score), Number(m.away_score))
          : null,
      // Pronosticurile celorlalți devin vizibile abia după începerea meciului.
      others: locked
        ? all
            .filter((p) => p.user_id !== session.uid)
            .map((p) => ({
              name: p.name,
              home: p.home,
              away: p.away,
              points: finished
                ? points(p.home, p.away, Number(m.home_score), Number(m.away_score))
                : null,
            }))
        : [],
    };
  });

  return NextResponse.json({
    me: { name: session.name, isAdmin: session.adm },
    hasApiToken: Boolean(process.env.FOOTBALL_DATA_TOKEN),
    matches,
  });
}
