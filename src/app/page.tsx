"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Other = { name: string; home: number; away: number; points: number | null };

type Match = {
  id: string;
  stage: string | null;
  group: string | null;
  home: string;
  away: string;
  homeCrest: string | null;
  awayCrest: string | null;
  utcDate: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  locked: boolean;
  myPrediction: { home: number; away: number } | null;
  myPoints: number | null;
  others: Other[];
};

type Payload = {
  me: { name: string; isAdmin: boolean };
  hasApiToken: boolean;
  matches: Match[];
};

const STAGE_LABELS: Record<string, string> = {
  LAST_32: "Șaisprezecimi",
  ROUND_OF_32: "Șaisprezecimi",
  LAST_16: "Optimi",
  ROUND_OF_16: "Optimi",
  QUARTER_FINALS: "Sferturi",
  SEMI_FINALS: "Semifinale",
  THIRD_PLACE: "Finala mică",
  FINAL: "Finala",
};

function stageLabel(m: Match): string {
  // API-ul trimite grupa ca "GROUP_A"
  if (m.group) return m.group.replace(/^GROUP_/i, "Grupa ").replace("Group ", "Grupa ");
  if (m.stage && STAGE_LABELS[m.stage]) return STAGE_LABELS[m.stage];
  return m.stage ?? "";
}

// Numele echipelor vin în engleză de la API; le afișăm românește.
// Ce nu e în listă rămâne cum vine de la API.
const TEAM_NAMES_RO: Record<string, string> = {
  Mexico: "Mexic",
  "South Africa": "Africa de Sud",
  "Korea Republic": "Coreea de Sud",
  Czechia: "Cehia",
  "Bosnia-H.": "Bosnia",
  England: "Anglia",
  France: "Franța",
  Germany: "Germania",
  Spain: "Spania",
  Portugal: "Portugalia",
  Netherlands: "Olanda",
  Belgium: "Belgia",
  Switzerland: "Elveția",
  Austria: "Austria",
  Croatia: "Croația",
  Scotland: "Scoția",
  Norway: "Norvegia",
  Italy: "Italia",
  Poland: "Polonia",
  Romania: "România",
  Türkiye: "Turcia",
  Turkey: "Turcia",
  Brazil: "Brazilia",
  Argentina: "Argentina",
  Uruguay: "Uruguay",
  Colombia: "Columbia",
  Ecuador: "Ecuador",
  Paraguay: "Paraguay",
  Peru: "Peru",
  Chile: "Chile",
  USA: "SUA",
  Canada: "Canada",
  Panama: "Panama",
  "Costa Rica": "Costa Rica",
  Jamaica: "Jamaica",
  Haiti: "Haiti",
  Curaçao: "Curaçao",
  Japan: "Japonia",
  "Saudi Arabia": "Arabia Saudită",
  Iran: "Iran",
  Qatar: "Qatar",
  Jordan: "Iordania",
  Uzbekistan: "Uzbekistan",
  Australia: "Australia",
  "New Zealand": "Noua Zeelandă",
  Morocco: "Maroc",
  Senegal: "Senegal",
  Ghana: "Ghana",
  Algeria: "Algeria",
  Tunisia: "Tunisia",
  Egypt: "Egipt",
  "Cape Verde": "Capul Verde",
  "Côte d'Ivoire": "Coasta de Fildeș",
  "Ivory Coast": "Coasta de Fildeș",
};

function teamRo(name: string): string {
  return TEAM_NAMES_RO[name] ?? name;
}

