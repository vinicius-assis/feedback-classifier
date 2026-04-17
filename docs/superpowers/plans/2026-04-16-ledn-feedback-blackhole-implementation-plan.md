# Implementation plan: Ledn Feedback Blackhole MVP

**Spec:** [../specs/2026-04-16-ledn-feedback-blackhole-design.md](../specs/2026-04-16-ledn-feedback-blackhole-design.md)  
**Data:** 2026-04-16  
**Objetivo:** Entregar monorepo funcional (Nest + React + Mongo via Docker), fluxos do spec, README e base para Loom.

---

## 0. Convenções e pré-requisitos

- **Node:** LTS atual (20+). **Package manager:** `pnpm` (recomendado) ou `npm` com workspaces na raiz.
- **Taxonomia `featureArea` (v1, constantes no código):** `onboarding`, `payments`, `reporting`, `performance`, `security`, `integrations`, `other`, `unknown`. Ajustar lista só se o prompt e validação forem atualizados juntos.
- **Limite `rawText`:** 8192 caracteres — acima disso `400` com mensagem clara (documentar no README).
- **Modelo OpenAI default:** `gpt-4o-mini` via `OPENAI_MODEL` (override por env).

**Critério global de “pronto”:** `docker compose up -d` + variáveis copiadas de `.env.example` + `pnpm dev` (ou comandos documentados) → ingestão web, bulk, listagem com filtros, stats, `curl` Slack-like com segredo, health/ready OK.

---

## Fase A — Monorepo e tooling

| # | Tarefa | Notas |
|---|--------|--------|
| A.1 | Criar `package.json` na raiz com **workspaces** `apps/api`, `apps/web`. | Scripts `dev`, `build`, `lint` na raiz delegando. |
| A.2 | Adicionar `.gitignore` (node_modules, dist, .env, logs). | |
| A.3 | ESLint + Prettier compartilhados ou por app; `strict` TS em ambos. | |

**Aceite:** `pnpm install` na raiz instala dependências das duas apps sem erro.

---

## Fase B — Infra local (Mongo)

| # | Tarefa | Notas |
|---|--------|--------|
| B.1 | `docker-compose.yml`: serviço `mongo`, imagem oficial, volume nomeado, `27017:27017`, **healthcheck** `mongosh --eval "db.adminCommand('ping')"`. | |
| B.2 | Raiz: `.env.example` com `MONGODB_URI=mongodb://localhost:27017/ledn_feedback` (nome do DB à escolha, consistente no README). | |

**Aceite:** `docker compose up -d` e `mongosh`/`docker compose ps` mostram serviço healthy.

---

## Fase C — `apps/api` (NestJS + Mongo)

| # | Tarefa | Notas |
|---|--------|--------|
| C.1 | Scaffold Nest (`nest new` ou equivalente) em `apps/api`; prefixo global `/api`. | |
| C.2 | `@nestjs/mongoose` + schema `FeedbackItem` espelhando o spec; `timestamps: true`. | Campos `classificationStatus`, `classificationError`, `classificationRaw`, `promptVersion`, `model`. |
| C.3 | Criar índices: `{ createdAt: -1 }`, composto filtros, **unique sparse** em `sourceMetadata.externalMessageId`. | Usar `sparse: true` no decorator/schema. |
| C.4 | `ConfigModule` + validação de env obrigatória na subida (`MONGODB_URI`, `OPENAI_API_KEY`, `SLACK_INGEST_SECRET`, `CORS_ORIGIN`). | |
| C.5 | `HealthModule`: `GET /api/health`, `GET /api/health/ready` (ping Mongo). | |

**Aceite:** API sobe sem OpenAI ainda (mock opcional) ou com key; ready falha se Mongo cair.

---

## Fase D — Classificação (OpenAI)

| # | Tarefa | Notas |
|---|--------|--------|
| D.1 | `ClassificationModule` + serviço que monta prompt (enums explícitos), chama OpenAI **JSON** (`response_format` json_schema se disponível no SDK/modelo). | Constante `PROMPT_VERSION = 'v1'`. |
| D.2 | Pós-processamento com **Zod**: coerce inválidos → `unknown`; preencher `classificationRaw`. | |
| D.3 | Timeout + **1 retry** só para falhas transitórias/parse; após esgotar → lançar erro tipado para camada de ingest. | |
| D.4 | Injetar `OpenAI` via provider Nest; teste unitário com **cliente mock** (sem rede). | |

