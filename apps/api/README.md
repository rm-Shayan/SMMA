# Styre-BOT — Python / FastAPI Backend

Client-facing backend implementation (FastAPI + SQLAlchemy + PostgreSQL/pgvector).

## Setup

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Configuration is read from the repository root `.env` (falls back to `apps/api/.env`):

- `DATABASE_URL` — `postgresql+psycopg://postgres:postgres@localhost:5432/styre_db`
- `JWT_SECRET`
- `GROQ_API_KEY` (optional; agents run deterministically without it)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_MAIL`, `SMTP_PASS`, `SMTP_FROM`
- `RAG_CONFIDENCE_THRESHOLD` (default `0.2`)
- `REPORT_DIR` (default `generated`)

## Run

```powershell
# API
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 5000

# Background worker (outbox pacing + 09:00 daily brief)
.\.venv\Scripts\python.exe -m app.worker.main
```

API surface (`/api/v1`):

| Area | Endpoints |
|---|---|
| auth | `POST /auth/login`, `POST /auth/register` |
| credits | `GET /credits/balance`, `POST /credits/purchase|grant|allocate|revoke`, `GET /credits/transactions` |
| campaigns | `POST /campaigns`, `POST /campaigns/import`, `POST /campaigns/inbound-webhook`, `GET /campaigns/unsubscribe` |
| social | `POST /social/posts`, `GET /social/posts`, `GET /social/calendar`, `POST /social/engage-competitor`, `POST /social/webhook` |
| knowledge | `POST /knowledge/rag`, `POST /knowledge/documents`, `POST /knowledge/search`, `POST /knowledge/sop/evaluate` |
| approvals | `GET /approvals`, `POST /approvals/{id}/decide` |
| orchestration | `POST /orchestration/supervisor`, `POST /orchestration/research`, `GET /orchestration/brief`, `GET /orchestration/analytics` |

Tenant and RBAC headers: `x-tenant-id`, `x-user-id`.

## Verify Phase 0–4

```powershell
.\.venv\Scripts\python.exe scripts\verify_phases.py
```

Runs 48 live-database assertions (ledger, outreach, inbox, publisher, comments,
approvals, RAG, SOP quiz/report, research, analytics, brief, supervisor DAG,
pacing/429 backoff). Exits non-zero on any failure.

## Layout

```
app/
  agents/      12 ported agents + lifecycle + registry
  routers/     auth, credits, campaigns, social, knowledge, approvals, orchestration
  services/    ledger, audit, embedding, chunker, rag
  worker/      outbox pacing, follow-up scheduling, daily brief loop
scripts/       verify_phases.py
```