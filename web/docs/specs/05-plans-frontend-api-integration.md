# SPEC 05 — Integração de Plans do frontend com a API

Status: especificação para implementação futura. Esta entrega altera somente documentação.
Data: 2026-09-03.

## 1. Objetivo, princípios e limites

Integrar o CRUD e os fluxos operacionais existentes de Plans às seis operações HTTP
implementadas na API: consulta por intervalo, criação, edição geral, alteração de horário,
exclusão e confirmação como trabalho realizado. React Query passa a ser a fonte dos Plans
reais na área operacional; mocks e Jotai deixam de representar persistência de Plans.

A API implementada é a fonte de verdade. Um Task define um resultado, um Plan reserva tempo
pretendido e um Work Log registra trabalho efetivamente realizado. `taskId` e `categoryId`
são vínculos opcionais. Confirmar um Plan usa exclusivamente a operação composta da API; o
cliente não cria um Work Log separado e não simula uma transação com múltiplas requests.

Incluído na implementação futura:

- seis calls tipadas em `web/src/api`, modelos HTTP e de apresentação, schemas, mappers,
  query keys, queries, mutations, locks e tratamento de erros de Plans;
- consulta do intervalo realmente exibido nas visões de dia, semana e mês;
- conversão explícita entre instantes ISO e horários civis no timezone IANA configurado;
- criação, edição, exclusão, drag, resize, filtros e confirmação já existentes;
- ajustes pequenos e reutilizáveis no calendário compartilhado para expor seu intervalo;
- adaptações mínimas dos quatro consumidores atuais de `usePlans` e do ciclo de sessão.

Fora do escopo:

- alterações em `api/`, controllers, DTOs, casos de uso, repositórios, schema ou migrations;
- CRUD HTTP de Work Logs ou tentativa de reproduzir no cliente o efeito de confirmação;
- integração de Dashboard, Reports ou outros protótipos administrativos;
- redesign do calendário, recorrência, projetos, subtarefas, novas regras de duração,
  conflitos entre Plans ou restrições de passado/futuro;
- uma infraestrutura ampla de testes ou correções gerais fora dos arquivos afetados.

Preservar o inglês da interface, o comportamento responsivo, os componentes principais e as
alternativas acessíveis por formulário. Os caminhos citados são relativos à raiz do
repositório.

### 1.1. Ressalva obrigatória sobre atomicidade

O pedido parte da premissa de que `record-as-done` é atômico, mas o código atual não cumpre
essa garantia: `ConfirmPlanUseCase` chama `workLogsRepository.create(workLog)` e depois
`plansRepository.save(plan)` em dois `awaits`, sem transação. `api/STATUS.md` registra essa
pendência e a ausência de teste de rollback.

Isso não muda o desenho do frontend: ele deve fazer um único
`POST /api/plans/:planId/record-as-done` e tratar o `204` como aceite da operação composta.
Não deve fazer POST de Work Log, PATCH adicional do Plan ou compensação local. A garantia
transacional de produção continua sendo uma pendência explícita do backend, fora desta SPEC;
a implementação frontend não pode declarar que corrigiu essa lacuna.

## 2. Base analisada e incompatibilidades atuais

Foram conferidos os seis controllers de Plans, seus DTOs, `PlanPresenter`, `PlanDto`,
`CreatedPlanDto`, entidade e `PlanData`, os cinco casos de uso, portas e implementações Prisma,
schema, testes unitários/E2E, `api/STATUS.md` e `api/docs/specs/04-plans-http-controllers.md`.
No frontend, foram analisados Ky, React Query, ciclo de sessão, integrações de Categories e
Tasks, formulário e store de Plans, calendário compartilhado, filtros, DateTimePicker,
preferência de timezone, página de Plans, Work Logs locais e Dashboard.

| Situação atual | Resultado exigido |
| --- | --- |
| `plans-store.ts` inicia `PLANS_MOCK` num atom Jotai | queries por sessão e intervalo são a única fonte operacional de Plans reais |
| `IPlan` mistura modelo visual e persistência local | DTO HTTP, Plan lido e item projetado no calendário ficam explicitamente separados |
| create gera `crypto.randomUUID()` | o ID vem somente do `201` da API |
| datas usam `Date`, `parseISO` e `toISOString()` no timezone do navegador | helpers centrais interpretam e exibem pelo timezone IANA armazenado |
| calendário recebe toda a coleção e filtra em memória | GET recebe apenas o intervalo visível e os filtros remotos aplicados |
| semana usa 5 ou 7 dias conforme `Show weekends` | a query sempre cobre segunda a segunda; a preferência muda só a apresentação |
| mês filtra implicitamente pelo mês principal | a query cobre todas as 35/42 células efetivamente renderizadas |
| filtros de Task/Category são aplicados com `.filter()` local | IDs repetidos e flags `without*` são enviados ao servidor |
| create/edit/delete exibem sucesso e fecham imediatamente | mutation é aguardada; erro preserva o rascunho/superfície e permite nova tentativa |
| drag/resize substituem o Plan local imediatamente | uma única mutation é enviada no fim do gesto válido, com preview e rollback visual |
| confirmação valida Work Logs mockados e chama `addWorkLog` | uma única call composta é feita; nenhum Work Log local é fabricado |
| confirmação escreve `new Date().toISOString()` em `confirmedAt` | o timestamp continua sendo definido e posteriormente lido do backend |
| relação e cor são resolvidas só nas fontes globais | listagem usa os resumos `task` e `category` retornados com cada Plan |
| timezone é estado privado do picker e `localStorage` bruto | uma preferência observável e helpers únicos atendem picker, calendário e requests |

O backend permite Plans futuros, passados, sobrepostos e atravessando meia-noite. Na criação e
edição, a única regra temporal de domínio é `endsAt > startsAt`. Não copiar para Plans as
regras de Work Logs sobre mesmo dia, futuro ou sobreposição.

