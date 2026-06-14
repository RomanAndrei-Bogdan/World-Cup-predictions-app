// Utilitar: listează meciurile dintr-un interval (pentru analiză pronosticuri)
// node scripts/list-fixtures.mjs 2026-06-11 2026-06-15
import { createClient } from "@libsql/client";

const [from = "2026-06-11", to = "2026-06-15"] = process.argv.slice(2);
const db = createClient({ url: process.env.DATABASE_URL ?? "file:local.db" });
const rs = await db.execute({
  sql: "SELECT utc_date, group_name, home, away FROM matches WHERE utc_date >= ? AND utc_date < ? ORDER BY utc_date",
  args: [from, to],
});
for (const r of rs.rows) {
  console.log(`${r.utc_date}  [${r.group_name ?? "-"}]  ${r.home} vs ${r.away}`);
}
