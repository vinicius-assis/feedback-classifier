# Implementation plan: Ledn Feedback Blackhole MVP

**Spec:** [../specs/2026-04-16-ledn-feedback-blackhole-design.md](../specs/2026-04-16-ledn-feedback-blackhole-design.md)  
**Step-by-step checklist:** [2026-04-16-ledn-feedback-blackhole-TODO.md](./2026-04-16-ledn-feedback-blackhole-TODO.md)  
**Date:** 2026-04-16  
**Goal:** Ship a working monorepo (Nest + React + Mongo via Docker), spec flows, README, and a base for a Loom recording.

**Cursor skills (optional):** `nestjs-best-practices` (kadajett), `frontend-design` (Anthropic) — useful for Nest style and UI craft; **if they conflict with this plan/spec or `.cursor/rules/`, the repository wins.**

---

## 0. Conventions and prerequisites

- **Node:** current LTS (20+). **Package manager:** `pnpm` (recommended) or `npm` with workspaces at the repo root.
- **`featureArea` taxonomy (v1, code constants):** `onboarding`, `payments`, `reporting`, `performance`, `security`, `integrations`, `other`, `unknown`. Change the list only if the prompt and validation are updated together.
- **`rawText` limit:** 8192 characters — above that, `400` with a clear message (document in the README).
- **Default OpenAI model:** `gpt-4o-mini` via `OPENAI_MODEL` (env override).

**Global “done” criterion:** `docker compose up -d` + variables copied from `.env.example` + `pnpm dev` (or documented commands) → web ingest, bulk, listing with filters, stats, Slack-like `curl` with secret, health/ready OK.

---

## Phase A — Monorepo and tooling

| # | Task | Notes |
|---|--------|--------|
| A.1 | Create root `package.json` with **workspaces** `apps/api`, `apps/web`. | Root scripts `dev`, `build`, `lint` delegate to apps. |
| A.2 | Add `.gitignore` (node_modules, dist, .env, logs). | |
| A.3 | Shared or per-app ESLint + Prettier; `strict` TS in both. | |

**Acceptance:** `pnpm install` at the root installs both apps’ dependencies without error.

---

## Phase B — Local infrastructure (Mongo)

| # | Task | Notes |
|---|--------|--------|
| B.1 | `docker-compose.yml`: `mongo` service, official image, named volume, `27017:27017`, **healthcheck** `mongosh --eval "db.adminCommand('ping')"`. | |
| B.2 | Root: `.env.example` with `MONGODB_URI=mongodb://localhost:27017/ledn_feedback` (DB name of your choice, consistent in the README). | |

**Acceptance:** `docker compose up -d` and `mongosh` / `docker compose ps` show a healthy service.

---

## Phase C — `apps/api` (NestJS + Mongo)

| # | Task | Notes |
|---|--------|--------|
| C.1 | Nest scaffold (`nest new` or equivalent) in `apps/api`; global prefix `/api`. | |
| C.2 | `@nestjs/mongoose` + `FeedbackItem` schema matching the spec; `timestamps: true`. | Fields `classificationStatus`, `classificationError`, `classificationRaw`, `promptVersion`, `model`. |
| C.3 | Create indexes: `{ createdAt: -1 }`, composite filters, **unique sparse** on `sourceMetadata.externalMessageId`. | Use `sparse: true` in the decorator/schema. |
| C.4 | `ConfigModule` + required env validation on boot (`MONGODB_URI`, `OPENAI_API_KEY`, `SLACK_INGEST_SECRET`, `CORS_ORIGIN`). | |
| C.5 | `HealthModule`: `GET /api/health`, `GET /api/health/ready` (Mongo ping). | |

**Acceptance:** API starts without OpenAI yet (optional mock) or with a key; ready fails if Mongo is down.

---

## Phase D — Classification (OpenAI)

| # | Task | Notes |
|---|--------|--------|
| D.1 | `ClassificationModule` + service that builds the prompt (explicit enums), calls OpenAI for **JSON** (`response_format` json_schema if available in the SDK/model). | Constant `PROMPT_VERSION = 'v1'`. |
| D.2 | Post-processing with **Zod**: coerce invalid → `unknown`; fill `classificationRaw`. | |
| D.3 | Timeout + **1 retry** only for transient/parse failures; after exhaustion → throw typed error for the ingest layer. | |
| D.4 | Inject `OpenAI` via a Nest provider; unit test with **mock client** (no network). | |

