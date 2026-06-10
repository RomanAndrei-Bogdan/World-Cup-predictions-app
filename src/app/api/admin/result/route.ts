import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Plasă de siguranță: dacă API-ul de fotbal cade, adminul poate introduce
// manual rezultatul final al unui meci.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.adm) {
    return NextResponse.json({ error: "Doar adminul poate seta rezultate." }, { status: 403 });
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
  if (!matchId || !Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return NextResponse.json({ error: "Scor invalid." }, { status: 400 });
  }

  const c = await db();
  const rs = await c.execute({
    sql: `UPDATE matches SET status = 'FINISHED', home_score = ?, away_score = ?, updated_at = ?
          WHERE id = ?`,
    args: [home, away, new Date().toISOString(), matchId],
  });
  if (rs.rowsAffected === 0) {
    return NextResponse.json({ error: "Meciul nu există." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
