# Design: Feedback Classifier — User Feedback Blackhole

**Data:** 2026-04-16  
**Status:** Aprovado para implementação (brainstorming concluído)  
**Referência:** `README.md`

## 1. Problema e objetivo

**Fricção:** CS/Sales despejam feedback não estruturado em Slack/planilhas; PMs gastam horas lendo, categorizando e contando manualmente.

**Objetivo do MVP:** Capturar feedback mock, **classificar de forma síncrona** com LLM (sentimento, área de feature, urgência, resumo), **persistir em MongoDB** com metadados de rastreio, e expor **dashboard web para PM** mais **endpoint estilo Slack** com peso parecido no demo.

## 2. Decisões consolidadas

| Tema | Decisão |
|------|---------|
| Superfície | Dashboard web forte + ingestão Slack-like (mock/contrato explícito) |
| Backend | NestJS (REST) |
| Frontend | React + Vite + Chakra UI |
| Banco | MongoDB |
| Infra local | Docker Compose **apenas para Mongo** (API e web rodam no host em dev) |
| Fila | Sem Redis/BullMQ no MVP |
| Classificação | **Síncrona na mesma requisição** de ingestão (abordagem 1) |
| LLM | OpenAI (SDK oficial, modelo via env) |
| Falha do LLM | **HTTP 201**: persiste `rawText` + `classificationStatus: failed` + `classificationError` |
| Idioma UI | Inglês (README do challenge alinhado ao revisor) |

## 3. Atores e fluxos

- **PM:** consome agregados, filtra tabela, abre detalhe, vê texto bruto e classificação (ou falha explícita).
- **CS/Sales (simulado):** envia via `POST` Slack-like (`curl`/ferramenta) ou usa ingestão web/bulk no dashboard.

**Fluxos:**

1. Web: formulário ou bulk → API → OpenAI → Mongo → resposta com item completo ou com falha de classificação.
2. Slack-like: `POST` com segredo + payload → mesma pipeline → idempotência quando houver id estável.
3. Leitura: listagem filtrada + endpoint de estatísticas para cards do dashboard.

## 4. Arquitetura lógica

**Monorepo:**

- `apps/api` — NestJS.
- `apps/web` — React + Vite + Chakra.

**Raiz:** `docker-compose.yml` (Mongo com volume, healthcheck, porta publicada), `.env.example` documentado.

**Módulos Nest (sugerido):**

- `Feedback` — leitura, filtros, agregados.
- `Ingest` (ou serviço dentro de `Feedback`) — orquestração criar + classificar + persistir (síncrono).
- `Classification` / `Llm` — cliente OpenAI, prompt, parse JSON, validação.
- `IntegrationsSlack` — rota dedicada, validação de payload, segredo.
- `Health` — liveness e readiness (ping Mongo).

**Limites:** controllers finos; regras nos services; sem chamadas OpenAI fora do módulo LLM.

## 5. Modelo de dados (MongoDB)

**Coleção:** `feedback_items` (nome pode ser ajustado no código, manter consistente).

Campos:

- `_id`
- `rawText` (string, obrigatório)
- `source`: `web_form` \| `web_bulk` \| `slack_like`
- `sourceMetadata` (objeto opcional): `externalMessageId`, `channel`, `userDisplayName`, etc.
- `createdAt`, `updatedAt`
- `sentiment`: `positive` \| `neutral` \| `negative` \| `unknown`
- `featureArea`: taxonomia fechada (constantes versionadas no código), incluindo `unknown`
- `urgency`: `low` \| `medium` \| `high` \| `unknown`
- `summary` (string curta)
- `model` (string)
- `promptVersion` (string, ex. `v1`)
- `classificationRaw` (objeto — resposta bruta ou parseada do modelo)
- `classificationStatus`: `success` \| `failed`
- `classificationError` (string, opcional; preenchido quando `failed`)

**Índices:**

- `{ createdAt: -1 }` para listagem recente.
- Composto simples para filtros: `{ featureArea: 1, urgency: 1, sentiment: 1 }` (ajustar conforme queries reais).
- **Único** em `sourceMetadata.externalMessageId` com índice **sparse** (idempotência Slack-like sem bloquear itens `web_*` sem esse campo); documentar que o mock **deve** enviar `externalMessageId` para retries limpos.

**Agregados:** aggregation pipeline (`$match` + `$group` / `$facet`) no serviço de leitura.

## 6. Integração OpenAI

- Saída **JSON** com campos alinhados aos enums; preferir `response_format` com schema quando viável.
- **Pós-processamento:** validação (Zod ou equivalente); valores fora do enum → `unknown`.
- **Retry:** no máximo **uma** retentativa em falha parse/timeout, política documentada.
- **Limites:** truncar ou rejeitar `rawText` acima de N caracteres (definir N no README, ex. 8k); `max_tokens` moderado para `summary`.
- **Timeout** explícito no cliente HTTP alinhado ao timeout do Nest.
- **Logging:** sem API key, sem corpo completo em prod; latência e `promptVersion` sim.

## 7. API REST

Prefixo global: `/api`.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/feedback` | Ingestão web simples |
| `POST` | `/api/feedback/bulk` | Vários itens; **resultado por item** no array de resposta |
| `POST` | `/api/integrations/slack/feedback` | Slack-like; header de segredo; idempotência por `externalMessageId` |
| `GET` | `/api/feedback` | Lista paginada + filtros |
| `GET` | `/api/feedback/:id` | Detalhe |
| `GET` | `/api/feedback/stats/summary` | Agregados para dashboard |
| `POST` | `/api/feedback/:id/reclassify` | Opcional (stretch) |
| `GET` | `/api/health` | Liveness |
| `GET` | `/api/health/ready` | Readiness (Mongo) |

**CORS:** origem do Vite via env.

**Auth:** rota Slack-like exige segredo compartilhado; demais rotas públicas no MVP (opcional API key futura).

## 8. Frontend (React + Chakra)

- `/dashboard` — cards (`stats/summary`) + tabela + filtros.
- `/ingest` — `POST /api/feedback`.
- `/ingest/bulk` — `POST /api/feedback/bulk` com resultado por linha.
- Detalhe: modal ou `/feedback/:id`.
- **Opcional:** página “Integrações” com exemplo `curl` para Slack-like.
- **TanStack Query** recomendado; estados loading/empty/erro; destaque visual para `classificationStatus: failed`.
- **Idioma:** inglês na UI.

## 9. NFRs e entregáveis

- ESLint + Prettier; TypeScript strict em `api` e `web`.
- Testes mínimos: validação/parsing da classificação; integração com **mock** do cliente OpenAI ou testcontainers conforme tempo.
- README: fricção, arquitetura (ASCII), `docker compose`, envs, limites, exemplo `curl` Slack-like.

## 10. Fora de escopo (MVP)

Redis/BullMQ, OAuth Slack real, Jira com credenciais reais, multi-tenant, RBAC completo, taxonomia editável por PM na UI, i18n completo.

## 11. Próximo passo

Plano de implementação: [../plans/implementation-plan.md](../plans/implementation-plan.md).

**Skills Cursor (opcional):** `nestjs-best-practices`, `frontend-design` — complementam convenções Nest e design de UI; **este spec e `.cursor/rules/` prevalecem** se houver divergência (ex.: scope MVP, sem Redis, contrato REST).
