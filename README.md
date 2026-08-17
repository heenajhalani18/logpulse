# LogPulse

Real-time log analytics dashboard built with Elasticsearch, Node.js, TypeScript, and React.

**Live demo:** https://logpulse-nine.vercel.app
**API:** https://logpulse-api-8ch9.onrender.com
**Login:** `admin` / (password shared on request — this is a single-operator internal tool, see Design decisions below)

> Note: the backend runs on Render's free tier and spins down after inactivity. The first request after idle time may take 30–50 seconds to wake up.

## What it does

LogPulse simulates the kind of internal tool a DevOps or on-call engineer would use to monitor multiple services in real time: searching logs, spotting error spikes, and getting alerted before small issues become incidents. Three mock microservices (`auth-service`, `payments-service`, `api-gateway`) continuously emit structured logs, which LogPulse indexes, searches, aggregates, and streams live to a dashboard.

## Features

- **Full-text log search** with filters by service, level, and time range (Elasticsearch Query DSL — `bool`, `match`, `term`, `range` queries)
- **Aggregations** for error-rate-over-time (date histogram) and top errors by service (nested terms aggregation)
- **Live log tail** over WebSocket, polling Elasticsearch every 2 seconds and pushing new documents to connected clients
- **Threshold-based alerting** — a background worker checks error counts on a rolling window and flags spikes
- **JWT-authenticated dashboard** with bcrypt-hashed credentials
- **Real-time charts** (Recharts) and a dark, dashboard-style UI

## Architecture
Mock microservices → Log generator (bulk indexing)
↓
Elasticsearch (Bonsai)
↓
Node.js + TypeScript API (Express)
↓ ↓
REST endpoints WebSocket server
↓ ↓
React dashboard (Vercel)

## Tech stack

**Backend:** Node.js, TypeScript, Express, OpenSearch/Elasticsearch client, ws (WebSocket), JWT, bcrypt
**Frontend:** React, TypeScript, Vite, Recharts, Axios
**Infrastructure:** Elasticsearch/OpenSearch (Bonsai), Render (API hosting), Vercel (frontend hosting)

## Design decisions worth knowing

- **Explicit index mapping, not dynamic mapping.** `service` and `level` are `keyword` fields (exact-match, used for filtering/aggregation); `message` is `text` with a `.keyword` sub-field (analyzed for full-text search, exact-match for aggregation). Letting Elasticsearch auto-guess types on log data is a common source of bugs in real systems.
- **Single-operator auth, not multi-tenant.** There's no signup flow. This is deliberately scoped as an internal ops tool with one admin login, not a SaaS product — matching how real internal dashboards are usually built.
- **Poll-and-push for the live tail**, not a persistent Elasticsearch subscription (Elasticsearch has no native push/subscribe). The backend polls for documents newer than the last check every 2 seconds and broadcasts over WebSocket.
- **OpenSearch client, not the Elasticsearch client**, in production. The free-tier hosted cluster (Bonsai) runs OpenSearch, a fork of Elasticsearch with a compatible query DSL but a different official client library and slightly different response shape (`response.body` wrapping).

## Local development

Requires Docker, Node.js 20+, and npm.

```bash
# 1. Start Elasticsearch + Kibana locally
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env   # fill in your local values
npm run dev

# 3. Log generator (in a separate terminal)
cd log-generators
npm install
cp .env.example .env
npx tsx src/generate.ts

# 4. Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns a JWT on valid credentials |
| GET | `/api/logs/search` | Full-text + filtered log search (`q`, `service`, `level`, `from`, `size`) |
| GET | `/api/logs/stats/error-rate` | Date histogram of log volume by level (`interval`) |
| GET | `/api/logs/stats/top-errors` | Top error messages, nested by service |
| WS | `/ws/logs` | Live log tail stream |

## Author

Built by [Heena Jhalani](https://github.com/heenajhalani18) — 2026 B.Tech CS (AI) graduate.