## 3. Contratos HTTP reais

Todas as rotas são protegidas pela sessão HTTP-only. O cliente compartilhado `@/lib/ky` já
usa `credentials: 'include'`; não enviar `userId`, token armazenado, `Authorization` manual ou
qualquer campo não aceito pelos DTOs. Datas declaradas como `Date` no Nest são strings ISO
8601 no JSON.

### 3.1. Inventário completo

| Operação | Método e rota | Entrada | Sucesso | Corpo de sucesso |
| --- | --- | --- | --- | --- |
| Listar | `GET /api/plans` | query obrigatória `from`, `to`; filtros opcionais | `200` | `{ data: PlanDto[] }` |
| Criar | `POST /api/plans` | `CreatePlanRequest` em JSON | `201` | `{ data: CreatedPlanDto }` |
| Editar | `PATCH /api/plans/:planId` | UUID no path; patch em JSON | `204` | nenhum |
| Alterar horário | `PATCH /api/plans/:planId/schedule` | UUID no path; datas em JSON | `204` | nenhum |
| Excluir | `DELETE /api/plans/:planId` | UUID no path; sem body | `204` | nenhum |
| Confirmar | `POST /api/plans/:planId/record-as-done` | UUID no path; `{ timeZone }` | `204` | nenhum |

As calls de `204` retornam `Promise<void>` e apenas aguardam Ky; nunca executam `.json()`.
Todas definem `retry: 0`. Somente leituras recebem `options?: { signal?: AbortSignal }` e
encaminham o signal do React Query.

### 3.2. Respostas JSON

Criar `features/plans/model/plan-api-types.ts` para tipos compartilhados. Requests e responses
permanecem exportados pelas calls correspondentes. A forma efetiva é:

```ts
type IsoDateTime = string

interface PlanTaskSummaryDto {
	id: string
	title: string
}

interface PlanCategorySummaryDto {
	id: string
	name: string
	color: string
}

interface PlanDto {
	id: string
	task: PlanTaskSummaryDto | null
	category: PlanCategorySummaryDto | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	confirmedAt: IsoDateTime | null
}

interface CreatedPlanDto {
	id: string
	taskId: string | null
	categoryId: string | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	confirmedAt: IsoDateTime | null
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

interface FetchPlansResponse {
	data: PlanDto[]
}

interface CreatePlanResponse {
	data: CreatedPlanDto
}
```

Há duas representações deliberadamente diferentes. O GET retorna resumos de Task e Category,
mas não retorna `taskId`, `categoryId`, `createdAt` nem `updatedAt`. O POST retorna IDs brutos e
metadados, mas não retorna resumos. Não alargar nenhum dos dois tipos nem fabricar campos para
igualá-los. No modelo lido, os IDs normais são derivados de `task?.id` e `category?.id`.

`category.color` é `string` no contrato publicado. O mapper deve aceitar a resposta sem cast
amplo e usar o fallback visual de não categorizado se receber uma cor fora do enum conhecido;
isso não transforma o Plan em “sem Category” nem altera o payload em cache.

### 3.3. Listagem e filtros

```ts
interface FetchPlansRequest {
	from: IsoDateTime
	to: IsoDateTime
	taskId?: string[]
	categoryId?: string[]
	withoutTask?: true
	withoutCategory?: true
}
```

`from` e `to` são obrigatórios e a API exige `from < to`. Serializar com
`URLSearchParams.append`, repetindo `taskId` e `categoryId` uma vez por valor. Não usar CSV,
`taskId[]`, JSON de arrays ou sentinelas de UI. Enviar `withoutTask=true` e
`withoutCategory=true` apenas quando selecionados; omitir flags falsas.

O DTO atual normaliza um valor ou vários em arrays. Ele não valida os IDs dos filtros como
UUIDs, mas o frontend deve enviar apenas UUIDs originados das fontes reais ou de um parâmetro
de URL localmente validado. Valores da mesma faceta são OR; as facetas são AND entre si:

```text
(taskId IN selecionados OR taskId IS NULL quando withoutTask)
AND
(categoryId IN selecionados OR categoryId IS NULL quando withoutCategory)
```

Sem seleção numa faceta, ela é omitida. `No task` e `No category` são traduzidos somente para
as flags e nunca enviados como IDs. Não reaplicar no cliente filtros de Task ou Category já
executados pelo servidor. Preservar a ordem recebida (`startsAt ASC`, desempate por `id ASC`).

O repositório usa exatamente a sobreposição semiaberta exigida:

```text
startsAt < to AND endsAt > from
```

Assim, um Plan que termina exatamente em `from` e um que começa exatamente em `to` ficam de
fora; Plans contidos, iniciados antes, terminados depois ou atravessando meia-noite entram.

### 3.4. Criação, edição, schedule, exclusão e confirmação

```ts
interface CreatePlanRequest {
	title: string
	description?: string
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	taskId?: string
	categoryId?: string
}

interface PlanIdRequest {
	planId: string
}

interface EditPlanRequest extends PlanIdRequest {
	title?: string
	description?: string | null
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
	taskId?: string | null
	categoryId?: string | null
}

interface EditPlanScheduleRequest extends PlanIdRequest {
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
}

type DeletePlanRequest = PlanIdRequest

interface ConfirmPlanRequest extends PlanIdRequest {
	timeZone: string
}
```

- `title` tem comprimento de 1 a 255; o backend não faz trim nem rejeita espaços.
- `description` tem no máximo 1000; no POST pode ser omitida, no PATCH pode ser `null`.
- POST não aceita `null` em Task, Category ou description; ausência representa “sem vínculo”.
- PATCH distingue ausência, que preserva, de `null`, que limpa relações/descrição.
- `startsAt` e `endsAt` são obrigatórios no POST e opcionais, nunca nulos, nos PATCHes.
- PATCH vazio é aceito pela API, mas a UI não envia request sem mudança efetiva.
- criação/edição com Task ou Category ausente ou de outra conta retorna o mesmo `404`.
- IDs ficam somente no path quando aplicável e devem ser interpolados com
  `encodeURIComponent` depois da validação UUID local.
