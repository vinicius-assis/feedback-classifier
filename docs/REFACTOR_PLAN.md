# Plano de melhoria — `apps/web` + rebranding

**Contexto:** análise da aplicação web (28 arquivos, ~3.000 linhas) apontou três frentes: ausência total de testes, duplicação estrutural de componentes, e bugs visíveis ao usuário. Somado a isso, remoção de todas as referências à empresa do desafio.

**Nome do projeto:** `feedback-classifier`
**Decisão sobre docs do desafio:** apagar o enunciado, reescrever `.cursor/rules` e `docs/superpowers` sem citar a empresa.

**Ordem recomendada:** Fase 0 (rebranding) → Fase 1 (testes) → Fase 2 (bugs) → Fase 3 (componentização) → Fase 4 (arquitetura) → Fase 5 (polimento).
A Fase 1 vem antes da 3 de propósito: os testes são a rede de segurança que torna a refatoração de componentes segura.

---

## Fase 0 — Remover referências à empresa ✅ concluída

O nome antigo foi mapeado por `grep -rniI` em toda a árvore. O lockfile (`pnpm-lock.yaml`) não continha ocorrências.

### 0.1 Código e configuração

- [x] `package.json` (raiz) — nome do projeto → `feedback-classifier`
- [x] `apps/api/package.json` — escopo do pacote → `@feedback-classifier/api`
- [x] `apps/web/package.json` — escopo do pacote → `@feedback-classifier/web`
- [x] `apps/web/index.html` — `<title>` → `Feedback Classifier`
- [x] `apps/web/src/components/Navbar.tsx` — texto do logo → `Feedback Classifier`
- [x] `apps/web/src/main.tsx` — `storageKey` → `feedback-classifier-theme`
- [x] `.env.example` — nome do banco → `feedback_classifier`
- [x] Rodar `pnpm install` após renomear os pacotes do workspace

### 0.2 Documentação — remoções

- [x] `git rm CHALLENGE_DESCRIPTION.md` — texto integral e proprietário do enunciado
- [x] `git rm FRICTION.md` — idem

### 0.3 Documentação — reescrita

- [x] `README.md` — título → `# Feedback Classifier`
- [x] `README.md` — exemplo de `MONGODB_URI` na tabela de env vars
- [x] `README.md` — seção `## Demo` e link do vídeo removidos
- [x] `git mv` das duas regras em `.cursor/rules/` → `mvp-core.mdc`, `nest-api.mdc`
- [x] `.cursor/rules/mvp-core.mdc` — description, título e caminhos das specs
- [x] `.cursor/rules/nest-api.mdc` — referência cruzada à regra core
- [x] `git mv` da spec → `docs/superpowers/specs/2026-04-16-feedback-classifier-design.md`
- [x] Spec — título, referência ao enunciado (agora `README.md`) e links cruzados
- [x] `docs/superpowers/plans/implementation-plan.md` — título, link para a spec, `MONGODB_URI`
- [x] Menções remanescentes ao vídeo de demo na spec e no plano de implementação

### 0.4 Fora da árvore de arquivos — **pendente**

Ações irreversíveis ou que dependem de acesso externo; não executadas.

- [ ] Renomear o repositório no GitHub para `feedback-classifier`
- [ ] `git remote set-url origin git@github.com:vinicius-assis/feedback-classifier.git`
- [ ] Renomear o diretório local do projeto
- [ ] Reescrever a mensagem do commit `3ea6126`, que cita a empresa — requer `git rebase` + `push --force`
- [ ] Dropar/recriar o banco local com o novo nome, ou renomear a collection

### 0.5 Verificação

- [x] `grep -rniI` do nome antigo na árvore de trabalho retorna vazio
- [ ] `git log --oneline` sem menções ao nome antigo (depende de 0.4)
- [x] `pnpm build` passa nos dois apps após os renames
- [x] `pnpm --filter @feedback-classifier/api test` — 10 testes passando

---

## Fase 1 — Infraestrutura de testes (hoje: zero)

O `apps/api` tem Jest + 2 specs. O `apps/web` não tem nenhum arquivo de teste, nenhuma dependência de teste e nem script `test` — assim como o `package.json` da raiz.

### 1.1 Setup

