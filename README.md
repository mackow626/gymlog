# GymLog 💪

Dziennik treningów siłowych — React + Hono + Cloudflare D1.

## Struktura

```
gymlog/
├── frontend/        # React + Vite + TypeScript
├── worker/          # Hono backend (Cloudflare Workers)
├── migrations/      # SQL schema
└── .github/workflows/deploy.yml
```

---

## Deploy krok po kroku

### 1. Zainstaluj Wrangler globalnie

```bash
npm install -g wrangler
wrangler login
```

### 2. Sklonuj repo i zainstaluj zależności

```bash
git clone https://github.com/TWOJ_USER/gymlog
cd gymlog
npm run install:all
```

### 3. Utwórz bazę D1

```bash
cd worker
wrangler d1 create gymlog
```

Skopiuj `database_id` z outputu i wklej do `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "gymlog"
database_id = "WKLEJ_TUTAJ_ID"
```

### 4. Uruchom migrację bazy

```bash
# lokalna baza (dev)
wrangler d1 execute gymlog --local --file=../migrations/0001_init.sql

# produkcyjna baza (Cloudflare)
wrangler d1 execute gymlog --file=../migrations/0001_init.sql
```

### 5. Uruchom lokalnie (opcjonalnie, do testów)

Terminal 1 — backend:
```bash
cd worker && npm run dev
# działa na http://localhost:8787
```

Terminal 2 — frontend:
```bash
cd frontend && npm run dev
# działa na http://localhost:5173
# proxy /api → localhost:8787 (skonfigurowane w vite.config.ts)
```

### 6. Deploy backendu (Worker)

```bash
cd worker
wrangler deploy
# dostaniesz URL: https://gymlog-worker.TWOJ_SUBDOMAIN.workers.dev
```

### 7. Deploy frontendu (Pages)

```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=gymlog
```

### 8. Podepnij własną domenę

W panelu Cloudflare:
- **Worker**: Workers & Pages → gymlog-worker → Triggers → Custom Domains → dodaj `api.twoja-domena.pl`
- **Pages**: Workers & Pages → gymlog → Custom Domains → dodaj `twoja-domena.pl`

Ustaw zmienną środowiskową w Pages (Settings → Environment Variables):
```
VITE_API_URL = https://api.twoja-domena.pl
```

---

## CI/CD (automatyczny deploy z GitHub)

Dodaj secrets w GitHub repo (Settings → Secrets → Actions):

| Secret | Jak zdobyć |
|--------|-----------|
| `CLOUDFLARE_API_TOKEN` | cloudflare.com → My Profile → API Tokens → Create Token (Workers template) |
| `CLOUDFLARE_ACCOUNT_ID` | cloudflare.com → prawy panel główny |
| `VITE_API_URL` | URL twojego workera, np. `https://api.twoja-domena.pl` |

Od teraz każdy `git push main` → automatyczny deploy.

---

## Hasło

Domyślne hasło: `mackow626`

Żeby zmienić — edytuj stałą `PASSWORD` w `frontend/src/App.tsx`.