**Aceite:** teste unitário cobre JSON válido, enum inválido → `unknown`, e erro simulado.

---

## Fase E — Ingestão síncrona

| # | Tarefa | Notas |
|---|--------|--------|
| E.1 | DTO `POST /api/feedback`: `rawText`, `source` default `web_form`; validar tamanho máximo. | |
| E.2 | Orquestração: criar documento → classificar → `classificationStatus: success` + campos preenchidos **ou** em falha: `failed` + `classificationError`, ainda **201**. | Não persistir “meio vazio” que pareça sucesso. |
| E.3 | `POST /api/feedback/bulk`: array de `{ rawText }`; resposta com **array paralelo** `{ index, item \| error }` ou estrutura equivalente documentada. | Um item com falha de classificação não deve impedir os outros (cada um 201 lógico por item). |
| E.4 | `POST /api/integrations/slack/feedback`: validar header `X-Ingest-Secret` (ou nome fixado no README) vs env; body com `text`, `externalMessageId` obrigatório; `source: slack_like`. | |
| E.5 | Idempotência: se `externalMessageId` já existir, retornar documento existente com **200** (ou 201 idempotente — **escolher uma** e documentar; recomendação: **200** + mesmo `_id`). | |

**Aceite:** três vias (web, bulk, slack) persistem e retornam payload esperado; Slack duplicado não duplica documento.

---

## Fase F — Leitura e agregados

| # | Tarefa | Notas |
|---|--------|--------|
| F.1 | `GET /api/feedback`: paginação (`page`/`limit` ou `cursor`), filtros query alinhados ao spec. | |
| F.2 | `GET /api/feedback/:id`: 404 se não existir. | |
| F.3 | `GET /api/feedback/stats/summary`: pipeline `$facet` ou múltiplos `$group` para contagens por sentiment/featureArea/urgency/source/status. | |

**Aceite:** dashboard pode montar só com esses dois endpoints (lista + stats).

---

## Fase G — `apps/web` (React + Vite + Chakra)

| # | Tarefa | Notas |
|---|--------|--------|
| G.1 | Vite + React + TS + Chakra provider + React Router. | |
| G.2 | `VITE_API_BASE_URL`; cliente fetch ou axios com base URL. | |
| G.3 | TanStack Query: `QueryClientProvider`, hooks para stats, lista, mutações ingest. | |
| G.4 | `/dashboard`: cards + tabela + filtros (Chakra Select/Menu) + paginação. | Destaque `failed` (Badge/Alert). |
| G.5 | `/ingest` e `/ingest/bulk` conforme spec. | Toasts de sucesso/erro. |
| G.6 | Detalhe: rota `/feedback/:id` ou modal a partir da tabela. | |
| G.7 | (Opcional) `/integrations`: bloco de código com `curl` exemplo. | |

**Aceite:** fluxo manual completo sem console errors; CORS resolvido via env na API.

---

## Fase H — Qualidade e entrega

| # | Tarefa | Notas |
|---|--------|--------|
| H.1 | README raiz: fricção, diagrama ASCII, pré-requisitos, compose, envs, como rodar API + web, limites, exemplo `curl` Slack-like. | |
| H.2 | `apps/api`: teste(s) adicionais se tempo (e2e supertest com Mongo memory server **ou** mock repositório). | |
| H.3 | Passar lint nas duas apps; revisar mensagens de erro da API (shape consistente). | |
| H.4 | (Stretch) `POST /api/feedback/:id/reclassify` + botão na UI. | Fora do caminho crítico. |

**Aceite:** novo clone + README = demo reproduzível em < 15 min (alinhado ao desafio).

---

## Ordem sugerida (dependências)

```text
A → B → C → D → E → F → G → H
```

Trabalho paralelo possível após **C.2**: iniciar **G.1** enquanto **D** avança, desde que contratos DTO estáveis sejam alinhados cedo (contrato JSON da API documentado no README ou OpenAPI opcional).

---

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Latência OpenAI em bulk | Limitar tamanho do batch no MVP (ex. máx 20 por request) e documentar. |
| Custo API | Modelo mini; bulk opcionalmente menor no demo. |
| Índice único sparse + updates | Slack idempotente: `findOneAndUpdate` com `upsert` ou find-then-return sem violar unique. |

---

## Pós-MVP (backlog explícito)

Redis/BullMQ, fila assíncrona, reclassify em massa, OpenAPI publicado, Testcontainers, autenticação nas rotas de leitura.