- [ ] Adicionar em `apps/web`: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`
- [ ] `vite.config.ts` — bloco `test` com `environment: 'jsdom'`, `globals: true`, `setupFiles`
- [ ] `src/test/setup.ts` — importar `@testing-library/jest-dom`, iniciar o server do MSW
- [ ] `src/test/msw-handlers.ts` — handlers para `GET /feedback`, `GET /feedback/stats/summary`, `GET /feedback/:id`, `DELETE`, `POST /feedback`, `/bulk`, `/import`, `/reclassify`
- [ ] `src/test/renderWithProviders.tsx` — helper com `QueryClientProvider` (`retry: false`), `ChakraProvider`, `MemoryRouter`
- [ ] Script `"test": "vitest run"` e `"test:watch": "vitest"` em `apps/web/package.json`
- [ ] Script `"test": "pnpm -r run test"` no `package.json` da raiz

### 1.2 Testes unitários — lógica pura (maior retorno, menor custo)

- [ ] `lib/api.ts` › `withQuery` — omite `undefined`, `null` e `''`; respeita `?` já existente na path
- [ ] `lib/api.ts` › `parseResponseBody` — `204` → `undefined`, corpo vazio → `undefined`, `content-type` não-JSON → texto cru, JSON inválido → texto cru
- [ ] `lib/api.ts` › `errorMessageFromBody` — extrai `message` do corpo, cai para `statusText`
- [ ] `lib/api.ts` › `ApiError` — carrega `status` e `body` corretamente
- [ ] `lib/api.ts` › `requestCore` — não seta `Content-Type` quando o body é `FormData`
- [ ] `isAcceptedFile` (extraído de `IngestFilePage`) — `.csv`/`.xlsx` por mime e por extensão; rejeita o resto
- [ ] `classificationToast` (extraído de `IngestPage`) — `failed` → warning; `success` com campos `unknown` filtrados; sem status → "Saved"
- [ ] `bucketCounts` (após extração da Fase 3) — `_id: null` vira `'unknown'`
- [ ] `formatDate` / `truncateText` (após consolidação) — data inválida, `undefined`, texto no limite exato

### 1.3 Testes de hooks

- [ ] `useFeedbackList` — monta a query string a partir dos filtros; `queryKey` muda quando os filtros mudam
- [ ] `useFeedbackItem` — `enabled: false` quando o id é vazio
- [ ] `useDeleteFeedback` — invalida a chave `['feedback']` no sucesso
- [ ] `useReclassifyFeedback` — faz `setQueryData` no detail e invalida a list
- [ ] `useIngestFeedback` / `useIngestBulk` / `useIngestFile` — invalidação após sucesso; `useIngestFile` monta o `FormData` com o campo `file`
- [ ] `useCountUp` — com fake timers e `requestAnimationFrame` mockado; cobre o bug 2.1

### 1.4 Testes de componente

- [ ] `DashboardPage` — renderiza os 4 KPIs a partir do stats mockado
- [ ] `DashboardPage` — mudar um `<select>` de filtro dispara request com o param correto e reseta `page` para 1
- [ ] `DashboardPage` — paginação: `Previous` desabilitado na página 1, `Next` desabilitado na última
- [ ] `DashboardPage` — empty state ("No feedback matches these filters.")
- [ ] `DashboardPage` — erro de stats e erro de list renderizam os respectivos alertas
- [ ] `DashboardPage` — clicar na linha navega para `/feedback/:id`; clicar no lixo **não** navega e abre o diálogo
- [ ] `DeleteFeedbackDialog` — confirmar chama `onConfirm`; cancelar chama `onClose`; ambos desabilitados durante `isDeleting`
- [ ] `IngestPage` — submit vazio mostra toast de validação e não chama a API; sucesso limpa o textarea
- [ ] `IngestBulkPage` — linhas em branco filtradas; > 20 linhas bloqueia com toast; resultado misto (fulfilled + rejected) monta a descrição certa
- [ ] `IngestFilePage` — arquivo inválido rejeitado antes do submit; botão desabilitado sem arquivo; drag-and-drop aceita arquivo
- [ ] `FeedbackDetailPage` — estados loading / 404 / erro genérico / sucesso
- [ ] `FeedbackDetailPage` — botão Reclassify dispara mutation e toast
- [ ] `Navbar` — link ativo recebe destaque; toggle de tema alterna
- [ ] Smoke test dos 5 charts — renderizam com `buckets` vazio, `undefined` e populado, sem quebrar

### 1.5 E2E (opcional, mas fecha a lacuna de integração)

- [ ] Playwright com fluxo `ingest → dashboard → detail → reclassify → delete`

---

## Fase 2 — Bugs e riscos concretos

### 2.1 `useCountUp` sempre anima a partir de zero

`hooks/useCountUp.ts:29` fixa `fromRef.current = 0`, contrariando o próprio JSDoc. Efeito prático: todo refetch de stats (ex.: após um delete) faz os 4 KPIs piscarem de 0 até o valor novo.

- [ ] Guardar o valor renderizado anterior num ref e animar `anterior → target`
- [ ] Teste cobrindo transição N → M (item 1.3)

### 2.2 `copyId` sem tratamento de erro

`FeedbackDetailPage:198` — `navigator.clipboard.writeText().then()` sem `.catch`. Rejeita em contexto não-seguro ou com permissão negada → unhandled rejection e nenhum feedback ao usuário. O `setTimeout` do estado `copied` também não tem cleanup, causando `setState` após unmount.

- [ ] Adicionar `.catch` com toast de erro
- [ ] Guardar o timer num ref e limpar no unmount

### 2.3 Sem ErrorBoundary e sem rota 404

- [ ] `components/ErrorBoundary.tsx` envolvendo o `<AppShell />`
- [ ] `<Route path="*" element={<NotFoundPage />} />` em `App.tsx`

### 2.4 `getBaseUrl()` lança dentro do `queryFn`

`lib/api.ts:13` — se `VITE_API_BASE_URL` faltar, o usuário vê um erro genérico de conexão em vez da causa real.

- [ ] Validar a env var no boot (`main.tsx`) com mensagem explícita, **ou**
- [ ] Configurar `server.proxy` no `vite.config.ts` (hoje vazio) e usar `/api` como default — de quebra elimina a dependência de CORS em dev

### 2.5 `QueryClient` sem defaults

`main.tsx:11` — sem `staleTime`/`retry`, cada foco de janela refaz stats + list.

- [ ] Definir `defaultOptions.queries` com `staleTime`, `retry` e `refetchOnWindowFocus` conscientes

### 2.6 Filtros do dashboard não persistem na URL

Reload ou compartilhar o link perde todo o estado.

- [ ] Migrar `useState<FeedbackFilters>` para `useSearchParams`
- [ ] Ganho colateral: o estado passa a ser testável via URL inicial

### 2.7 Non-null assertion nos charts

`SentimentChart:581` — `props.payload!`; se vier vazio, quebra o render do gráfico.

- [ ] Substituir por optional chaining com fallback de cor

### 2.8 Validação de tamanho de arquivo ausente

`IngestFilePage` anuncia "max 10 MB" mas não valida nada no cliente.

- [ ] Validar `file.size` em `pickFile`, com a mesma mensagem do servidor

---

## Fase 3 — Componentização

### 3.1 Duplicação literal

- [ ] **`bucketCounts`** — a mesma função está reescrita **6 vezes**: `DashboardPage:63`, `SentimentChart:508`, `UrgencyChart:650`, `FeatureAreaChart:928`, `ClassificationChart:1007`, `SourceMixChart:762` → extrair para `lib/buckets.ts`
- [ ] **`errorMessage(error)`** — copiada byte a byte em `IngestPage:20`, `IngestBulkPage:22`, `IngestFilePage:26` → `lib/errors.ts`
- [ ] **`formatDate`** — duplicada em `DashboardPage:76` (`Intl.DateTimeFormat`) e `FeedbackDetailPage:54` (`toLocaleString`), com formatos **divergentes** na mesma aplicação → `lib/format.ts`, formato único
- [ ] **`type Props = { buckets: ...; isLoading: boolean }`** — repetido nos 5 charts → `StatBucket[]` em `lib/types.ts`

### 3.2 Quebrar as páginas grandes

`DashboardPage` tem 628 linhas e acumula KPIs + filtros + tabela + paginação + diálogo.

- [ ] `<StatCard>` — os 4 cards de KPI são o mesmo JSX de ~30 linhas com props inline repetidas
- [ ] `<SelectFilter label options value onChange>` — os 5 blocos `Field.Root` + `NativeSelect` são idênticos
- [ ] `<FeedbackFilters>` — agrupa os 5 selects + botão de reset
- [ ] `<FeedbackTable>` + mover `FeedbackTableRow` para arquivo próprio
- [ ] `<Pagination>`

`FeedbackDetailPage` tem 478 linhas; o grupo Reclassify + CopyID ocupa ~100 linhas de props de layout inline.

- [ ] `<CopyableId>`
- [ ] `<ClassificationCard>`
- [ ] `<SourceMetadataCard>`

### 3.3 Abstrações compartilhadas

- [ ] `<ChartCard title description isLoading skeletonHeight>` — os 5 charts repetem `Card.Root variant="outline" h="full" transition _hover` + header + branch de `Skeleton`; corta ~40% de cada arquivo
- [ ] `components/icons/` — `TrashIcon`, `IconCopy`, `IconCheck`, `IconReclassify`, `SunIcon`, `MoonIcon` estão espalhados dentro das páginas
- [ ] `<StatusBadge>` ou recipe do Chakra — `variant="subtle" textTransform="uppercase" fontSize="xs" letterSpacing="wide"` aparece 5 vezes
- [ ] `<ErrorAlert title description>` — o bloco "Could not load…" está duplicado só no Dashboard
- [ ] `<PageHeader>` + `<FormCard>` — as 3 páginas de ingest repetem `Container maxW="7xl" py={8}` + Heading + Box bordado

### 3.4 Fonte única de verdade para o domínio

Hoje as constantes vivem em dois lugares desalinhados: `SENTIMENT_OPTIONS`/`FEATURE_AREA_OPTIONS`/`URGENCY_OPTIONS` no `DashboardPage`, e `SENTIMENT_ORDER`+`SENTIMENT_LABELS`/`URGENCY_ORDER`/`FEATURE_ORDER` nos charts.

- [ ] `lib/domain.ts` — um array por dimensão com `{ key, label, colorToken }`; filtros e charts derivam da mesma fonte

---

## Fase 4 — Arquitetura e código morto

### 4.1 Remover código morto

- [ ] `IntegrationsPage` — roteada em `App.tsx`, mas o link no `Navbar` está comentado e a página não faz nada. Remover página + rota
- [ ] Blocos Slack comentados: `useIngest.ts` (`useIngestSlack`), `types.ts` (`SlackFeedbackBody`), `IngestPage.tsx` (`clearSlackFields`), `SourceMixChart.tsx`, `DashboardPage.tsx:59`, `Navbar.tsx:12`. O git guarda o histórico — deletar
- [ ] Comentário órfão em `DashboardPage.tsx:18` ("Badge, Card, Skeleton kept for…")
- [ ] Decidir sobre o Slack no `README` e no `.env.example` (`SLACK_INGEST_SECRET`): se a API ainda expõe o endpoint, manter documentado; se não, remover junto

### 4.2 Tipos compartilhados no monorepo

`apps/web/src/lib/types.ts` reescreve à mão o schema do `apps/api` — divergência silenciosa é questão de tempo. O `pnpm-workspace.yaml` já existe.

- [ ] Criar `packages/shared` com os tipos de domínio e os contratos de request/response
- [ ] Consumir em `apps/api` e `apps/web`

### 4.3 Performance

- [ ] `React.lazy` por rota — `recharts` + `@chakra-ui/charts` entram no bundle inicial mesmo em `/ingest`
- [ ] Auto-hospedar a fonte DM Sans (`index.html` busca do Google Fonts: bloqueia render e vaza IP do usuário)

---

## Fase 5 — Acessibilidade, responsividade e tooling

- [ ] `Table.Row` clicável (`DashboardPage:132`) tem `tabIndex={0}` e `onKeyDown`, mas nenhum `role`/`aria-label` — navegável por teclado sem semântica anunciada
- [ ] Tabela em mobile só tem scroll horizontal — considerar layout de cards em `base`
- [ ] Adicionar `eslint-plugin-jsx-a11y` ao `apps/web/eslint.config.js`
- [ ] Seletor de `limit` na paginação (hoje fixo em 20)
- [ ] `SourceMixChart:792` — o padrão `setTimeout(…, 0)` para disparar a animação é frágil; avaliar CSS `@starting-style` ou uma key de remount
- [ ] Avaliar subir `@typescript-eslint/no-explicit-any` de `warn` para `error`

---

## Critérios de conclusão

- [x] `grep -rniI` do nome antigo da empresa na árvore de trabalho retorna vazio
- [ ] `pnpm build` passa nos dois apps
- [ ] `pnpm lint` passa sem warnings novos
- [ ] `pnpm test` roda e passa em `apps/api` **e** `apps/web`
- [ ] Cobertura do `apps/web` acima de um piso acordado (sugestão inicial: 60% em `lib/` e `hooks/`)
- [ ] Nenhum arquivo de página acima de ~250 linhas