**Acceptance:** unit test covers valid JSON, invalid enum → `unknown`, and simulated error.

---

## Phase E — Synchronous ingest

| # | Task | Notes |
|---|--------|--------|
| E.1 | DTO for `POST /api/feedback`: `rawText`, `source` default `web_form`; validate max size. | |
| E.2 | Orchestration: create document → classify → `classificationStatus: success` + filled fields **or** on failure: `failed` + `classificationError`, still **201**. | Do not persist a “half-empty” record that looks like success. |
| E.3 | `POST /api/feedback/bulk`: array of `{ rawText }`; response with a **parallel array** `{ index, item | error }` or equivalent documented structure. | One item failing classification must not block the others (each item logically 201 on success). |
| E.4 | `POST /api/integrations/slack/feedback`: validate header `X-Ingest-Secret` (or name fixed in README) vs env; body with `text`, required `externalMessageId`; `source: slack_like`. | |
| E.5 | Idempotency: if `externalMessageId` already exists, return the existing document with **200** (or idempotent 201 — **pick one** and document; recommendation: **200** + same `_id`). | |

**Acceptance:** all three paths (web, bulk, slack) persist and return the expected payload; duplicate Slack does not duplicate the document.

---

## Phase F — Reads and aggregates

| # | Task | Notes |
|---|--------|--------|
| F.1 | `GET /api/feedback`: pagination (`page`/`limit` or `cursor`), query filters aligned with the spec. | |
| F.2 | `GET /api/feedback/:id`: 404 if missing. | |
| F.3 | `GET /api/feedback/stats/summary`: `$facet` pipeline or multiple `$group` for counts by sentiment/featureArea/urgency/source/status. | |

**Acceptance:** the dashboard can be built with only these two endpoints (list + stats).

---

## Phase G — `apps/web` (React + Vite + Chakra)

| # | Task | Notes |
|---|--------|--------|
| G.1 | Vite + React + TS + Chakra provider + React Router. | |
| G.2 | `VITE_API_BASE_URL`; fetch or axios client with base URL. | |
| G.3 | TanStack Query: `QueryClientProvider`, hooks for stats, list, ingest mutations. | |
| G.4 | `/dashboard`: cards + table + filters (Chakra Select/Menu) + pagination. | Highlight `failed` (Badge/Alert). |
| G.5 | `/ingest` and `/ingest/bulk` per spec. | Success/error toasts. |
| G.6 | Detail: route `/feedback/:id` or modal from the table. | |
| G.7 | (Optional) `/integrations`: code block with example `curl`. | |

**Acceptance:** full manual flow without console errors; CORS fixed via API env.

---

## Phase H — Quality and delivery

| # | Task | Notes |
|---|--------|--------|
| H.1 | Root README: friction, ASCII diagram, prerequisites, compose, envs, how to run API + web, limits, Slack-like `curl` example. | |
| H.2 | `apps/api`: additional tests if time (e2e supertest with Mongo memory server **or** mock repository). | |
| H.3 | Pass lint in both apps; review API error messages (consistent shape). | |
| H.4 | (Stretch) `POST /api/feedback/:id/reclassify` + button in the UI. | Off the critical path. |

**Acceptance:** fresh clone + README = reproducible demo in under 15 minutes (aligned with the challenge).

---

## Suggested order (dependencies)

```text
A → B → C → D → E → F → G → H
```

Parallel work is possible after **C.2**: start **G.1** while **D** progresses, as long as stable DTO contracts are agreed early (JSON API contract documented in the README or optional OpenAPI).

---

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| OpenAI latency in bulk | Cap batch size in the MVP (e.g. max 20 per request) and document. |
| API cost | Mini model; optionally smaller bulk in the demo. |
| Unique sparse index + updates | Slack idempotency: `findOneAndUpdate` with `upsert` or find-then-return without breaking unique. |

---

## Post-MVP (explicit backlog)

Redis/BullMQ, async queue, bulk reclassify, published OpenAPI, Testcontainers, authentication on read routes.
