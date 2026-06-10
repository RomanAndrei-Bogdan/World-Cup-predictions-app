"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { name, pin, groupCode } : { name, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ceva n-a mers. Mai încearcă.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 outline-none focus:border-emerald-500";

  return (
    <div className="mx-auto mt-8 max-w-sm">
      <div className="mb-6 grid grid-cols-2 rounded-lg border border-black/15 dark:border-white/20 p-1 text-center text-sm font-medium">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-md py-2 transition ${
              mode === m ? "bg-emerald-600 text-white" : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {m === "login" ? "Intră în cont" : "Înscrie-te"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Numele tău</span>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Bogdan"
            autoComplete="username"
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Parolă</span>
          <input
            className={inputCls}
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="minim 4 caractere"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </label>
        {mode === "register" && (
          <label className="text-sm">
            <span className="mb-1 block font-medium">Codul grupului</span>
            <input
              className={inputCls}
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              placeholder="îl primești de la organizator"
              required
            />
          </label>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "..." : mode === "login" ? "Intră" : "Creează contul"}
        </button>
      </form>
    </div>
  );
}
