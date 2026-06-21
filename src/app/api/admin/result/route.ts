import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { syncMatches } from "@/lib/sync";

// Plasă de siguranță: dacă API-ul greșește (ex. gol anulat de VAR pe care nu-l
// scade), adminul poate corecta manual rezultatul final al unui meci.
// Meciul corectat e „blocat" (locked=1), deci sincronizarea nu-l mai suprascrie.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.adm) {
    return NextResponse.json({ error: "Doar adminul poate seta rezultate." }, { status: 403 });
  }

  let body: { matchId?: string; home?: number; away?: number; unlock?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const { matchId } = body;
  if (!matchId) {
    return NextResponse.json({ error: "Lipsește meciul." }, { status: 400 });
  }

  const c = await db();

  // Deblocare: meciul revine sub controlul API-ului, iar la sincronizarea
  // imediat următoare își ia scorul real de la football-data.org.
  if (body.unlock) {
    const rs = await c.execute({
      sql: "UPDATE matches SET locked = 0 WHERE id = ?",
      args: [matchId],
    });
    if (rs.rowsAffected === 0) {
      return NextResponse.json({ error: "Meciul nu există." }, { status: 404 });
    }
    try {
      await syncMatches();
    } catch {
      // dacă API-ul e momentan indisponibil, scorul se va corecta la următorul sync
    }
    return NextResponse.json({ ok: true, unlocked: true });
  }

  const home = Number(body.home);
  const away = Number(body.away);
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
    return NextResponse.json({ error: "Scor invalid." }, { status: 400 });
  }

  const rs = await c.execute({
    sql: `UPDATE matches
          SET status = 'FINISHED', home_score = ?, away_score = ?, locked = 1, updated_at = ?
          WHERE id = ?`,
    args: [home, away, new Date().toISOString(), matchId],
  });
  if (rs.rowsAffected === 0) {
    return NextResponse.json({ error: "Meciul nu există." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, locked: true });
}
