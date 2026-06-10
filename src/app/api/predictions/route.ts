import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  let body: { matchId?: string; home?: number; away?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const { matchId } = body;
  const home = Number(body.home);
  const away = Number(body.away);
  if (
    !matchId ||
    !Number.isInteger(home) ||
    !Number.isInteger(away) ||
    home < 0 ||
    away < 0 ||
    home > 20 ||
    away > 20
  ) {
    return NextResponse.json({ error: "Scor invalid (0–20)." }, { status: 400 });
  }

  const c = await db();
  const rs = await c.execute({ sql: "SELECT utc_date FROM matches WHERE id = ?", args: [matchId] });
  if (!rs.rows.length) {
    return NextResponse.json({ error: "Meciul nu există." }, { status: 404 });
  }
  if (new Date(String(rs.rows[0].utc_date)).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Meciul a început deja — pronosticul e blocat." }, { status: 403 });
  }

  await c.execute({
    sql: `INSERT INTO predictions (user_id, match_id, home, away, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id, match_id) DO UPDATE SET
            home = excluded.home, away = excluded.away, updated_at = excluded.updated_at`,
    args: [session.uid, matchId, home, away, new Date().toISOString()],
  });

  return NextResponse.json({ ok: true });
}