- `timeZone` não pertence ao Plan e não é enviado em create, edit ou schedule. É obrigatório
  apenas na confirmação, porque ali a API valida o Work Log resultante.

Criar os arquivos e funções abaixo, um por operação:

| Arquivo em `web/src/api` | Função |
| --- | --- |
| `fetch-plans.ts` | `fetchPlans(request, options?)` |
| `create-plan.ts` | `createPlan(body)` |
| `edit-plan.ts` | `editPlan({ planId, ...body })` |
| `edit-plan-schedule.ts` | `editPlanSchedule({ planId, ...body })` |
| `delete-plan.ts` | `deletePlan({ planId })` |
| `confirm-plan.ts` | `confirmPlan({ planId, timeZone })` |

As calls só serializam e transportam. Não fazem mapping visual, toasts, invalidação, leitura
de `localStorage` ou tratamento de erro.

## 4. Timezone e representação temporal

### 4.1. Preferência única e observável

Extrair de `timezone-picker.tsx` a chave `task_manager.timezone`, validação IANA, fallback e
leitura/escrita para um módulo compartilhado, por exemplo
`features/calendar/lib/time-zone.ts`. Expor `useTimeZone()` por `useSyncExternalStore`,
notificando tanto mudanças na mesma aba por evento próprio quanto o evento `storage` de outras
abas. `TimezonePicker` passa a consumir essa fonte, sem manter uma cópia privada divergente.

Fallback: timezone IANA válido reportado pelo navegador; se indisponível/inválido, `UTC`.
Uma preferência armazenada inválida não gera request nem quebra a página. A preferência é de
apresentação e não é colocada no modelo persistido do Plan.

### 4.2. Helpers centrais e modelo visual

Manter os timestamps ISO crus no cache React Query. Definir separadamente:

```ts
interface Plan {
	id: string
	title: string
	description: string | null
	task: PlanTaskSummaryDto | null
	category: PlanCategorySummaryDto | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	confirmedAt: IsoDateTime | null
}

interface PlanCalendarItem extends ICalendarItem {
	plan: Plan
	// Strings civis sem offset, usadas somente pela geometria do calendário.
	startDate: string
	endDate: string
}
```

O mapper `toPlan` preserva o contrato lido; `toPlanCalendarItem(plan, timeZone)` projeta cada
instante para componentes civis no timezone escolhido. `startDate`/`endDate` projetados nunca
voltam diretamente para a API e não substituem `startsAt`/`endsAt`.

Centralizar, com nomes equivalentes, estas operações puras:

- `instantToCalendarDate(iso, timeZone)`: instante → `Date` de coordenadas civis para
  calendário e DateTimePicker;
- `instantToCalendarText(iso, timeZone)`: instante → string civil sem offset para
  `ICalendarItem` e `parseISO` interno;
- `calendarDateToInstant(date, timeZone, options)`: componentes civis escolhidos → instante;
- `calendarRangeToIso(range, timeZone, original?)`: valida/converte os dois limites;
- `getZonedToday(timeZone)` e formatação equivalente para indicadores de “hoje/agora”;
- `getVisibleCalendarRange(view, selectedDate)`: limites civis compartilhados da seção 5.

Não espalhar `Intl.DateTimeFormat`, offsets manuais ou `toISOString()` pelos componentes.
Adicionar `@js-temporal/polyfill` como dependência direta e encapsular seu uso no helper; não
depender de suporte nativo parcial nem importar `@date-fns/tz` apenas porque hoje aparece de
forma transitiva no lockfile. O restante da aplicação continua usando `Date`/date-fns nas
coordenadas visuais, mas nenhuma conversão entre horário civil e instante pode depender
implicitamente do timezone do navegador.

### 4.3. Horários inexistentes e ambíguos

Adotar uma política única, observável e testável:

- construir um `Temporal.PlainDateTime` com os componentes civis e resolver as variantes
  `earlier` e `later`; se nenhuma reprojetar para os mesmos componentes, o horário é inexistente;
  se ambas reprojetarem e gerarem instantes diferentes, o horário é ambíguo;
- horário civil inexistente no salto de DST é inválido para formulário, drag ou resize; não
  enviar request e mostrar erro junto ao limite afetado;
- horário repetido no retorno de DST escolhe a ocorrência `earlier` por padrão e informa essa
  escolha como ajuda/aviso não técnico junto ao campo;
- ao editar um Plan já persistido, se o instante original for uma das ocorrências possíveis e
  o campo civil não mudou, preservar exatamente esse instante e omitir o timestamp do PATCH;
- helpers de início de dia usados em queries aplicam a semântica de início real do dia civil:
  ocorrência anterior em ambiguidade e primeiro instante válido se a meia-noite não existir.

Drag de um bloco inteiro preserva a duração absoluta `endsAt - startsAt`: resolver o novo
início civil e calcular o novo fim pelo mesmo número de milissegundos. Resize resolve somente
a borda alterada e valida o intervalo absoluto resultante. Isso evita que a duração mude
silenciosamente numa transição de offset. Não usar `23:59:59.999`, UTC fixo para limites civis
ou margens artificiais de dias.

Mudar o timezone remapeia a posição/texto dos mesmos instantes e recalcula a query do intervalo
civil selecionado. Não faz PATCH, não altera `startsAt`/`endsAt` persistidos, não fecha o Plan
nem converte os valores crus do cache.

## 5. Intervalo visível e integração com o calendário

### 5.1. Extensão compartilhada mínima

Adicionar a `features/calendar` uma única função estrutural
`getVisibleCalendarRange(view, selectedDate)` e este contrato compartilhado:

```ts
interface ICalendarVisibleRange extends ICalendarRange {
	view: TCalendarView
}

interface ICalendarProps<TItem extends ICalendarItem> {
	// demais props atuais
	onVisibleRangeChange?: (range: ICalendarVisibleRange) => void
	itemsRange?: ICalendarRange | null
}
```

`CalendarContent` calcula o intervalo sincronicamente a partir do contexto e o publica por
`useLayoutEffect` quando `view` ou `selectedDate` mudar. `PlansCalendar` guarda esse valor,
converte-o para o request e devolve em `itemsRange` o intervalo civil ao qual os itens da query
pertencem. Se `itemsRange` não coincidir exatamente com o intervalo atual, `CalendarBody`
recebe array vazio; o estado de loading/erro da feature continua visível acima do body. Isso
impede um frame pintado com dados antigos sem tornar o Calendar responsável por React Query.

O cálculo e o efeito nunca dependem de `showWeekends`. A infraestrutura serve igualmente a
Plans e Work Logs; Plans apenas converte os limites civis para ISO no timezone escolhido. A
extensão não move regras de transporte ou domínio para o calendário genérico.

### 5.2. Limites por visão

- Dia: `[início do dia selecionado, início do dia seguinte)` no timezone configurado.
- Semana: `[segunda-feira 00:00, segunda-feira seguinte 00:00)`, sempre sete dias civis.
  `Show weekends` oculta/exibe colunas apenas; não muda limites, key, cancela ou refaz GET.
- Mês: usar `getCalendarCells(selectedDate)` como fonte única. `from` é o início da primeira
  célula renderizada; `to`, o início do dia após a última célula. Isso cobre as células dos
  meses anterior e seguinte e preserva grids de 35 ou 42 dias.

Converter cada limite de forma independente para ISO. Em dias de DST, a diferença absoluta
entre dois inícios pode ser 23 ou 25 horas; não forçar 24 horas nem sete vezes 24 horas.

Setas, seleção no mini calendário, clique de uma célula/dia e troca dia/semana/mês alteram o
contexto, recalculam os limites e consultam a chave correspondente. Retornar a um intervalo
visitado reutiliza seu cache e revalida conforme a política da query.

### 5.3. Dados antigos e estados de leitura

Não usar `placeholderData: keepPreviousData` entre chaves. Enquanto a nova chave não tiver
dados, não renderizar Plans do intervalo anterior como se pertencessem ao atual. Distinguir:

- loading inicial: indicador `role="status"`, sem empty state;
- sucesso vazio: mensagem de calendário vazio e criação ainda disponível;
- sucesso com dados: calendário normal;
- erro inicial: Alert geral com `Try again`, sem vazio falso;
- erro de refetch com cache da mesma chave: manter itens, exibir Alert e retry do GET;
- fetching com cache da mesma chave: manter itens com indicação discreta, sem bloquear leitura.

Somente o botão de retry da leitura chama `query.refetch()`. Falha de refetch posterior a uma
mutation não repete a mutation nem altera o toast de sucesso já emitido. Abort causado por
troca de intervalo/filtro, desmontagem ou sessão não vira Alert ou toast.

## 6. Query keys, queries, cache e sessão

### 6.1. Chaves e normalização

```ts
type PlanMutationOperation = 'create' | 'edit' | 'delete' | 'schedule' | 'confirm'

const planKeys = {
	all: ['plans'] as const,
	lists: (generation: number) => ['plans', generation, 'list'] as const,
	list: (generation: number, request: NormalizedFetchPlansRequest) =>
		['plans', generation, 'list', request] as const,
	mutation: (generation: number, operation: PlanMutationOperation) =>
		['plans', generation, 'mutation', operation] as const,
}
```

`NormalizedFetchPlansRequest` contém `from` e `to` ISO, IDs UUID únicos em ordem canônica e
somente flags verdadeiras. Assim, a ordem dos cliques não cria caches equivalentes distintos.
Todos os parâmetros remotos que mudam o resultado estão na key. `showWeekends`, formato de
hora, estado de diálogo, drafts e objetos `Date` não estão. O timezone não precisa duplicar a
key: ele já altera `from`/`to`; a projeção visual é derivada do DTO cru com `timeZone` fora do
cache. Se dois timezones produzirem os mesmos limites, podem compartilhar a resposta crua sem
compartilhar a projeção.

`usePlansQuery(request, enabled)` segue `useTasksQuery`: captura `generation`, passa `signal`,
usa `retry: false`, `networkMode: 'always'`, consulta somente fora de `busy/ended` e chama
`revalidateSession(error)` apenas se a request não foi abortada e a geração continua atual.
O cache guarda `FetchPlansResponse`; mapping por timezone ocorre em `select`/`useMemo` sem
reescrever o payload.

### 6.2. Mutations, bloqueios e reconciliação

Criar hooks `useCreatePlan`, `useEditPlan`, `useDeletePlan`, `useEditPlanSchedule` e
`useConfirmPlan`, seguindo o envelope de sessão de Tasks. Cada mutation captura junto a
geração e a função `current`, usa `retry: false`, `gcTime: 0`, e possui lock por `planId`;
create usa lock por instância. Enquanto um Plan tem escrita pendente, edição, exclusão,
confirmação, drag e resize desse mesmo ID ficam bloqueados. Outros Plans permanecem utilizáveis.

Decisão sobre otimismo: não alterar o cache antes da confirmação HTTP. A forma diferente das
respostas de GET/POST, os filtros por múltiplos intervalos e a ausência de payload nos `204`
tornariam rollback global suscetível a sobrescrever mudanças concorrentes. Em vez disso:

