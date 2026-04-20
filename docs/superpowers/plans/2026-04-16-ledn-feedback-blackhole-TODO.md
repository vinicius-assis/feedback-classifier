# TODO — implementação passo a passo (Ledn Feedback Blackhole MVP)

**Plano:** [2026-04-16-ledn-feedback-blackhole-implementation-plan.md](./2026-04-16-ledn-feedback-blackhole-implementation-plan.md)  
**Spec:** [../specs/2026-04-16-ledn-feedback-blackhole-design.md](../specs/2026-04-16-ledn-feedback-blackhole-design.md)  
**Skills:** `nestjs-best-practices`, `frontend-design` — seguir para idioma Nest/UI; **spec + `.cursor/rules/`** mandam em caso de conflito.  
Marca `[x]` conforme concluíes. Ordem recomendada: **A → B → C → D → E → F → G → H** (após C.2 podes iniciar G.1 em paralelo).

---

## Fase A — Monorepo e tooling

- [x] **A.1** Criar `package.json` na raiz com workspaces `apps/api` e `apps/web`
- [x] **A.2** Scripts na raiz: `dev` (API + web), `build`, `lint` (delegar às apps)
- [x] **A.3** Adicionar `.gitignore` (`node_modules`, `dist`, `.env`, logs, `.turbo` se usar)
- [x] **A.4** TypeScript `strict` em `apps/api` e `apps/web`
- [x] **A.5** ESLint + Prettier (por app ou raiz); `pnpm install` / `npm install` sem erros na raiz

**Gate:** `pnpm install` na raiz instala as duas apps.

---

## Fase B — Infra local (Mongo)

- [x] **B.1** Criar `docker-compose.yml` com serviço `mongo` (imagem oficial, volume, porta `27017`)
- [x] **B.2** Healthcheck Mongo (`mongosh` / ping admin)
- [x] **B.3** `.env.example` na raiz ou em `apps/api` com `MONGODB_URI` (ex.: `mongodb://localhost:27017/ledn_feedback`)

**Gate:** `docker compose up -d` → serviço healthy.

---

## Fase C — API Nest + Mongo

- [x] **C.1** Scaffold Nest em `apps/api` com prefixo global `/api`
- [x] **C.2** Instalar `@nestjs/mongoose` + `MongooseModule.forRootAsync` com `ConfigService`
- [x] **C.3** Schema/collection `feedback_items` com campos do spec (`rawText`, `source`, `sourceMetadata`, classificação, `classificationStatus`, `classificationError`, `classificationRaw`, `model`, `promptVersion`, timestamps)
- [x] **C.4** Índice `{ createdAt: -1 }`
- [x] **C.5** Índice composto para filtros (`featureArea`, `urgency`, `sentiment` — ajustar ao que a listagem usar)
- [x] **C.6** Índice **unique sparse** em `sourceMetadata.externalMessageId`
- [x] **C.7** `ConfigModule` + validação na bootstrap: `MONGODB_URI`, `OPENAI_API_KEY`, `SLACK_INGEST_SECRET`, `CORS_ORIGIN`
- [x] **C.8** `GET /api/health` (liveness)
- [x] **C.9** `GET /api/health/ready` (ping Mongo; falha se DB down)

**Gate:** API sobe; `ready` reflete estado do Mongo.

---

## Fase D — Classificação (OpenAI)

- [x] **D.1** `ClassificationModule` + provider do cliente OpenAI (SDK oficial)
- [x] **D.2** Constante `PROMPT_VERSION = 'v1'` e lista de `featureArea` alinhada ao plano (código + prompt)
- [x] **D.3** Chamada com saída JSON (`response_format` / schema conforme SDK)
- [x] **D.4** Pós-processamento **Zod**: enums inválidos → `unknown`; preencher `classificationRaw`
- [x] **D.5** Timeout no cliente + **no máximo 1 retry** em falhas transitórias/parse
- [x] **D.6** Teste unitário com OpenAI **mockado**: JSON válido, enum inválido → `unknown`, erro simulado

**Gate:** testes de classificação passam sem rede.