function Crest({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    // fallback vizibil când echipa nu are stemă (sau imaginea nu se încarcă)
    return (
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/10 dark:bg-white/15 text-[10px] font-bold text-foreground/60"
      >
        {alt.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className="h-6 w-6 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function PredictionEditor({ match, onSaved }: { match: Match; onSaved: () => void }) {
  const [home, setHome] = useState(match.myPrediction?.home?.toString() ?? "");
  const [away, setAway] = useState(match.myPrediction?.away?.toString() ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const dirty =
    home !== (match.myPrediction?.home?.toString() ?? "") ||
    away !== (match.myPrediction?.away?.toString() ?? "");

  async function save() {
    setState("saving");
    setError("");
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, home: Number(home), away: Number(away) }),
    });
    if (res.ok) {
      setState("saved");
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Eroare la salvare.");
      setState("error");
    }
  }

  const inputCls =
    "w-12 rounded-md border border-black/15 dark:border-white/20 bg-transparent py-1.5 text-center font-semibold outline-none focus:border-emerald-500";

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <span className="text-xs text-foreground/60">Pronosticul tău:</span>
      <input
        className={inputCls}
        inputMode="numeric"
        value={home}
        onChange={(e) => setHome(e.target.value.replace(/\D/g, "").slice(0, 2))}
        placeholder="-"
        aria-label={`Goluri ${teamRo(match.home)}`}
      />
      <span className="text-foreground/40">:</span>
      <input
        className={inputCls}
        inputMode="numeric"
        value={away}
        onChange={(e) => setAway(e.target.value.replace(/\D/g, "").slice(0, 2))}
        placeholder="-"
        aria-label={`Goluri ${teamRo(match.away)}`}
      />
      <button
        onClick={save}
        disabled={home === "" || away === "" || state === "saving" || (!dirty && state !== "error")}
        className={`ml-1 rounded-md px-3 py-1.5 text-sm font-semibold text-white transition disabled:opacity-40 ${
          state === "saved" && !dirty ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-500"
        }`}
      >
        {state === "saving" ? "..." : state === "saved" && !dirty ? "✓ Salvat" : "Salvează"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function PointsBadge({ points }: { points: number }) {
  const cls =
    points === 3
      ? "bg-emerald-600 text-white"
      : points === 1
        ? "bg-amber-500 text-white"
        : "bg-black/10 dark:bg-white/15 text-foreground/70";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>
      {points === 3 ? "+3 exact!" : points === 1 ? "+1 rezultat" : "0 puncte"}
    </span>
  );
}

function MatchCard({ match, onSaved }: { match: Match; onSaved: () => void }) {
  const kickoff = new Date(match.utcDate);
  const time = kickoff.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
  const live = match.status === "IN_PLAY" || match.status === "PAUSED";
  const finished = match.status === "FINISHED";
  const home = teamRo(match.home);
  const away = teamRo(match.away);

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.04] p-4">
      <div className="flex items-center justify-between text-xs text-foreground/60">
        <span>{stageLabel(match)}</span>
        <span>
          {live ? (
            <span className="font-bold text-red-500 animate-pulse">● LIVE</span>
          ) : finished ? (
            "Final"
          ) : (
            `ora ${time}`
          )}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center justify-end gap-2 text-right font-medium">
          <span>{home}</span>
          <Crest src={match.homeCrest} alt={home} />
        </div>
        <div className="min-w-14 text-center text-xl font-bold tabular-nums">
          {match.homeScore !== null && match.awayScore !== null
            ? `${match.homeScore} - ${match.awayScore}`
            : "vs"}
        </div>
        <div className="flex items-center gap-2 font-medium">
          <Crest src={match.awayCrest} alt={away} />
          <span>{away}</span>
        </div>
      </div>

      {!match.locked && <PredictionEditor key={match.id} match={match} onSaved={onSaved} />}

      {match.locked && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
          {match.myPrediction ? (
            <span className="flex items-center gap-2 rounded-full border border-emerald-600/40 px-3 py-1">
              <span className="text-xs text-foreground/60">Tu:</span>
              <b>
                {match.myPrediction.home}-{match.myPrediction.away}
              </b>
              {match.myPoints !== null && <PointsBadge points={match.myPoints} />}
            </span>
          ) : (
            <span className="rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-xs text-foreground/50">
              N-ai dat pronostic
            </span>
          )}
          {match.others.map((o) => (
            <span
              key={o.name}
              className="flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/15 px-3 py-1 text-xs"
            >
              {o.name}:{" "}
              <b>
                {o.home}-{o.away}
              </b>
              {o.points !== null && <PointsBadge points={o.points} />}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MatchesPage() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [showPlayed, setShowPlayed] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/matches");
    if (res.status === 401) {
      router.push("/auth");
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function syncNow() {
    setSyncing(true);
    setSyncMsg("");
    const res = await fetch("/api/sync", { method: "POST" });
    const result = await res.json().catch(() => ({}));
    setSyncMsg(res.ok ? `Sincronizat: ${result.synced} meciuri.` : (result.error ?? "Eroare."));
    setSyncing(false);
    load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
  }

  if (loading || !data) {
    return <p className="mt-12 text-center text-foreground/50">Se încarcă...</p>;
  }

  // meciurile terminate se ascund implicit, ca lista să rămână pe ce urmează
  const playedCount = data.matches.filter((m) => m.status === "FINISHED").length;
  const visible = showPlayed ? data.matches : data.matches.filter((m) => m.status !== "FINISHED");

  // grupează meciurile pe zile (în fusul orar local al utilizatorului)
  const byDay = new Map<string, Match[]>();
  for (const m of visible) {
    const day = new Date(m.utcDate).toLocaleDateString("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const list = byDay.get(day);
    if (list) list.push(m);
    else byDay.set(day, [m]);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground/70">
          Salut, <b>{data.me.name}</b>
          {data.me.isAdmin && " (admin)"}
        </p>
        <div className="flex items-center gap-2">
          {data.me.isAdmin && (
            <button
              onClick={syncNow}
              disabled={syncing}
              className="rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
            >
              {syncing ? "Se sincronizează..." : "🔄 Sincronizează"}
            </button>
          )}
          <button
            onClick={logout}
            className="rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
          >
            Ieși
          </button>
        </div>
      </div>

      {syncMsg && <p className="mb-4 text-xs text-foreground/60">{syncMsg}</p>}

      {playedCount > 0 && (
        <button
          onClick={() => setShowPlayed((v) => !v)}
          className="mb-4 rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
        >
          {showPlayed
            ? `Ascunde meciurile jucate (${playedCount})`
            : `Arată meciurile jucate (${playedCount})`}
        </button>
      )}

      {data.me.isAdmin && !data.hasApiToken && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          ⚠️ <b>FOOTBALL_DATA_TOKEN</b> nu e setat — meciurile nu se pot sincroniza automat. Vezi
          README pentru cum obții gratuit un token de la football-data.org.
        </div>
      )}

      {data.matches.length === 0 && (
        <p className="mt-12 text-center text-foreground/50">
          Niciun meci încă.{" "}
          {data.me.isAdmin ? "Apasă „Sincronizează” după ce setezi token-ul." : "Revino mai târziu."}
        </p>
      )}

      {[...byDay.entries()].map(([day, matches]) => (
        <section key={day} className="mb-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground/60">
            {day}
          </h2>
          <div className="flex flex-col gap-3">
            {matches.map((m) => (
              <MatchCard key={m.id} match={m} onSaved={load} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
