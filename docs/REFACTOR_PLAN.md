# Plano de melhoria — `apps/web` + rebranding

**Contexto:** análise da aplicação web (28 arquivos, ~3.000 linhas) apontou três frentes: ausência total de testes, duplicação estrutural de componentes, e bugs visíveis ao usuário. Somado a isso, remoção de todas as referências à empresa do desafio.

**Nome do projeto:** `feedback-classifier`
**Decisão sobre docs do desafio:** apagar o enunciado, reescrever `.cursor/rules` e `docs/superpowers` sem citar a empresa.

**Ordem recomendada:** Fase 0 (rebranding) → Fase 1 (testes) → Fase 2 (bugs) → Fase 3 (componentização) → Fase 4 (arquitetura) → Fase 5 (polimento).
**Estado atual:** Fases 0 a 3 concluídas; próxima é a Fase 4.
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

### 0.4 Fora da árvore de arquivos — parcialmente concluída

O restante depende de ações irreversíveis ou de acesso externo.

- [x] Renomear o repositório no GitHub para `feedback-classifier`
- [x] `git remote set-url origin git@github.com:vinicius-assis/feedback-classifier.git`
- [ ] Renomear o diretório local do projeto
- [ ] Reescrever a mensagem do commit `3ea6126`, que cita a empresa — requer `git rebase` + `push --force`
- [ ] Dropar/recriar o banco local com o novo nome, ou renomear a collection

### 0.5 Verificação

- [x] `grep -rniI` do nome antigo na árvore de trabalho retorna vazio
- [ ] `git log --oneline` sem menções ao nome antigo (depende de 0.4)
- [x] `pnpm build` passa nos dois apps após os renames
- [x] `pnpm --filter @feedback-classifier/api test` — 10 testes passando

---

## Fase 1 — Infraestrutura de testes ✅ concluída

Partiu de zero: o `apps/web` não tinha nenhum arquivo de teste, nenhuma dependência de teste e nem script `test`. Resultado: **148 testes em 16 arquivos**, cobertura global de **87,6%** de statements (`lib/` 95,9%, `hooks/` 100%).

### 1.1 Setup

