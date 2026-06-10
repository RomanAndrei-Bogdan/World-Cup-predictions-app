# ⚽ Pronosticuri CM 2026

Aplicație web de pronosticuri la Cupa Mondială 2026, de jucat între prieteni.

## Cum funcționează

- Fiecare jucător își face cont cu nume + parolă + **codul grupului** (ca să nu intre străini).
- Dai pronosticuri (scor exact) la orice meci viitor; le poți modifica oricând **până la fluierul de start**, apoi se blochează.
- După start, vezi și pronosticurile celorlalți la meciul respectiv.
- Punctaj: **scor exact = 3 puncte**, **doar rezultatul corect (1/X/2) = 1 punct**. Punctajul se calculează pe scorul final înregistrat de API.
- Rezultatele vin automat de la [football-data.org](https://www.football-data.org) (se sincronizează singure, cel mult o dată la 5 minute, când cineva deschide pagina).
- **Primul cont creat devine admin**: vede butonul „Sincronizează" și poate corecta manual rezultate dacă API-ul are probleme (prin `POST /api/admin/result`).

## Rulare locală

```bash
npm install
npm run dev          # pornește pe http://localhost:3000
npm run seed:demo    # opțional: meciuri demo ca să testezi fără token API
```

Configurarea e în `.env.local` (vezi `.env.example` pentru toate variabilele).

## Pașii de lansare (o singură dată, ~20 de minute)

### 1. Token-ul de la football-data.org (gratuit)

1. Înregistrează-te pe <https://www.football-data.org/client/register>.
2. Primești token-ul pe email.
3. Pune-l în variabila `FOOTBALL_DATA_TOKEN`.

Planul gratuit include Cupa Mondială (10 cereri/minut — mai mult decât suficient; aplicația face cel mult una la 5 minute).

### 2. Baza de date — Turso (gratuit)

Pe Vercel nu poți folosi fișierul SQLite local, ai nevoie de o bază găzduită:

1. Cont pe <https://turso.tech> (planul gratuit ajunge cu vârf și îndesat).
2. Creează o bază (ex. `worldcup`).
3. Notează **URL-ul** (`libsql://worldcup-....turso.io`) → `DATABASE_URL`.
4. Generează un **token de acces** pentru bază → `DATABASE_AUTH_TOKEN`.

### 3. Găzduire — Vercel (gratuit)

1. Urcă proiectul pe GitHub (repo privat e ok):
   ```bash
   git add -A && git commit -m "Pronosticuri CM 2026"
   ```
   apoi creează repo-ul și fă push.
2. Cont pe <https://vercel.com> (intră cu GitHub) → **Add New Project** → importă repo-ul.
3. La **Environment Variables** setează:

   | Variabilă | Valoare |
   |---|---|
   | `SESSION_SECRET` | un șir aleatoriu lung (minim 16 caractere) |
   | `GROUP_CODE` | codul pe care îl dai prietenilor |
   | `FOOTBALL_DATA_TOKEN` | token-ul de la pasul 1 |
   | `DATABASE_URL` | URL-ul Turso de la pasul 2 |
   | `DATABASE_AUTH_TOKEN` | token-ul Turso de la pasul 2 |

4. **Deploy**. Primești un link de forma `https://world-cup-xxx.vercel.app`.

### 4. Pornirea jocului

1. Deschide linkul și **fă-ți tu primul cont** — primul cont devine admin.
2. Apasă **🔄 Sincronizează** — se încarcă toate meciurile turneului.
3. Trimite-le prietenilor linkul + codul grupului. Gata!

## Tehnologii

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind CSS)
- SQLite prin [@libsql/client](https://github.com/tursodatabase/libsql-client-ts) — fișier local în dezvoltare, [Turso](https://turso.tech) în producție
- Sesiuni proprii pe cookie semnat HMAC, parole cu scrypt — fără dependențe de autentificare externe

## Structura

```
src/
  lib/
    db.ts        # conexiunea la bază + schema (se creează singură la pornire)
    auth.ts      # hash parole (scrypt) + sesiuni (cookie semnat)
    scoring.ts   # regulile de punctaj (3p exact / 1p rezultat)
    sync.ts      # sincronizarea cu football-data.org
  app/
    page.tsx           # lista meciurilor + pronosticuri
    clasament/         # clasamentul
    auth/              # login / înscriere
    api/               # rutele API (auth, matches, predictions, leaderboard, sync, admin)
scripts/
  seed-demo.mjs  # meciuri false pentru testare locală
```