---

## Fase E — Ingestão síncrona

- [x] **E.1** DTO `POST /api/feedback`: `rawText`, `source` default `web_form`; máx **8192** caracteres → **400** se exceder
- [x] **E.2** Serviço de orquestração: persistir → classificar → merge no documento
- [x] **E.3** Sucesso: `classificationStatus: success` + campos preenchidos; resposta **201**
- [x] **E.4** Falha LLM após retries: `classificationStatus: failed` + `classificationError`; ainda **201** com `rawText` guardado (sem fingir sucesso)
- [x] **E.5** `POST /api/feedback/bulk`: array de `{ rawText }`; resposta **por item** (índice + item ou erro); limite de batch (ex. máx **20**) documentado
- [x] **E.6** `POST /api/integrations/slack/feedback`: header de segredo (ex. `X-Ingest-Secret`) vs env; body `text` + `externalMessageId` obrigatórios; `source: slack_like`
- [x] **E.7** Idempotência Slack: se `externalMessageId` existir → devolver documento existente com **200** (documentar no README)
- [x] **E.8** Primeira criação Slack → **201** (ou alinhar tudo a 201 — **uma** política documentada)

**Gate:** `curl`/REST para web, bulk e Slack (incl. duplicado) comportam-se como o spec.

---

## Fase F — Leitura e agregados

- [x] **F.1** `GET /api/feedback`: paginação + filtros (`sentiment`, `featureArea`, `urgency`, `source`, `classificationStatus`, datas se no spec)
- [x] **F.2** `GET /api/feedback/:id` com **404** se inexistente
- [x] **F.3** `GET /api/feedback/stats/summary`: agregações (`$facet` / `$group`) para dashboard

**Gate:** dados suficientes para montar dashboard só com lista + stats.

---

## Fase G — Web React

- [x] **G.1** Vite + React + TS em `apps/web`
- [x] **G.2** Chakra `Provider` + tema base
- [x] **G.3** React Router: `/dashboard`, `/ingest`, `/ingest/bulk`, `/feedback/:id`
- [x] **G.4** `VITE_API_BASE_URL` + cliente HTTP (fetch/axios) centralizado
- [x] **G.5** `QueryClientProvider` + TanStack Query
- [x] **G.6** Hooks ou queries: lista com filtros, stats, mutações ingest
- [x] **G.7** `/dashboard`: cards (stats) + tabela + filtros + paginação; realce para `failed`
- [x] **G.8** `/ingest` e `/ingest/bulk` com toasts (Chakra toast) sucesso/erro
- [ ] **G.9** Página ou detalhe do item com texto bruto + classificação + erro se houver
- [ ] **G.10** CORS na API apontando para origem do Vite (`CORS_ORIGIN`)

**Gate:** fluxo manual web sem erros de consola; API e web falam entre si.

---

## Fase H — Qualidade e entrega

- [ ] **H.1** README: fricção, arquitetura ASCII, pré-requisitos, `docker compose`, envs, comandos dev/build, limite de texto, exemplo `curl` Slack-like, política de status HTTP idempotente
- [ ] **H.2** `pnpm lint` / `npm run lint` limpo nas duas apps
- [ ] **H.3** (Opcional) E2E Supertest ou mais testes de serviço com Mongo em memória / mock repo
- [ ] **H.4** (Stretch) `POST /api/feedback/:id/reclassify` + botão na UI

**Gate:** clone fresco + README → demo em menos de 15 min.

---

## Verificação final (checklist curta)

- [ ] `docker compose up -d` + envs → API `ready` OK
- [ ] Ingest web → aparece no dashboard com classificação
- [ ] Bulk com vários itens → resultados por linha
- [ ] Slack-like com segredo → **201**/200 conforme doc; duplicado não duplica doc
- [ ] Falha OpenAI (ex. key inválida ou mock) → item `failed` visível, sem crash da app
- [ ] UI em **inglês**

Quando tudo acima estiver `[x]`, o MVP está alinhado ao spec/plano para gravar o Loom e convidar `@ledn-reviewer`.
