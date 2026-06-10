"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Row = {
  name: string;
  points: number;
  exact: number;
  outcome: number;
  predictions: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [me, setMe] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/leaderboard");
      if (res.status === 401) {
        router.push("/auth");
        return;
      }
      const data = await res.json();
      setMe(data.me);
      setRows(data.leaderboard);
    })();
  }, [router]);

  if (!rows) {
    return <p className="mt-12 text-center text-foreground/50">Se încarcă...</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Clasament</h1>
      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/15">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10 text-left text-xs uppercase tracking-wide text-foreground/60">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Jucător</th>
              <th className="px-3 py-2.5 text-right">Puncte</th>
              <th className="px-3 py-2.5 text-right" title="Scoruri exacte (3p)">
                Exacte
              </th>
              <th className="px-3 py-2.5 text-right" title="Doar rezultatul (1p)">
                Rezultate
              </th>
              <th className="hidden px-3 py-2.5 text-right sm:table-cell">Pronosticuri</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.name}
                className={`border-t border-black/5 dark:border-white/10 ${
                  r.name === me ? "bg-emerald-500/10 font-semibold" : ""
                }`}
              >
                <td className="px-3 py-2.5">{MEDALS[i] ?? i + 1}</td>
                <td className="px-3 py-2.5">
                  {r.name}
                  {r.name === me && <span className="ml-1 text-xs text-emerald-600">(tu)</span>}
                </td>
                <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums">
                  {r.points}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.exact}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.outcome}</td>
                <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">
                  {r.predictions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="mt-8 text-center text-foreground/50">Nimeni înscris încă.</p>
      )}
    </div>
  );
}
