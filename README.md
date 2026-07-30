# Feedback Classifier

## The friction

Sales and Customer Success teams constantly hear feature requests and bug reports. They usually dump this unstructured text into a massive #product-feedback Slack channel or a messy spreadsheet. Product Managers then have to spend hours manually reading, categorizing, and tallying these to figure out what users actually want.

This MVP captures mock feedback, classifies it with an LLM (sentiment, feature area, urgency, summary), stores it in MongoDB, and exposes a dashboard plus a Slack-like HTTP endpoint for demos.

## Architecture

```
Monorepo
  apps/api/          NestJS REST API (global prefix /api), default port 3000
  apps/web/          React + Vite + Chakra UI, default port 5173
  packages/shared/   Classification taxonomy and HTTP contract, used by both

Runtime
  Browser (Vite dev server :5173)
        │  HTTP (CORS via CORS_ORIGIN)
        ▼
  NestJS API (:3000)
        │
        ├──── MongoDB (Docker :27017)
        │
        └──── OpenAI API (classification)
```

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** (see `packageManager` in root `package.json`)
- **Docker** (Docker Desktop or compatible) for MongoDB only

## Running the project (step-by-step)

1. **Clone** this repository.
2. **Environment:** copy the example env and set your OpenAI key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set at least `OPENAI_API_KEY`. Adjust `MONGODB_URI`, `SLACK_INGEST_SECRET`, `CORS_ORIGIN`, or `PORT` if needed.
3. **MongoDB:** start the database (from the repo root):
   ```bash
   docker compose up -d
   ```
   Wait until the `mongo` service is healthy (`docker compose ps`).
4. **Install dependencies:**
   ```bash
   pnpm install
   ```
5. **Run API + web together:**
   ```bash
   pnpm dev
   ```
   - API: `http://localhost:3000` (routes under `/api`)
   - Web: `http://localhost:5173`
6. **Open** `http://localhost:5173` in your browser.
7. **Health check** (with Mongo up):
   ```bash
   curl http://localhost:3000/api/health/ready
   ```
   Expected JSON when the database is connected: `{"status":"ready"}`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | Mongo connection string (e.g. `mongodb://localhost:27017/feedback_classifier`) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for classification |
| `OPENAI_MODEL` | No | Model name (default `gpt-4o-mini`) |
| `SLACK_INGEST_SECRET` | Yes | Shared secret for the Slack-like ingest header |
| `CORS_ORIGIN` | Yes | Allowed browser origin (e.g. `http://localhost:5173`) |
| `PORT` | No | API port (default `3000`) |

See [`.env.example`](.env.example) for a template.

## Build

```bash
pnpm build
```

`packages/shared` is built first (pnpm resolves the workspace order), and emits
both ESM for the web app and CommonJS for the API. `pnpm dev` and `pnpm test`
build it up front for the same reason.

## Lint

```bash
pnpm lint
```

## Limits

- **`rawText` maximum length:** **8192** characters. Requests that exceed this return **HTTP 400** with a clear validation message.

## Slack-like integration (`curl` example)

The integration expects JSON with at least `text` and `externalMessageId`, and the header `X-Ingest-Secret` matching `SLACK_INGEST_SECRET`:

```bash
curl -X POST http://localhost:3000/api/integrations/slack/feedback \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Secret: <SLACK_INGEST_SECRET>" \
  -d '{"text":"The payments page is too slow","externalMessageId":"slack-msg-001","channel":"#product-feedback","userDisplayName":"alice"}'
```

Replace `<SLACK_INGEST_SECRET>` with the value from your `.env`.

## Idempotent Slack-like ingest (HTTP status policy)

- **First** successful create for a given `externalMessageId`: **201 Created** (new document stored).
- **Duplicate** `externalMessageId` (already ingested): **200 OK** — returns the **existing** feedback document; no second document is created.

This supports safe retries from integrations that resend the same stable message id.


