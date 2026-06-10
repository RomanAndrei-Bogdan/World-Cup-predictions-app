import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, verifyPin } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { name?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const pin = body.pin ?? "";

  const c = await db();
  const rs = await c.execute({
    sql: "SELECT id, name, pass_hash, is_admin FROM users WHERE name = ?",
    args: [name],
  });
  const user = rs.rows[0];
  if (!user || !verifyPin(pin, String(user.pass_hash))) {
    return NextResponse.json({ error: "Nume sau parolă greșite." }, { status: 401 });
  }

  const isAdmin = Number(user.is_admin) === 1;
  const res = NextResponse.json({ ok: true, name: String(user.name), isAdmin });
  res.cookies.set(SESSION_COOKIE, createSessionToken(Number(user.id), String(user.name), isAdmin), sessionCookieOptions);
  return res;
}