- create: após `201`, invalidar listas da geração; não inserir `CreatedPlanDto` como `PlanDto`;
- edit: após `204`, invalidar listas; diálogo fecha somente após aceite;
- delete: após `204`, remover o ID das listas em cache e invalidá-las;
- schedule: manter preview local durante a request; após `204`, aplicar os timestamps enviados
  às ocorrências conhecidas, removendo da chave atual se já não houver interseção, e invalidar
  todas as listas; em falha, descartar preview e mostrar o item original;
- confirm: após `204`, invalidar listas de Plans e o prefixo reservado de Work Logs; não
  inventar `confirmedAt` nem inserir Work Log local.

Atualizações posteriores ao sucesso são reconciliações confirmadas, não otimismo. A alteração
de schedule por ID é determinística e não sobrescreve outros Plans. Inserção em intervalos
cacheados onde o Plan antes não existia fica para o refetch, porque o endpoint não retorna o
`PlanDto` final. Uma confirmação aceita mantém o ID localmente bloqueado contra repetição até
uma leitura atualizada mostrar `confirmedAt` ou o alvo sair da tela; esse marcador efêmero é
por geração e não finge ser dado persistido.

Um `404` em edit/schedule/delete/confirm marca o alvo indisponível, remove sua ocorrência das
listas conhecidas e invalida as listas, mas não encerra uma sessão válida. `401` usa a
revalidação existente. Não usar `404` de Plan como sinal de logout.

### 6.3. Encerramento e troca de sessão

Estender `clearIdentity` em `use-end-session.ts` para cancelar e remover `planKeys.all`, além de
remover mutations com esse prefixo. A geração faz parte de toda key e é capturada antes de
efeitos. Antes de tocar cache, estado local, diálogo ou toast, verificar `current()`.

No logout e antes de completar um login de outra conta:

1. incrementar a geração conforme o ciclo existente;
2. cancelar queries de Plans;
3. remover queries e mutations de Plans;
4. liberar locks e marcadores efêmeros da geração anterior;
5. ignorar responses tardias, inclusive sucesso de mutation e falha de refetch.

Nenhum Plan, filtro derivado de vínculo, toast, preview ou confirmação da conta anterior pode
chegar à nova sessão. Preferências locais de calendário/timezone podem sobreviver, pois não são
dados de conta; dados e mutations não.

## 7. Formulários, validação e erros

### 7.1. Schema e mapping do formulário

Manter React Hook Form, Zod e `zodResolver`, mas mover submit, diff, pending e erro geral para
um `usePlanForm`, como `useTaskForm`/`useCategoryForm`. O schema reflete apenas o contrato:

```ts
const planFormSchema = z.object({
	title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
	description: z.string().max(1000, 'Description must be at most 1000 characters'),
	startDate: z.date('Start date is required'),
	endDate: z.date('End date is required'),
	taskId: z.uuid().nullable(),
	categoryId: z.uuid().nullable(),
})
```

Adicionar a validação refinada de conversão timezone-aware e `endsAt > startsAt`. Não fazer
trim obrigatório do título, impor duração mínima/máxima, mesmo dia, ausência de sobreposição,
data futura/passada ou obrigatoriedade de Task/Category. A limitação visual atual de resize em
slots de 15 minutos pode continuar como ergonomia do gesto, mas não vira regra do formulário
ou da API.

No create, omitir relações nulas e descrição vazia. No edit, comparar com um snapshot inicial:
campo omitido preserva; relação removida e descrição existente limpa enviam `null`; timestamps
só são enviados se o valor civil correspondente realmente mudou. O submit geral usa um único
PATCH `/api/plans/:planId`, não combina PATCH geral com `/schedule`.

Valores do DateTimePicker são coordenadas civis no timezone escolhido. A conversão para ISO
acontece somente no mapper de request. Alterar timezone com o diálogo aberto deve reprojetar o
snapshot persistido e cada campo válido do draft pelo mesmo instante: converter com o timezone
anterior e exibir os componentes equivalentes no novo timezone. Não reinterpretar o mesmo
objeto `Date` sob outro fuso nem apagar o draft. Se um campo já estiver num horário DST
inválido e não puder ser convertido, preservar o valor, mostrar erro e exigir correção antes do
submit. Bloquear a troca de timezone dentro do diálogo não é aceitável.

### 7.2. Mensagens locais e ARIA

Erros Zod ficam abaixo do campo correspondente, com ID estável, `aria-invalid` e
`aria-describedby`. O padrão explícito é:

```tsx
{errors.title && (
	<p id="title-error" className="text-sm text-destructive">
		{errors.title.message}
	</p>
)}
```

Aplicar o mesmo vínculo a description, Task, Category, início e fim, inclusive horário DST
inexistente. Aviso de horário ambíguo também deve ser referenciado pelo controle, sem usar
`role="alert"` quando não impedir o submit.

Submit válido aguarda `mutateAsync`. Enquanto pendente, mostrar `Creating…`/`Saving…`,
desabilitar campos e ações incompatíveis, impedir Enter/cliques repetidos, Escape e fechamento
externo. Sucesso fecha e emite um único toast. Falha mantém rascunho e diálogo aberto. `404` em
edição torna o alvo indisponível e impede reenvio até uma seleção válida.

### 7.3. Erros HTTP separados

Nunca inserir erro HTTP em `formState.errors`. Exibir falha da API num Alert geral da
superfície, preservando os valores:

```tsx
{error && (
	<Alert variant="destructive">
		<AlertDescription>{error}</AlertDescription>
	</Alert>
)}
```

Criar `getPlanError(error, operation)` com leitura defensiva de status, sem expor stack, JSON,
mensagens internas ou corpo bruto. Formatos observados incluem o erro Nest
`{ statusCode, message, error }` e a validação Zod `{ message: 'Data validation failed',
errors: ... }`.