- [x] Dependências: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`
- [x] `vite.config.ts` — bloco `test` com `jsdom`, `globals`, `setupFiles` e `env.VITE_API_BASE_URL` (a `lib/api.ts` lança sem essa variável)
- [x] `src/test/setup.ts` — matchers do jest-dom, ciclo de vida do MSW, e polyfills de `matchMedia`/`ResizeObserver` que o jsdom não traz
- [x] `src/test/msw-handlers.ts` + `src/test/server.ts` — handlers de happy path para todos os endpoints
- [x] `src/test/fixtures.ts` — construtores de `FeedbackItem`, lista e stats (não previsto no plano, mas evitou repetição em 16 arquivos)
- [x] `src/test/renderWithProviders.tsx` — `QueryClientProvider` + `ChakraProvider` + `MemoryRouter`
- [x] Scripts `test`, `test:watch` e `test:coverage` em `apps/web`; `test` recursivo na raiz

### 1.2 Testes unitários — lógica pura

Exigiu extrair os helpers das páginas, o que já entrega os itens da Fase 3.1 (ver lá).

- [x] `lib/api.ts` › `withQuery` — omite `undefined`/`null`/`''`, respeita `?` existente, preserva `0`/`false`
- [x] `lib/api.ts` › parsing — `204`, corpo vazio, `content-type` não-JSON, JSON malformado
- [x] `lib/api.ts` › mensagens de erro — `message` do corpo, fallback para `statusText`, `message` em branco
- [x] `lib/api.ts` › `ApiError` — carrega `status` e `body`
- [x] `lib/api.ts` › headers — `Accept` sempre JSON; sem `Content-Type` forçado em `FormData`
- [x] `lib/files.ts` › `isAcceptedFile` — por mime, por extensão, case-insensitive, rejeições
- [x] `lib/classificationToast.ts` — `failed` → warning; campos `unknown` filtrados; fallbacks
- [x] `lib/buckets.ts` › `bucketCounts` — `_id: null` vira `unknown`, chave repetida, chave ausente
- [x] `lib/format.ts` › `formatDate` / `truncateText` / `humanizeSource` — data inválida, ausente, limite exato

### 1.3 Testes de hooks

- [x] `useFeedbackList` — envia só os filtros preenchidos; refetch ao mudar filtro; propaga erro
- [x] `useFeedbackItem` — desabilitado com id vazio; encoda o id na URL
- [x] `useDeleteFeedback` — invalida `['feedback']` sem tocar em chaves alheias; propaga erro
- [x] `useReclassifyFeedback` — `setQueryData` no detail + invalidação da list
- [x] `useIngestFeedback` / `useIngestBulk` / `useIngestFile` — corpo enviado, invalidação, resultados por item
- [x] `useCountUp` — com `requestAnimationFrame` controlado; **fixa o bug 2.1 num teste que documenta o comportamento errado atual**

### 1.4 Testes de componente

- [x] `DashboardPage` — KPIs, alertas de erro de stats e de list, stats vazio (`total: []`)
- [x] `DashboardPage` — filtro dispara request com o param certo e reseta `page`; voltar para "All" remove o param; reset limpa tudo
- [x] `DashboardPage` — paginação nos dois extremos e avanço de página
- [x] `DashboardPage` — empty state; clique na linha navega; clique no lixo abre diálogo sem navegar
- [x] `DashboardPage` — delete confirma, cancela e refaz a lista
- [x] `DeleteFeedbackDialog` — confirmar, cancelar, fechado, e `Cancel` travado durante o delete
- [x] `IngestPage` — validação nativa vs. guard JS, trim, limpeza do campo, classificação falha, erro da API
- [x] `IngestBulkPage` — linhas em branco, limite de 20, resultado misto, falha de classificação, limpeza
- [x] `IngestFilePage` — aceite/rejeição por seletor e por drag-and-drop, relatório de import, corte do preview de erros
- [x] `FeedbackDetailPage` — id inválido, 404, erro genérico, conteúdo, metadata, reclassify (sucesso e falha)
- [x] `Navbar` — links, hrefs, toggle de tema com label acessível
- [x] Smoke test dos 5 charts — `undefined`, vazio e populado (incluindo `_id: null`), mais os totais de `SourceMix` e `ClassificationChart`

### 1.5 E2E — **pendente** (opcional)

- [ ] Playwright com fluxo `ingest → dashboard → detail → reclassify → delete`

### Achados durante a Fase 1

Coisas que só apareceram ao escrever os testes:

1. **Validação JS parcialmente inalcançável no `IngestPage`.** O textarea é `required`, então o browser bloqueia o submit vazio antes do handler: o guard `if (!trimmed)` só roda para texto composto só de espaços. Não é bug — a validação nativa cobre o caso —, mas o toast "Please enter feedback text." nunca aparece para campo vazio.
2. **Limitações do jsdom.** `request.formData()` do MSW quebra sob jsdom, e o undici não carrega nome nem conteúdo de um `File` do jsdom na serialização multipart. O teste de upload assere sobre o corpo cru (campo e MIME), não sobre o arquivo.
3. **`userEvent.upload` respeita o atributo `accept`**, então não consegue exercitar a rejeição de tipo pelo seletor; esse caminho é coberto via `fireEvent.change` e via drag-and-drop.
4. **Prettier**: os dois erros pré-existentes em `ClassificationChart.tsx` e `SourceMixChart.tsx` foram corrigidos pelo `--fix` ao longo da fase; `pnpm -r run lint:check` agora passa.

## Fase 2 — Bugs e riscos concretos ✅ concluída

Todos os oito itens resolvidos, cada um com teste. Suíte foi de 148 para **172 testes**.

### 2.1 `useCountUp` sempre animava a partir de zero ✅

`fromRef.current = 0` era fixo, contrariando o próprio JSDoc: todo refetch de stats fazia os 4 KPIs piscarem de 0 até o valor novo.

- [x] `valueRef` espelha o valor renderizado; cada animação parte dele
- [x] Curto-circuito quando `target` não mudou, evitando re-animar à toa
- [x] Teste da Fase 1 invertido: agora afirma que segura em 10 e sobe para 20

### 2.2 `copyId` sem tratamento de erro ✅

- [x] `.catch` com toast "Could not copy the ID" — antes era unhandled rejection silencioso em contexto não-seguro
- [x] Timer guardado em ref e limpo no unmount, eliminando `setState` em árvore desmontada
- [x] Testes de cópia com sucesso e com clipboard indisponível

### 2.3 Sem ErrorBoundary e sem rota 404 ✅

- [x] `components/ErrorBoundary.tsx` com fallback e botão "Try again"
- [x] Montado **dentro** do `AppShell`, em volta do `<Outlet />`: um crash de página preserva a navbar. A `key={location.pathname}` limpa o erro ao navegar
- [x] `pages/NotFoundPage.tsx` + rota `path="*"`

### 2.4 `getBaseUrl()` lançava dentro do `queryFn` ✅

Variável ausente aparecia como "erro de conexão" genérico, escondendo a causa real.

- [x] `DEFAULT_API_BASE_URL = '/api'` — same-origin, sem throw
- [x] `server.proxy` no `vite.config.ts` (antes vazio) encaminhando `/api` para a API; dev deixa de depender de CORS
- [x] `apps/web/.env.example` reescrito: a variável passa a ser opcional, só para API em outra origem

### 2.5 `QueryClient` sem defaults ✅

- [x] `staleTime: 30s`, `refetchOnWindowFocus: false`, `retry: 1` nas queries e `retry: 0` nas mutations

### 2.6 Filtros do dashboard não persistiam na URL ✅

- [x] `hooks/useFeedbackFilters.ts` sincroniza os filtros com `useSearchParams`
- [x] Valores inválidos na URL são descartados em vez de repassados à API (inclusive `source=slack_like`, que a API conhece mas esta UI não oferece)
- [x] `page=1` fica fora da URL; mudar filtro reseta a paginação; navegação usa `replace` para não poluir o histórico
- [x] `lib/domain.ts` centraliza as listas de opções — **adianta parte da Fase 3.4** (a consolidação de labels/cores dos charts continua pendente lá)
- [x] 11 testes do hook, e os testes de filtro do `DashboardPage` seguem passando sem alteração

### 2.7 Non-null assertion nos charts ✅

- [x] `SentimentChart` › `props.payload!.color` → optional chaining com fallback `gray.solid`

### 2.8 Validação de tamanho de arquivo ausente ✅

- [x] `isWithinSizeLimit` + `MAX_FILE_SIZE_BYTES` em `lib/files.ts`, aplicado em `pickFile`
- [x] O "max 10 MB" que a UI anunciava agora é de fato verificado antes do upload

## Fase 3 — Componentização ✅ concluída

Executada na ordem 3.4 → 3.3 → 3.2: a fonte de verdade do domínio primeiro, depois as abstrações
compartilhadas, e só então a quebra das páginas — cada passo já consumindo o anterior. Os 172 testes
da Fase 1 passaram sem uma linha alterada, que era exatamente o papel deles.

`DashboardPage` foi de 553 para 187 linhas; `FeedbackDetailPage`, de 491 para 178.

### 3.1 Duplicação literal ✅ concluída na Fase 1

- [x] **`bucketCounts`** — a mesma função está reescrita **6 vezes**: `DashboardPage:63`, `SentimentChart:508`, `UrgencyChart:650`, `FeatureAreaChart:928`, `ClassificationChart:1007`, `SourceMixChart:762` → extrair para `lib/buckets.ts`
- [x] **`errorMessage(error)`** — copiada byte a byte em `IngestPage:20`, `IngestBulkPage:22`, `IngestFilePage:26` → `lib/errors.ts`
- [x] **`formatDate`** — duplicada em `DashboardPage:76` (`Intl.DateTimeFormat`) e `FeedbackDetailPage:54` (`toLocaleString`), com formatos **divergentes** na mesma aplicação → `lib/format.ts`, formato único
- [x] **`type Props = { buckets: ...; isLoading: boolean }`** — repetido nos 5 charts → `StatBucket[]` em `lib/types.ts`

### 3.2 Quebrar as páginas grandes ✅

`DashboardPage` acumulava KPIs + filtros + tabela + paginação + diálogo em 553 linhas.

- [x] `<StatCard>` — os 4 cards de KPI viraram um componente com `accent`, `valueColor`, `borderColor` e `suffix`; `AnimatedCount` mudou junto, já que só existe para eles
- [x] `<SelectFilter label options value onChange>` — genérico em `T extends string`, com `formatOption` opcional para o caso do Source
- [x] `<FeedbackFilters>` — agrupa os 5 selects + botão de reset
- [x] `<FeedbackTable>` + `FeedbackTableRow` em arquivo próprio; a contagem de colunas do skeleton e do `colSpan` agora deriva da lista de headers, em vez de três `8` soltos
- [x] `<Pagination>`

`FeedbackDetailPage` tinha 491 linhas; o grupo Reclassify + CopyID ocupava ~100 linhas de props de layout inline.

- [x] `<CopyableId>` — leva junto o estado `copied`, o timer e o tratamento de erro do clipboard
- [x] `<ClassificationCard>` — com `sentimentPalette`/`urgencyPalette`/`formatClassificationRaw`
- [x] `<SourceMetadataCard>` — o par label/valor repetido virou um `<Row>` local

### 3.3 Abstrações compartilhadas ✅

- [x] `<ChartCard title description isLoading skeletonHeight>` — os 5 charts repetiam `Card.Root variant="outline" h="full" transition _hover` + header + branch de `Skeleton`. O `bodyProps` cobre a única diferença real entre eles (como o corpo centraliza o conteúdo)
- [x] `components/icons/` — `TrashIcon`, `CopyIcon`, `CheckIcon`, `ReclassifyIcon`, `SunIcon`, `MoonIcon` sobre um `<Glyph>` comum; `InlineGlyph` para os que ficam ao lado de texto
- [x] `<StatusBadge>` — `variant="subtle" textTransform="uppercase" fontSize="xs" letterSpacing="wide"` aparecia 5 vezes
- [x] `<ErrorAlert title description>` — usado no Dashboard e nos 3 estados de erro do Detail; `preserveWhitespace` para o payload de erro da API
- [x] `<PageHeader>` + `<FormCard>` — as 3 páginas de ingest repetiam Heading + Box bordado. `description`/`footnote` são `ReactNode` porque duas delas embutem links e `<code>`

### 3.4 Fonte única de verdade para o domínio ✅

As constantes viviam em dois lugares desalinhados: `SENTIMENT_OPTIONS`/`FEATURE_AREA_OPTIONS`/`URGENCY_OPTIONS` no `DashboardPage`, e `SENTIMENT_ORDER`+`SENTIMENT_LABELS`/`URGENCY_ORDER`/`FEATURE_ORDER` nos charts.

- [x] `lib/domain.ts` — um `DomainOption[]` por dimensão com `{ key, label, colorToken }`
- [x] As listas `*_OPTIONS` que os filtros e o `useFeedbackFilters` consomem passam a ser derivadas (`keysOf`), então não há como um valor existir no filtro e faltar no chart
- [x] Os 5 charts perderam seus `*_ORDER`/`*_LABELS`/`*_COLORS` locais; o `formatLabel` do `FeatureAreaChart` e o `ChartSourceKey` do `SourceMixChart` deixaram de ser necessários

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
- [x] `pnpm build` passa nos dois apps
- [x] `pnpm lint` passa sem warnings novos
- [x] `pnpm test` roda e passa em `apps/api` (10) **e** `apps/web` (172)
- [x] Cobertura do `apps/web` acima do piso de 60% em `lib/` (95,9%) e `hooks/` (100%)
- [x] Nenhum arquivo de página acima de ~250 linhas (o maior é `IngestFilePage` com 215)
