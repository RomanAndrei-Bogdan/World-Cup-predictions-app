import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, hashPin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { name?: string; pin?: string; groupCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const pin = body.pin ?? "";
  const groupCode = (body.groupCode ?? "").trim();

  if (name.length < 2 || name.length > 20) {
    return NextResponse.json({ error: "Numele trebuie să aibă între 2 și 20 de caractere." }, { status: 400 });
  }
  if (pin.length < 4) {
    return NextResponse.json({ error: "Parola trebuie să aibă minim 4 caractere." }, { status: 400 });
  }
  const expectedCode = process.env.GROUP_CODE ?? "mondial2026";
  if (groupCode.toLowerCase() !== expectedCode.toLowerCase()) {
    return NextResponse.json({ error: "Codul grupului este greșit. Cere-l de la organizator." }, { status: 403 });
  }

  const c = await db();
  const count = await c.execute("SELECT COUNT(*) AS n FROM users");
  const isFirst = Number(count.rows[0].n) === 0; // primul înscris devine admin

  try {
    const rs = await c.execute({
      sql: "INSERT INTO users (name, pass_hash, is_admin) VALUES (?, ?, ?) RETURNING id",
      args: [name, hashPin(pin), isFirst ? 1 : 0],
    });
    const uid = Number(rs.rows[0].id);
    const res = NextResponse.json({ ok: true, name, isAdmin: isFirst });
    res.cookies.set(SESSION_COOKIE, createSessionToken(uid, name, isFirst), sessionCookieOptions);
    return res;
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return NextResponse.json({ error: "Există deja cineva cu numele ăsta. Alege altul." }, { status: 409 });
    }
    throw err;
  }
}
