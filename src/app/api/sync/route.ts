import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { syncMatches } from "@/lib/sync";

// Pornit manual de admin (butonul „Sincronizează”) sau de un cron extern
// cu antetul x-cron-secret (opțional, dacă CRON_SECRET e setat).
export async function POST(req: Request) {
  const session = await getSession();
  const cronSecret = process.env.CRON_SECRET;
  const viaCron = Boolean(cronSecret) && req.headers.get("x-cron-secret") === cronSecret;

  if (!viaCron && !session?.adm) {
    return NextResponse.json({ error: "Doar adminul poate sincroniza." }, { status: 403 });
  }

  try {
    const result = await syncMatches();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 502 });
  }
}