| Falha | Comportamento seguro |
| --- | --- |
| rede/sem resposta | “Unable to connect. Check your connection and try again.” |
| `400` de listagem | informar intervalo/filtros inválidos e oferecer reset/retry do GET |
| `400` de create/edit/schedule | Alert de salvamento/horário; erros locais continuam separados |
| `400` de confirmação | explicar que o Plan não pôde ser registrado (timezone, mesmo dia, futuro ou conflito podem ser a causa), sem validar por mocks |
| `401` | revalidar sessão; encerrar somente se perfil também confirmar expiração |
| `404` de Plan | alvo indisponível; reconciliar lista, preservar sessão e impedir nova escrita |
| `404` no create | informar que a Task/Category selecionada não está disponível e preservar o rascunho |
| `404` no edit | a API não distingue Plan ausente de relação ausente; informar que o Plan ou vínculo selecionado não está disponível, invalidar a lista e preservar o rascunho |
| `409` de confirmação | informar que o Plan já foi registrado, bloquear repetição e refazer apenas o GET |
| `5xx` | “The service is unavailable. Please try again.” |
| aborto intencional | nenhum Alert ou toast |

Não usar mensagens do backend diretamente como texto público. Em particular, confirmação pode
falhar por Work Log sobreposto sem que esta entrega tenha a coleção real de Work Logs para
explicar qual registro conflita.

## 8. Comportamento das interações

### 8.1. Filtros e relações opcionais

`PlansCalendar` mantém os filtros aplicados de Task e Category, mas o request é construído com
IDs/flags e o resultado não sofre segundo `.filter()`. Selecionar vários valores preserva OR
dentro da faceta; combinar as duas facetas preserva AND. Limpar uma faceta remove seus params.

Tasks e Categories continuam vindo das fontes reais já integradas. Seus estados de loading e
erro aparecem junto aos filtros/seletores, sem converter falha em “nenhuma opção”. `No task` e
`No category` continuam disponíveis mesmo se o respectivo módulo falhar. Um Plan recebido pode
ser criado/editado sem vínculos e o calendário continua funcional quando ambas as fontes estão
indisponíveis.

Para renderizar um Plan existente, preferir `plan.task.title` e `plan.category` retornados pelo
GET. Isso mantém label e cor disponíveis sem depender da consulta global. Os seletores usam
`TaskCombobox` remoto e `CategoryCombobox`; loading/erro não limpa a seleção atual. Uma relação
que desapareceu entre leitura e submit é tratada pelo `404`, não apagada silenciosamente.

O parâmetro `?task=` recebido da página Tasks é aplicado quando for UUID válido, sem esperar a
coleção completa de Tasks e sem descartar o filtro por loading/erro. Valor inválido é ignorado
sem GET inválido. A opção selecionada pode ser resolvida pelo resumo do Plan/cache e pela
infraestrutura já existente de Task options/details.

### 8.2. Criação, edição e exclusão

- criar por slot, botão ou comando usa o intervalo civil oferecido pelo calendário; não gera ID;
- submit de create envia uma call e só fecha após `201`; o novo Plan aparece se interceptar o
  intervalo e satisfizer filtros, após reconciliação/refetch;
- edit envia somente diferenças num único PATCH geral; nenhum request quando não há mudança;
- excluir exige a confirmação já existente ou uma confirmação mínima equivalente, envia um
  DELETE, bloqueia repetição e só remove/fecha após `204`;
- falha deixa o diálogo aberto com Alert; sucesso em mutation seguido de falha de GET não
  reabre o diálogo nem oferece repetir a escrita.

### 8.3. Drag e resize

Enviar `/schedule` somente no `pointerup/drop` de um gesto válido e somente se o instante final
for diferente. Movimento preserva duração absoluta; resize envia somente a borda alterada
quando possível. Soltar na origem, fora de alvo, cancelar ou produzir horário inexistente não
chama a API.

O preview visual fica em estado efêmero por Plan enquanto a mutation aguarda. Ações concorrentes
no mesmo Plan ficam indisponíveis e há indicação de pending. Em falha, remover o preview,
restaurar a posição/tamanho anterior, liberar drag/resize e mostrar Alert contextual. Em
sucesso, reconciliar após o `204`; se o novo intervalo não interceptar a consulta atual, o Plan
desaparece somente então. Navegação durante a mutation não permite que a conclusão escreva na
sessão ou no intervalo errado.

Os handles de resize por ponteiro não são a única forma de alterar horário: o diálogo com
campos Start/End permanece navegável por teclado e disponível em touch/mobile. O item continua
abrindo por botão focável e mantém foco visível e labels de ações icon-only.

### 8.4. Confirmação como Work Log

Remover de `PlansPage` o uso de `useWorkLogs`, `validateRange`, `createWorkLog` e `addWorkLog`.
O botão chama apenas `confirmPlan({ planId, timeZone })`. O frontend pode desabilitar Plans já
confirmados e aqueles cujo fim absoluto ainda é futuro como orientação, mas a API continua
autoritativa para mesmo dia no timezone, futuro, sobreposição e corrida concorrente.

Após `204`, mostrar uma única confirmação, fechar o diálogo e invalidar Plans. Não criar Work
Log no atom atual, não gerar ID e não definir `confirmedAt` localmente. Como o endpoint não
retorna o Work Log, não existe objeto exato para inserir. Quando Work Logs tiver query/cache
real, invalidar seu prefixo fará o registro aparecer por leitura; nesta entrega, a página ainda
mockada de Work Logs não recebe um registro fictício.

`409` significa que outra ação já confirmou o Plan: marcar indisponível para repetição,
invalidar a leitura e exibir mensagem segura. `400` mantém o Plan não confirmado visualmente e
explica que não foi possível registrá-lo. Nenhuma falha dispara uma segunda chamada.

## 9. Consumidores atuais de `usePlans`

A busca encontrou exatamente quatro consumidores diretos; todos devem ser tratados:

| Consumidor atual | Adaptação mínima |
| --- | --- |
| `app/pages/registers/plans/index.tsx` | substituir CRUD/store e ponte local de Work Logs pela query por intervalo e cinco mutations |
| `app/pages/analytics/dashboard/index.tsx` | deixar de importar `usePlans`; manter o Dashboard fora da integração usando fixture própria/imutável explicitamente marcada como protótipo |
| `app/pages/settings/hooks/use-delete-category-dialog.ts` | remover `clearPlanCategory`; após DELETE de Category aceito, invalidar `planKeys.all` da geração atual |
| `app/pages/registers/tasks/components/delete-task-dialog.tsx` | remover `clearPlanTask`; após DELETE de Task aceito, invalidar `planKeys.all` da geração atual |

`plans-store.ts` e seu atom deixam de existir como fonte operacional. `PLANS_MOCK` pode
permanecer somente como fixture importada diretamente por Dashboard ou outros protótipos
explicitamente fora do escopo, sem mutações compartilhadas e sem fallback para falha da API.
Não criar um novo `usePlans()` sem intervalo para esconder que o GET exige `from` e `to`.

As exclusões de Task/Category mantêm Plans no banco e limpam relações via `ON DELETE SET NULL`.
O cliente não envia PATCH em Plans para executar essa regra. A invalidação apenas busca o
resultado persistido. A ponte local de Work Logs permanece até a integração própria daquele
módulo, mas não condiciona ou contamina a fonte real de Plans.

## 10. Arquivos e responsabilidades previstos

| Área | Responsabilidade |
| --- | --- |
| `src/api/fetch-plans.ts`, `create-plan.ts`, `edit-plan.ts`, `edit-plan-schedule.ts`, `delete-plan.ts`, `confirm-plan.ts` | seis contratos Ky, signal no GET e nenhum JSON em `204` |
| `features/plans/model/plan-api-types.ts` | DTOs JSON e aliases de timestamp |
| `plan-types.ts`, `plan-mappers.ts`, `plan-schema.ts` | modelo lido, projeção visual, form e bodies HTTP |
| `plan-query-keys.ts`, `plan-cache.ts`, `plan-errors.ts` | normalização, reconciliação confirmada e mensagens seguras |
| `hooks/use-plans-query.ts` | leitura por intervalo/filtros/sessão e mapping timezone-aware |
| `hooks/use-plan-mutations.ts`, `use-plan-pending.ts` | cinco mutations, locks por ID e efeitos protegidos por geração |
| `hooks/use-plan-form.ts` | RHF/Zod, snapshot, diff, conversão, pending e Alert geral |
| `features/calendar/lib/date.ts` e tipos/provider mínimos | intervalo estrutural de dia/semana/grid mensal e sua exposição |
| `features/calendar/lib/time-zone.ts` | preferência IANA, projeção, conversão e DST centralizados |
| `plans-calendar.tsx`, `plan-dialog.tsx`, filtros e página | orquestração e estados visuais, sem calls diretas nos componentes |
| `use-end-session.ts` | cancelamento/remoção de cache e mutations de Plans |
| consumidores da seção 9 | remoção do store e invalidação de relações após deletes reais |

Não colocar regras de Plan em `components/ui`, não criar repositório frontend genérico e não
duplicar por feature a lógica do grid mensal. `DateTimePicker` pode receber props mínimas de
descrição/aviso/disabled; não reformulá-lo visualmente.

## 11. Critérios de aceite da implementação futura

1. As seis calls correspondem exatamente a método, rota, path, query/body, status e payload da
   seção 3; GET encaminha `AbortSignal` e nenhum `204` executa `.json()`.
2. Nenhuma call envia `userId`, token, cookie legível, `timeZone` fora de confirmação ou campo
   ausente dos DTOs reais.
3. DTOs de GET e POST permanecem distintos; datas JSON são strings e o modelo do calendário
   não substitui os timestamps persistidos.
4. Dia consulta `[início civil, início do dia seguinte)` no timezone configurado.
5. Semana sempre consulta segunda 00:00 até a segunda seguinte 00:00, cobrindo sete dias.
6. Ocultar ou mostrar fins de semana não muda query key, não cancela e não gera novo GET.
7. Mês consulta da primeira célula à manhã posterior à última célula do grid renderizado,
   inclusive dias visíveis dos meses adjacentes e grids de 35/42 células.
8. Plans com `startsAt < to AND endsAt > from` aparecem; os que apenas tocam `from`/`to` nas
   bordas corretas ficam fora segundo a semântica semiaberta.
9. Navegação rápida cancela requests obsoletos; resposta antiga não aparece no intervalo novo,
   não sobrescreve cache incorreto e não produz erro por aborto.
10. Voltar a intervalo visitado reaproveita cache; loading inicial, vazio, dados, erro inicial,
    fetching e erro de refetch com cache são visualmente distintos.
11. Retry disponível repete somente o GET; refetch falho depois de uma escrita não duplica a
    mutation nem seu toast.
12. Query keys contêm geração, `from`, `to` e filtros normalizados; não contêm `showWeekends`,
    formato de hora, drafts ou ordem dos cliques.
13. Filtros serializam IDs repetidos e `withoutTask/withoutCategory=true`; OR é preservado
    dentro da faceta e AND entre facetas, sem segundo filtro local.
14. Tasks/Categories em loading ou erro não impedem criar/editar Plan sem vínculo; seletores
    preservam seleção e oferecem “No task”/“No category”.
15. Resumos do GET fornecem título/cor dos vínculos; cor desconhecida usa fallback visual sem
    apagar a Category nem quebrar a tela.
16. Create usa ID/resposta do servidor, uma request, aguarda `201` e não insere
    `CreatedPlanDto` como se fosse `PlanDto`.
17. Edit envia um único PATCH geral com apenas diferenças; omissão preserva, `null` limpa e
    submit sem mudanças gera zero requests.
18. Title 1–255, description até 1000, UUIDs opcionais e `endsAt > startsAt` são validados com
    RHF/Zod; não são inventadas regras de duração, futuro, mesmo dia ou sobreposição.
19. Horário escolhido é interpretado no timezone configurado e o timestamp enviado representa
    esse horário mesmo quando o timezone do navegador é diferente.
20. Instantes recebidos são exibidos no timezone configurado; mudar timezone reprojeta UI e
    intervalo, mas não envia PATCH nem altera os instantes persistidos.
21. Horário DST inexistente impede request com erro associado ao campo; horário ambíguo segue a
    ocorrência anterior documentada, preservando o instante original quando não houve edição.
22. Limites civis em DST podem ter 23/25 horas e não usam `23:59:59.999`, UTC civil fixo ou
    margens artificiais.
23. Drag/drop envia um PATCH `/schedule` somente no fim de gesto válido e com mudança efetiva;
    movimento preserva duração absoluta.
24. Resize envia somente ao finalizar, altera a borda correta, valida DST/ordem e mantém a
    alternativa acessível Start/End no formulário.
25. Enquanto uma mutation está em voo, ações concorrentes do mesmo Plan ficam bloqueadas; uma
    falha restaura preview, libera interação e mostra Alert.
26. Um Plan movido para fora do intervalo atual só desaparece após `204` e reconciliação; não é
    perdido antecipadamente nem reinserido por resposta obsoleta.
27. Delete cancelado gera zero requests; confirmado envia um DELETE; falha preserva alvo e
    sucesso remove-o somente depois de `204`.
28. Confirmar envia exatamente um POST com o timezone IANA atual; não chama API de Work Logs,
    não adiciona atom, não inventa ID nem `confirmedAt`.
29. Confirmação trata `400`, `404` e `409` separadamente, bloqueia duplicidade e invalida Plan;
    a limitação transacional atual do backend permanece registrada, não ocultada.
30. Erros locais aparecem abaixo do campo e associados por ARIA; erros HTTP ficam em Alert
    geral, nunca em `formState.errors`, e preservam o rascunho.
31. Rede, `400`, `401`, `404`, `409`, `5xx` e cancelamento intencional produzem os comportamentos
    seguros definidos; mensagens técnicas, stack e JSON bruto nunca são exibidos.
32. `404` de Plan não encerra sessão válida; `401` reutiliza a revalidação existente sem loop.
33. Create/edit/delete/schedule/confirm bem-sucedidos e refetch falho não oferecem repetir a
    escrita; apenas a leitura fica em erro recuperável.
34. Os quatro consumidores da seção 9 são adaptados; nenhum consumidor operacional lê ou
    modifica um atom de Plans e nenhum hook sem intervalo mascara o contrato do GET.
35. Excluir Task/Category não dispara PATCH de Plan; após sucesso, queries de Plans são
    invalidadas e o backend retorna o vínculo nulo.
36. Logout seguido de login em outra conta cancela/remove queries, mutations, previews e locks;
    nenhum dado, toast ou efeito da sessão anterior sobrevive.
37. Teclado, foco visível, mobile/touch, labels icon-only e descrições ARIA continuam usáveis;
    drag e resize nunca são a única forma de editar horário.
38. O diff fica no escopo definido, sem backend, redesign, Work Logs HTTP, Dashboard real,
    Reports, recorrência, projetos, subtarefas ou correções gerais.

## 12. Verificação futura

### 12.1. Verificação estática

Executar a partir da raiz e registrar cada resultado separadamente:

```bash
pnpm --dir web run typecheck
pnpm --dir web exec tsc --noEmit -p tsconfig.app.json
pnpm --dir web run build
git diff --check
```

Executar também o check do Biome limitado aos arquivos alterados, conforme a configuração do
repositório. Diagnósticos preexistentes e novos devem ser listados separadamente; não corrigir
arquivos fora do escopo para obter uma saída limpa. A compilação explícita do projeto React e
o build são ambos obrigatórios, mesmo que `typecheck` pareça equivalente.

### 12.2. Validação manual com API autenticada

Iniciar API e web, autenticar uma sessão real e inspecionar a aba Network:

- métodos, URLs, cookies, query params repetidos, `from`/`to`, bodies e ausência de parse em
  `204` nas seis operações;
- dia, semana com fins de semana ocultos/exibidos e mês com células adjacentes;
- timezone negativo (`America/Sao_Paulo` ou `America/New_York`) e positivo
  (`Asia/Tokyo` ou `Pacific/Auckland`) enquanto o navegador usa outro timezone;
- mudança de timezone sem alteração dos instantes persistidos;
- transição de DST com horário inexistente e repetido, além de dia de 23/25 horas;
- Plans contidos, começando antes, terminando depois, tocando bordas e atravessando meia-noite;
- Task/Category isolados, “sem vínculo” e combinações OR/AND das duas facetas;
- navegação rápida e throttling para confirmar cancelamento, ausência de dados antigos, cache,
  empty state, erro inicial, refetch falho e retry somente de leitura;
- create/edit/delete, falha de relation `404`, concorrência no mesmo ID, drag e resize válidos,
  sem mudança, rollback visual e movimento para fora do intervalo;
- confirmação válida, futura, atravessando dia no timezone, sobreposta, repetida (`409`) e sem
  qualquer segunda chamada de Work Logs;
- logout/login entre duas contas enquanto GET e mutation estão atrasados.

Não adicionar uma suíte ampla nova apenas para esta integração. Testes focais de helpers puros
de intervalo/timezone, normalização de query e reconciliação podem ser incluídos se a
infraestrutura de teste já disponível comportar isso sem expansão transversal.

## 13. Entrega desta task de documentação

Criar somente `web/docs/specs/05-plans-frontend-api-integration.md`, revisar sua
correspondência com os contratos locais e fazer um único commit contendo apenas a SPEC, com a
mensagem `docs(web): specify plans frontend API integration`. Não fazer push e não implementar
nenhum item desta especificação nesta task.
