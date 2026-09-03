# SPEC 04 — Integração de Tasks do frontend com a API

Status: proposta, aguardando plano de implementação.
Data: 2026-09-03.

## 1. Objetivo e limites

Integrar os fluxos existentes de Tasks às oito operações HTTP implementadas na API:
criação, listagem, edição, exclusão, detalhes, opções por cursor, alteração de datas
e alteração de status. Substituir a persistência simulada de Tasks por React Query,
com contratos tipados, formulários validados e feedback assíncrono consistente.
Esta entrega contém somente a especificação; a implementação terá um plano próprio.

A API implementada é a fonte de verdade. Task representa um resultado a alcançar,
Plan representa tempo planejado e Work Log representa trabalho realizado. Tasks
não têm categorias, projetos ou subtarefas. Nenhum vínculo é necessário para criar,
editar ou concluir uma Task; mudar seu status não cria Plan ou Work Log.

Incluído na implementação futura:

- Calls em `web/src/api`, modelos, schemas, conversões, query keys e hooks de Tasks.
- Página Tasks, lista, board, timeline, diálogos, detalhes e seletor de Tasks.
- Adaptação pontual dos consumidores existentes da fonte compartilhada de Tasks.
- Limpeza de cache no ciclo de sessão existente e compatibilidade das referências
  locais de Plans/Work Logs após excluir uma Task.

Fora do escopo:

- Qualquer alteração em `api/`, contratos HTTP, migrações ou testes do backend.
- Integração HTTP de Plans, Work Logs, Dashboard ou Reports.
- Refatoração de Identity, Categories, cliente HTTP global ou primitivas genéricas
  de interface; novas dependências e reformulação visual.
- Persistência de ordem manual de cards, operações em lote e novas regras de negócio.

Preservar o inglês da interface, os layouts e a navegação responsiva existentes.
Os caminhos citados são relativos à raiz do repositório.

## 2. Base analisada e diferenças que precisam ser resolvidas

Contratos verificados nos arquivos de Tasks em
`api/src/infra/http/task-manager/controllers`, respectivos `controllers/dto`,
`dtos` e `presenters`; nos helpers `parse-pagination-query.ts`,
`parse-sort-query.ts` e `parse-editable-date.ts`; na entidade `Task`, nos casos de
uso e em `PrismaTasksRepository`. Conferidos também os cenários E2E existentes,
`api/prisma/schema.prisma`, `api/STATUS.md` e
`api/docs/specs/01-tasks-http-contract-refinement.md`.

Padrões de frontend analisados: `web/src/lib/ky.ts`, `web/src/lib/react-query.ts`,
calls de Categories, `use-categories-query.ts`, `use-category-mutations.ts`,
`use-category-form.ts`, seus modelos de erros/query keys, schemas de Identity e
`use-end-session.ts`. React Query gerencia consultas, mutações e cache; o transporte
HTTP efetivo já existente é Ky. React Hook Form/Zod validam entradas dos formulários;
os tipos de resposta HTTP são definidos separadamente dos valores de formulário.

| Situação atual | Resultado esperado |
| --- | --- |
| `tasks-store.ts` usa Jotai e `TASKS_MOCK` | React Query é a fonte de Tasks reais; nenhuma inicialização ou recuperação por mocks |
| `TaskForm` usa defaults e estado local; botão apenas fecha | Submit com `useForm`, Zod, mutation e fechamento após sucesso |
| Prioridade inicial do diálogo é `MEDIUM` | Default `LOW`, conforme POST; status continua `BACKLOG` |
| `useTaskQuery` gerencia URL, sem HTTP | Mantê-lo como estado de URL; novo `useTasksQuery` executa consultas |
| `applyTaskQuery` filtra, ordena e pagina em memória | Lista usa o resultado e o total do servidor; board/timeline consultam todos os resultados filtrados |
| URL usa `q` | Traduzir para `search` na listagem; `q` permanece o parâmetro HTTP de options |
| `Task` contém `Date`; `updatedAt` é obrigatório e não nulo | Separar JSON HTTP e modelo visual; suportar `updatedAt: null` |
| `useTaskActivity` agrega stores locais | Detalhes e totais vêm exclusivamente de `GET /api/tasks/:taskId` |
| `canTransitionTask` impede `DONE → BACKLOG` | Permitir todas as transições entre os três valores aceitos pela API |
| Menus, drag e exclusão emitem sucesso imediatamente | Aguardar confirmação HTTP, com bloqueio de duplicidade e Alert em falha |
| `TaskCombobox` filtra uma coleção completa recebida por props | Busca remota de opções com cursor, seleção preservada e estados de leitura |

`api/STATUS.md` registra HTTP e persistência de exclusão como implementados, mas
mantém pendente a cobertura E2E específica da preservação dos vínculos. O schema
contém `onDelete: SetNull` para Task em Plans/Work Logs. Essa lacuna de verificação
não exige novo endpoint nem alteração do backend nesta SPEC. Os retornos reais dos
controllers/presenters prevalecem sobre descrições incompletas de Swagger.

## 3. Contratos HTTP e tipos

### 3.1. Transporte e arquivos

Reutilizar `api` de `@/lib/ky`, com `baseUrl` e `credentials: 'include'`. As calls
usam caminhos `api/tasks...`, sem barra inicial, seguindo Categories. A sessão
identifica o usuário; não enviar `userId`, token em storage ou header próprio.

| Arquivo em `web/src/api` / função | Método e rota | Request | Response |
| --- | --- | --- | --- |
| `create-task.ts` / `createTask` | `POST /api/tasks` | `CreateTaskRequest` em JSON | `201`, `CreateTaskResponse` |
| `fetch-tasks.ts` / `fetchTasks` | `GET /api/tasks` | `FetchTasksRequest` em query string | `200`, `FetchTasksResponse` |
| `edit-task.ts` / `editTask` | `PATCH /api/tasks/:taskId` | `EditTaskRequest`: ID no path, demais campos em JSON | `204`, `Promise<void>` |
| `delete-task.ts` / `deleteTask` | `DELETE /api/tasks/:taskId` | `DeleteTaskRequest`: ID no path, sem body | `204`, `Promise<void>` |
| `get-task-details.ts` / `getTaskDetails` | `GET /api/tasks/:taskId` | `GetTaskDetailsRequest`: ID no path | `200`, `GetTaskDetailsResponse` |
| `fetch-task-options.ts` / `fetchTaskOptions` | `GET /api/tasks/options` | `FetchTaskOptionsRequest` em query string | `200`, `FetchTaskOptionsResponse` |
| `edit-task-schedule.ts` / `editTaskSchedule` | `PATCH /api/tasks/:taskId/schedule` | `EditTaskScheduleRequest`: ID no path, datas em JSON | `204`, `Promise<void>` |
| `edit-task-status.ts` / `editTaskStatus` | `PATCH /api/tasks/:taskId/status` | `EditTaskStatusRequest`: ID no path, status em JSON | `204`, `Promise<void>` |

GETs recebem também `options?: { signal?: AbortSignal }`, separado do request.
Encaminhar o signal do React Query ao Ky. Calls retornam o envelope HTTP tipado e
não apresentam toasts, navegam, alteram cache ou consultam stores. Não executar
`.json()` em respostas `204`. Definir `retry: 0` nas oito calls e `retry: false`
nos hooks, como Categories, evitando repetição automática de escritas e retries
duplicados entre as duas bibliotecas.

### 3.2. Representações JSON

Definir tipos compartilhados em `features/tasks/model/task-api-types.ts`, reutilizando
os enums existentes em `task-types.ts`. Requests/responses de cada operação ficam
exportados por sua call. O código abaixo especifica os formatos, sem exigir que
todas as declarações fiquem no mesmo arquivo:

```ts
type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'DONE'
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type TaskSortBy = 'title' | 'status' | 'priority' | 'updatedAt' | 'dueDate'
type DateOnly = string // YYYY-MM-DD, validado por Zod
type IsoDateTime = string // timestamp ISO 8601 do JSON; não é Date

interface TaskDto {
	id: string
	title: string
	description: string | null
	status: TaskStatus
	priority: TaskPriority
	startDate: IsoDateTime | null
	dueDate: IsoDateTime | null
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

interface TaskOptionDto {
	id: string
	title: string
}

type TaskActivityDto = {
	id: string
	title: string
	startsAt: IsoDateTime
	endsAt: IsoDateTime
} & (
	| { kind: 'plan'; isConfirmed: boolean }
	| { kind: 'work-log' }
)

interface TaskDetailsDto {
	task: TaskDto
	summary: { plannedMinutes: number; loggedMinutes: number }
	activity: TaskActivityDto[]
}

interface PaginationMeta {
	limit: number
	page: number
	total: number
}

type CreateTaskResponse = { data: TaskDto }
type FetchTasksResponse = { data: TaskDto[]; meta?: PaginationMeta }
type GetTaskDetailsResponse = { data: TaskDetailsDto }
type FetchTaskOptionsResponse = {
	data: TaskOptionDto[]
	meta: { nextCursor: string | null }
}
```

Datas declaradas como `Date` no Nest são strings após serialização JSON. Não tipar
o retorno de `.json()` como o `Task` visual. `description`, `startDate`, `dueDate`
e `updatedAt` são propriedades presentes e anuláveis no payload. Options não retorna
status, prioridade ou datas; não fabricar uma Task completa a partir de uma opção.

### 3.3. Requests de escrita e parâmetros de path

```ts
interface TaskIdRequest { taskId: string } // UUID validado
type GetTaskDetailsRequest = TaskIdRequest
type DeleteTaskRequest = TaskIdRequest

interface CreateTaskRequest {
	title: string
	description?: string
	status?: TaskStatus
	priority?: TaskPriority
	startDate?: DateOnly
	dueDate?: DateOnly
}

interface EditTaskRequest extends TaskIdRequest {
	title?: string
	description?: string | null
	status?: TaskStatus
	priority?: TaskPriority
	startDate?: DateOnly | null
	dueDate?: DateOnly | null
}

interface EditTaskScheduleRequest extends TaskIdRequest {
	startDate?: DateOnly | null
	dueDate?: DateOnly | null
}

interface EditTaskStatusRequest extends TaskIdRequest {
	status: TaskStatus
}
```

- `title`: string com trim e mínimo de um caractere; não há máximo no DTO atual.
- `description`: string com trim; opcional no POST, opcional/anulável no PATCH.
  A API aceita string vazia. Na UI, descrição em branco no create será omitida;
  limpar uma descrição existente no edit enviará `null`.
- POST aceita omitir status/prioridade e aplica `BACKLOG`/`LOW`. O form deve exibir
  esses defaults e pode enviá-los explicitamente. POST não aceita `null` nas datas.
- PATCH: campo omitido preserva; `null` limpa somente descrição/datas; valor substitui.
  Não enviar `taskId` no body nem propriedades extras do modelo visual.
- Os DTOs aceitam PATCH vazio; a UI evita chamadas sem mudanças efetivas.
- Não há validação no backend de precedência entre `startDate`/`dueDate`, de data
  passada/futura ou de transição entre enums válidos. Não inventar bloqueios no form.

### 3.4. Listagem e cursor

```ts
type FetchTasksRequest = {
	search?: string
	status?: TaskStatus | TaskStatus[]
	priority?: TaskPriority | TaskPriority[]
} & (
	| { page: number; limit: number }
	| { page?: never; limit?: never }
) & (
	| { sortBy: TaskSortBy; sortDir: 'asc' | 'desc' }
	| { sortBy?: never; sortDir?: never }
)

interface FetchTaskOptionsRequest {
	q?: string
	limit?: number
	cursor?: string
}
```

Para `fetchTasks`, `page` é inteiro positivo; `limit` é inteiro de 1 a 200.
Enviar ambos ou nenhum. `sortBy`/`sortDir` também formam um par obrigatório quando
um deles é informado. Pares incompletos retornam `400`. Sem paginação, a API retorna
todos os resultados filtrados e omite `meta`; com paginação, `meta` contém o total
filtrado antes do recorte. `pageCount` e flags de navegação não vêm da API.

Serializar arrays com `URLSearchParams.append`: por exemplo,
`search=release&status=BACKLOG&status=IN_PROGRESS&priority=HIGH&page=1&limit=10&sortBy=dueDate&sortDir=asc`.
Não usar CSV, `status[]`, JSON de arrays ou `q` nessa call. Facetas vazias são omitidas.
Valores da mesma faceta combinam com OR; facetas distintas e busca combinam com AND.
A busca de lista inclui título e descrição; a normalização de caixa/acentos pertence
ao servidor. Não reaplicar o filtro local, que atualmente tem semântica diferente.

Para options, `q` recebe trim e até 100 caracteres; `limit` é inteiro de 1 a 50,
default 20. Cursor é string opaca não vazia de até 1000 caracteres. Copiar
`meta.nextCursor` para o próximo request sem decodificar ou construir seu conteúdo;
`null` encerra a paginação. Options busca somente título e inclui todos os status.
Não passar filtros de status/prioridade, `page`, `search` ou `sortBy` para options.
Cursor inválido retorna `400`; não existe outra rota de Tasks para busca por cursor.

### 3.5. Datas e conversão para a interface

Criar funções puras em `features/tasks/model/task-mappers.ts` e/ou `task-dates.ts`.
Manter JSON no cache; transformar para o modelo visual em `select` ou adaptadores
de leitura. Não fazer conversões independentes em cada componente.

- Requests de datas usam exclusivamente `YYYY-MM-DD`, aceito por `z.iso.date()`.
  Não enviar `Date`, timestamp completo, `startsAt`, `endsAt` ou `timeZone` em Tasks.
- `startDate`/`dueDate` são dias de calendário na UI. O backend converte a string
  para meia-noite UTC e retorna timestamp. Recuperar os componentes do dia UTC para
  exibir o mesmo dia no calendário local; não formatar diretamente o instante UTC
  como horário local. `2026-09-03T00:00:00.000Z` deve aparecer como 03/09 em São Paulo.
- O form guarda datas como `DateOnly | null`; os controles Calendar/Gantt usam
  adapters para `Date` local por componentes de ano/mês/dia. Na saída, formatar os
  componentes do dia selecionado, sem `toISOString().slice(0, 10)` de uma Date local.
- No modelo visual existente, manter `description?`, `startDate?` e `dueDate?`,
  convertendo null para ausência. Alterar `updatedAt` para `Date | null` e converter
  `createdAt`/`updatedAt` como instantes, sem inventar horário de atualização.
- Leitores de `updatedAt` devem suportar null. Lista exibe `—` quando ausente;
  comparadores que precisarem ordenar usam `updatedAt?.getTime() ?? 0`, coerente com
  a API. Não preencher a resposta com `createdAt` para fingir atualização.
- Activity usa instantes reais: converter `startsAt`/`endsAt` para exibição local,
  sem aplicar a regra de DateOnly. Preservar os nomes HTTP nos tipos de transporte.
- Reutilizar uma regra de atraso por dia em lista, board e barra Gantt: vencimento
  hoje não é atraso antes de terminar o dia; `DONE` nunca aparece atrasada.
- A timeline pode manter o fallback visual `startDate ?? createdAt` e a proteção
  contra barra invertida. Esse fallback não preenche o form nem gera PATCH sozinho.
  Valores válidos de datas invertidas vindos da API devem ser exibíveis/editáveis.

## 4. Responsabilidades e fluxo de dados

```text
Componente → hook de lógica/useForm → hook useMutation → call Ky → API
API → resposta JSON → cache React Query → mapper/select → componente
URL validada → request normalizado → useQuery → call Ky → API
Busca do seletor → useInfiniteQuery → options + nextCursor → opções visíveis
```

| Camada / arquivos previstos | Responsabilidade |
| --- | --- |
| `features/tasks/model/task-schema.ts` | Schemas de form, filtros, status, schedule, UUID e options; tipos inferidos e mensagens locais |
| `task-api-types.ts`, `task-mappers.ts`, `task-dates.ts` | Tipos JSON e transformação explícita entre API, form e apresentação |
| `task-query-keys.ts`, `task-errors.ts` | Chaves de cache/mutation e mensagens HTTP da feature |
| `hooks/use-tasks-query.ts` | Listagem paginada ou completa, recebendo parâmetros já normalizados |
| `hooks/use-task-details-query.ts` | Consulta por ID, habilitada quando um consumidor precisa dos detalhes |
| `hooks/use-task-options-query.ts` | Busca infinita por cursor, `pageParam` e cancelamento |
| `hooks/use-task-mutations.ts` | Exportar `useCreateTask`, `useEditTask`, `useDeleteTask`, `useEditTaskSchedule`, `useEditTaskStatus`; executar calls e sincronizar cache |
| `hooks/use-task-form.ts` | Defaults, diff validado, submit de create/edit, pending, rascunho e erro geral |
| Hooks de status/schedule em `features/tasks/hooks` | Validação RHF/Zod reutilizada por menus, controles e gestos; pending por Task |
| `app/pages/registers/tasks/hooks/use-tasks-page.ts` | Orquestrar URL, consultas, seleção por ID, navegação, callbacks e estados da página |
| Hooks de detalhes/exclusão junto à página | Estado de sheet/diálogo, mensagens e coordenação limitada com outros stores |
| `features/tasks/store/tasks-store.ts` | Adaptador temporário de leitura `useTasks`; remover atom e mutações locais de Tasks |

Não criar um repositório genérico de frontend ou compartilhar por herança os hooks
de Categories. Reutilizar seus padrões, mantendo regras de Tasks na feature.
Componentes recebem dados, callbacks e estados explícitos; não importam calls HTTP.
IDs selecionados ficam no estado da página; não manter uma segunda coleção mutável
de Tasks em Jotai ou cópias de detalhes permanentemente desatualizadas.

| Feature / interação | Call utilizada | Destino dos dados |
| --- | --- | --- |
| Abrir lista, aplicar filtros, ordenar, paginar | `fetchTasks` com `page`/`limit` | Linhas e paginação de `TasksList` |
| Abrir board ou timeline, aplicar filtros | `fetchTasks` sem `page`/`limit` | Conjunto completo para agrupamento e layout |
| Criar pelo botão ou atalho existente | `createTask` | Invalidação de listas/options; ID e valores finais do servidor |
| Editar no diálogo | `editTask` | Um PATCH com campos alterados; reconciliar listas/detalhes/options |
| Abrir detalhes | `getTaskDetails` | Task atual, resumo e activity do sheet |
| Mudar status no menu ou soltar card em outra coluna | `editTaskStatus` | Status persistido, listas e detalhes atualizados |
| Mover/redimensionar barra no Gantt | `editTaskSchedule` | Datas persistidas, lista/board/timeline/detalhes atualizados |
| Confirmar exclusão | `deleteTask` | Remoção reconciliada, fechamento do alvo e limpeza de referências locais |
| Buscar/continuar opções no `TaskCombobox` | `fetchTaskOptions` | Páginas de `{ id, title }`, sem carregar detalhes de cada opção |
| Resolver título de seleção UUID ausente nas opções/cache | `getTaskDetails`, somente quando necessário | Título da seleção; sem limpar vínculo por ausência na página |

O diálogo geral usa somente `editTask`, mesmo ao alterar status e datas junto com
outros campos. Não decompor um único submit em três PATCHes. Os endpoints focados
são usados nas interações dedicadas, evitando sobrescrever campos não envolvidos.

## 5. Cache, invalidação e sessão

### 5.1. Query keys

Seguir a geração de sessão de `useIdentityLifecycle`, já aplicada em Categories:

```ts
const taskKeys = {
	all: ['tasks'] as const,
	lists: (generation: number) => ['tasks', generation, 'list'] as const,
	list: (generation: number, params: NormalizedTaskListParams) =>
		['tasks', generation, 'list', params] as const,
	details: (generation: number, taskId: string) =>
		['tasks', generation, 'details', taskId] as const,
	options: (generation: number) => ['tasks', generation, 'options'] as const,
	optionSearch: (generation: number, q: string, limit: number) =>
		['tasks', generation, 'options', { q, limit }] as const,
	mutation: (generation: number, operation: TaskMutationOperation) =>
		['tasks', generation, 'mutation', operation] as const,
}
```

`TaskMutationOperation` cobre `create | edit | delete | schedule | status`.
`NormalizedTaskListParams` é o request efetivo da lista, com busca tratada,
facetas sem duplicatas em ordem canônica, par de sort e paginação somente quando
aplicável. Ausência de paginação identifica consulta completa; página 1/limite 10
identifica outra entrada. Não incluir drafts, arrays na ordem dos cliques, objetos
Date ou `view` quando não alteram o request. Todo parâmetro enviado que muda o
resultado deve estar na chave.

Options usa `useInfiniteQuery`, com `initialPageParam: undefined` e
`getNextPageParam: lastPage => lastPage.meta.nextCursor ?? undefined`.
Cursor fica em `pageParam`, não na chave da consulta infinita. Alterar q/limit
seleciona outra chave e começa sem cursor; páginas de buscas diferentes não se misturam.

Usar `staleTime: 0`, `retry: false` e `networkMode: 'always'`, como Categories.
Queries ficam desabilitadas durante `busy`/`ended`; detalhes exigem UUID válido e
consumidor ativo, options exige seletor aberto e busca válida. Mutations usam
`gcTime: 0`. Não persistir cache de Tasks em `localStorage`.

### 5.2. Sincronização após escrita

Adotar confirmação pelo servidor: o cache canônico não muda antes do sucesso HTTP.
Drag pode ter preview local durante o gesto; ao soltar, mostrar pendência e manter
os dados persistidos como referência até reconciliar. Falha descarta o preview.
Não gerar `updatedAt` ou IDs no cliente para simular uma resposta de PATCH.

| Resultado | Ação de cache |
| --- | --- |
| Create `201` | Cancelar leituras antigas afetadas e invalidar todas as listas e buscas de options da geração; reconsultar consumidores ativos. Não inserir cegamente a Task em páginas/filtros nem fabricar detalhes sem summary/activity |
| Edit `204` | Invalidar todas as listas, detalhes do ID e options, pois título/status/prioridade/datas podem alterar filtros e ordenação |
| Status/schedule `204` | Invalidar todas as listas e detalhes do ID; options mantém id/título e não precisa ser invalidada |
| Delete `204` | Cancelar consultas afetadas; retirar ID de resultados conhecidos, descartar detalhes/seleção do alvo e invalidar listas/options. Totais e preenchimento da página vêm do novo GET |
| `404` ao ler detalhes ou editar/excluir | Tornar alvo indisponível, cancelar/remover dados de detalhes obsoletos e reconciliar listas/options; não repetir a escrita |
| Outra falha de escrita | Preservar cache e rascunho; mostrar Alert da operação sem sucesso ou limpeza de relações |

Cancelamento e efeitos de cache devem usar a geração capturada no início da operação,
verificando sua validade novamente após awaits. Uma leitura iniciada antes da escrita
não pode restaurar dados antigos após o sucesso. Invalidar coleções pelo prefixo
`taskKeys.lists(generation)`, incluindo consultas completas usadas fora da página.
As queries inativas ficam stale para a próxima leitura.

Ao invalidar options após create/edit/delete, reiniciar a sequência desde a primeira
página; não reutilizar cursores antigos em uma coleção cuja ordenação por título
pode ter mudado. Preservar o título da seleção separadamente enquanto reconsulta.

Esperar a sincronização dos consumidores ativos, tratando falha do refetch como erro
da consulta. Escrita bem-sucedida seguida de GET falho continua sendo sucesso da
escrita: fechar diálogo, notificar uma vez e apresentar Alert/retry de leitura na
superfície afetada. Não apresentar “Unable to save” nem reenviar a mutation nesse caso.
Não usar `queryClient.clear()` ou invalidar caches de Categories/Identity por escrita
em Tasks. Pending por ID deve impedir escritas concorrentes na mesma Task por menu,
drag, edição e exclusão; liberar após conclusão, inclusive em falha.

### 5.3. Integração com o ciclo de sessão

Estender somente `web/src/features/identity/hooks/use-end-session.ts` nos pontos de
limpeza já usados por `endSession`/`afterSignIn`: cancelar/remover queries sob
`taskKeys.all` e remover mutations desse prefixo. Manter a limpeza de Identity e
Categories existente. Não modificar autenticação, formulários ou cookies.

Capturar a geração em consultas, mutações e hooks de lógica. Respostas atrasadas da
sessão anterior não podem repopular cache, emitir toasts, fechar novos diálogos ou
limpar referências locais da sessão seguinte. Limpar também seleções, títulos retidos,
erros e drafts da sessão anterior. Remover uma mutation do cache não cancela a escrita
no servidor; a proteção das continuações permanece obrigatória.

Em `401`, chamar a revalidação de sessão existente. Se a expiração for confirmada,
deixar esse fluxo encerrar a sessão; caso contrário, mostrar erro geral recuperável.
`404` de Task nunca usa `includeNotFound` para invalidar a identidade.

## 6. Formulários, validação e separação de erros

### 6.1. Schemas e React Hook Form

Usar `useForm` com `zodResolver`, `handleSubmit`, `formState.errors` e tipos inferidos
de Zod. Reaproveitar enums/constantes da feature, evitando listas divergentes.
Se um schema transformar a forma dos valores, distinguir `z.input`/`z.output` nos
genéricos do formulário e no mapper; não usar casts para fazer um form virar DTO.

| Campo/contexto | Regra local / mensagem esperada em inglês |
| --- | --- |
| `title` | `z.string().trim().min(1, 'Title is required')`; sem limite artificial de tamanho ou unicidade |
| `description` | String com trim, opcional semanticamente; default visual `''`; sem tamanho máximo inventado |
| `status` | Enum `BACKLOG`, `IN_PROGRESS`, `DONE`; `Select a valid status` |
| `priority` | Enum `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`; `Select a valid priority` |
| `startDate` | Dia válido `YYYY-MM-DD` ou null no form; `Enter a valid start date` |
| `dueDate` | Dia válido `YYYY-MM-DD` ou null no form; `Enter a valid due date` |
| UUID de operação | UUID válido antes de construir rota; ID de mock/ausente não dispara HTTP |
| Filtros da toolbar | Busca string e arrays dos enums válidos; não aplicar o máximo de options à busca da lista |
| Busca de options | String com trim, máximo 100; `Search must be 100 characters or less` |
| Paginação/sort/cursor | Validadores dos limites e pares da seção 3, sem enviar valores inválidos |

`useTaskForm` usa `register` para título/descrição e `Controller` para selects e
calendários. Defaults de criação: título/descrição vazios, `BACKLOG`, `LOW` e datas
null. Defaults de edição vêm da Task convertida, com snapshot ao abrir o formulário.

PATCH envia somente diferenças entre valores validados/normalizados e snapshot.
Comparar datas por dia e distinguir omissão de limpeza explícita. Sem diferenças,
desabilitar Save e também evitar a chamada no handler. Refetch de fundo não reseta
o que o usuário já digitou; nova abertura/troca de alvo reseta form e erro geral.
Manter `<form noValidate>` e tornar o botão externo `type="submit" form="task-form"`.

Adaptar `useTaskFilterDraft` para RHF/Zod preservando sua API útil e comportamento:
digitar apenas altera draft, Apply valida e escreve a URL, Clear limpa ambos, voltar/
avançar no navegador sincroniza o draft. Leitura de URL adulterada normaliza valores
inválidos aos defaults antes de consultar; nunca enviar legado em minúsculas.

Menus de status e gestos de board usam o mesmo schema de status e hook de formulário
dedicado; schedule e Gantt usam o mesmo schema de datas. A interação preenche valores
com `setValue` e passa por `handleSubmit`/validação RHF antes da mutation. Não criar
um caminho de drag que contorne Zod. Para campos visuais em menus, cards ou barras,
exibir eventual erro local junto ao controle da Task afetada, abaixo do campo/status
ou da área de datas, com ID único por Task. Não converter erro local em toast.

Excluir não exige um formulário artificial: validar o ID selecionado antes da call.
Falha interna de seleção/ID apresenta mensagem contextual de indisponibilidade e
oferece atualização, sem inventar um campo de UUID para o usuário editar.

### 6.2. Erros locais abaixo de cada campo

Somente a validação local de Zod/RHF preenche `formState.errors`. Usar o formato
solicitado em cada campo (o exemplo usa os nomes reais de Tasks):

```tsx
{errors.title && (
	<p id="task-title-error" className="text-sm text-destructive">
		{errors.title.message}
	</p>
)}

{errors.dueDate && (
	<p id="task-due-date-error" className="text-sm text-destructive">
		{errors.dueDate.message}
	</p>
)}
```

Aplicar o mesmo padrão a descrição, status, prioridade, startDate e campos de busca/
filtros quando inválidos. Encaminhar `aria-invalid`, `aria-describedby`, `onBlur`,
`disabled` e ref de foco aos inputs/triggers controlados. `DateField` deve suportar
essas props e uma ação explícita para limpar a data. Usar IDs únicos onde houver
várias Tasks simultaneamente e associá-los ao controle correspondente.

### 6.3. Erros HTTP em Alert geral

O hook de lógica expõe `error: string | null`, independente de `formState.errors`.
Renderizar na superfície da operação (form, diálogo, sheet, lista, board/timeline
ou seletor), de forma visível e acessível:

```tsx
{error && (
	<Alert variant="destructive">
		<AlertDescription>{error}</AlertDescription>
	</Alert>
)}
```

Todo erro HTTP, inclusive `400` com `errors.fieldErrors`, fica nesse Alert. Não
chamar `setError` do RHF com erros do servidor nem reaproveitar o mapeamento de
validações HTTP de Identity para campos. Toast de erro não substitui Alert.
Limpar erro geral ao iniciar nova tentativa/operação; falha preserva valores.

Centralizar em `getTaskError(error: unknown, operation)` em `task-errors.ts`.
Usar o helper existente `getHttpStatus` e leitura defensiva caso necessário; não
presumir JSON em toda falha. Documentar os formatos de erro observados:

```ts
type TaskApiErrorBody =
	| { statusCode: number; message: string; error: unknown }
	| {
		message: 'Data validation failed'
		errors: {
			formErrors: string[]
			fieldErrors: Record<string, string[] | undefined>
		}
	}
```

| Falha | Comportamento/mensagem |
| --- | --- |
| Sem resposta HTTP/rede | `Unable to connect. Check your connection and try again.` |
| `400` create/edit | `The task could not be saved. Check the fields and try again.` |
| `400` status/schedule | Mensagem específica para status/datas, no Alert da interação |
| `400` listagem | `Unable to load tasks with these filters. Reset the filters and try again.` |
| `400` options/cursor | `Unable to load task options. Restart the search and try again.`; ação reinicia sem cursor |
| `400` ID em detalhes/delete | Orientar atualizar a lista e selecionar novamente |
| `401` não resolvido pelo ciclo existente | `Unable to verify your session. Please try again.` |
| `404` | `This task is no longer available. Refresh the list.`; bloquear novas escritas nesse alvo |
| `5xx` | `The service is unavailable. Please try again.` |
| Outra falha | Mensagem segura específica de carregar/criar/salvar/excluir/mover/reagendar |

Não exibir stack, JSON bruto ou mensagens técnicas. Cancelamento intencional por
troca de filtro, fechamento ou sessão não produz Alert de erro de rede.
Erro de consulta e erro de mutation não devem apagar um ao outro.

## 7. Comportamento das features

### 7.1. Lista, filtros e navegação

`TasksList` consulta `page` da URL com `limit: TASKS_PAGE_SIZE` (atualmente 10) e
sort explícito, default `dueDate`/`asc`. A URL mantém `q`, mas a call usa `search`.
Apply/Clear/sort voltam à página 1; navegar páginas consulta a API.

Montar o resultado visual a partir de `data` e `meta`, sem `applyTaskQuery`,
`filterTasks` ou segundo recorte local. `pageCount = max(1, ceil(total / limit))`.
Se a página estiver além da última após exclusão ou URL manual, corrigir a URL para
a última válida e consultar de novo; não mostrar vazio definitivo no meio dessa
correção. Resposta paginada sem meta é falha de contrato, não total zero.

Preservar a ordenação do servidor, inclusive enums por ordem de domínio, busca
normalizada, datas ausentes por último e desempate por título. Não reordenar apenas
a página retornada. Os seletores de status/prioridade continuam usando labels atuais.

Mostrar carregamento inicial, sucesso vazio, sucesso com itens, falha inicial e
falha de refetch com cache anterior como estados distintos. Vazio só após sucesso.
Refetch falho mantém dados anteriores com Alert e ação `Try again`; uma troca para
chave ainda sem dados mostra loading, sem apresentar a página anterior como a atual.

### 7.2. Board, menus de status e timeline

Board/timeline usam os mesmos filtros aplicados e consultam `fetchTasks` sem página
nem limite. Nunca derivar seus dados da página corrente da tabela ou limitar a 200
itens enviando um limite artificial. Usar sort explícito `dueDate`/`asc` para a
consulta completa; agrupamento e disposição próprios de cada view permanecem locais.
O recorte visual de oito cards Done e `Show all` usa o conjunto completo já recebido.

Todos os três status são destinos válidos, incluindo `DONE → BACKLOG`. Atualizar
`TASK_TRANSITIONS`/`canTransitionTask` e os menus de forma coerente com o enum da API.
Arrastar para a mesma coluna, cancelar ou soltar fora de alvo válido não envia PATCH.
Não persistir a ordenação interna do board: a API não fornece esse contrato.

Drag e resize enviam schedule somente ao concluir um gesto válido e com mudança
efetiva; não fazer requests a cada movimento. Mover pode enviar as duas datas;
resize de uma borda envia somente o campo efetivamente alterado, preservando os
demais. A ausência original de startDate não vira data persistida só por renderizar
ou redimensionar a borda de vencimento. Tarefas sem dueDate continuam fora das barras
e podem receber data pelo diálogo existente.

Enquanto uma Task tem escrita pendente, bloquear suas ações concorrentes e indicar
pendência. Sucesso reconcilia todas as views; falha mantém/restaura representação
anterior e exibe Alert contextual. Verificar que estado interno de drag/resize não
fica preso após falha. Manter alternativa por menu/form e uso por teclado.

### 7.3. Criação e edição

Submit válido aguarda `mutateAsync`. Exibir `Creating…`/`Saving…`, desabilitar campos,
submit, Cancel, Escape e fechamento externo enquanto pendente. Proteger o handler
contra Enter/cliques repetidos e mudança de sessão, como `useCategoryForm`.

Sucesso fecha o diálogo e emite uma única mensagem `Task created`/`Task updated`.
Uma Task criada pode não aparecer no filtro/página atual; não forçar sua inclusão
nesse resultado. Falha mantém diálogo e rascunho, mostra Alert e permite tentar de
novo. `404` na edição bloqueia novo envio até selecionar um alvo válido.

### 7.4. Detalhes

Sheet abre por `taskId`, consulta detalhes e distingue loading, erro, vazio e dados
disponíveis. Pode mostrar título já conhecido enquanto carrega, mas não fabricar
resumo zero nem activity a partir dos stores locais. Não reutilizar detalhes de
outro ID como placeholder. Reabrir revalida; fechar permite cancelar leitura.

Renderizar `data.task`, totais de `data.summary` e entradas de `data.activity`.
Remover a dependência de `useTaskActivity` em `usePlans`/`useWorkLogs`; preservar
apenas helpers puros de apresentação úteis. `Balance` pode ser derivado dos totais
do servidor. Activity mantém ordem recebida: início decrescente; empate por kind
(Plan antes de Work Log) e ID. `isConfirmed` existe apenas em Plan e é booleano,
não instante de confirmação. Não exibir categories ou dados não presentes no contrato.

Task sem relações tem totais zero e activity vazia somente após GET bem-sucedido.
Em `404`, exibir indisponibilidade, remover dados obsoletos e oferecer fechar/
atualizar. A existência do módulo local de Plans/Work Logs não condiciona o sheet.
Os atalhos existentes continuam navegando para suas páginas; esta SPEC não implementa
criação/edição HTTP nem o consumo de parâmetros de abertura nesses módulos.

### 7.5. Exclusão

`DeleteTaskDialog` informa que a Task será excluída e Plans/Work Logs serão mantidos
sem vínculo. Não existe rota de impacto de exclusão para Tasks: não reutilizar a
call de Categories nem inventar contagens calculadas de mocks. Cancelar não envia DELETE.

Confirmar envia uma única call, mostra `Deleting…` e bloqueia fechamento e repetição.
Controlar o comportamento de `AlertDialogAction` para não fechar automaticamente
antes da resposta. Falha mantém diálogo com Alert; sucesso remove o alvo, fecha
eventual sheet correspondente e emite `Task deleted` uma vez.

A preservação dos registros persistidos e remoção de seus vínculos é responsabilidade
do backend. Não enviar PATCHes de Plans/Work Logs para executar a cascata no cliente.
A ponte estritamente local da seção 8 só ocorre após `204` e com sessão ainda válida.

### 7.6. Seletor e busca por cursor

Adaptar `TaskCombobox` para consumir opções remotas com `useTaskOptionsQuery`, sem
depender da coleção completa passada em `tasks`. Preservar a API de seleção
`string | null`, onChange/onBlur e integração com `Controller` dos formulários
existentes. Busca usa RHF/Zod; texto válido dispara consulta após debounce de 300 ms.
Não fazer uma segunda filtragem local que esconda resultados normalizados pela API.

Oferecer `Load more` acessível quando `hasNextPage`, bloqueado em `isFetchingNextPage`.
Concatenar páginas preservando ordem e deduplicando por ID. Falha de próxima página
mantém opções já carregadas e oferece retry dessa página; cursor inválido exige
reinício da busca. Não executar `fetchNextPage` concorrentes.

Distinguir busca inicial, nenhum resultado, erro e carregamento de mais opções.
Mostrar Alert geral da consulta junto ao seletor, sem contaminar erros do form
pai. O erro local de busca acima de 100 caracteres aparece abaixo do input de busca
e impede nova consulta até correção. Não substituir a seleção pelo texto de busca.

Reter `{ id, title }` da opção selecionada mesmo fora da página ou busca corrente.
Se um UUID já vinculado não está nas opções, tentar cache de Task/detalhes e,
quando necessário, consultar detalhes desse ID para obter o título. Não disparar
um GET de detalhes para cada opção. Ausência no resultado filtrado não significa
exclusão. Loading/erro não limpa vínculo; `404` informa Task indisponível e oferece
limpar/escolher outra. `No task` continua disponível sem requisito de API bem-sucedida.

## 8. Compatibilidade e refatorações permitidas

`useTasks` é usado por Plans, Work Logs, Dashboard e Reports. Preservar um adaptador
de leitura que usa `useTasksQuery` sem filtros/paginação e sort explícito canônico,
retornando Tasks convertidas e estados de loading/erro. Isso permite resolver títulos
e consumidores existentes com a mesma fonte HTTP, sem um segundo atom. A página
Tasks passa a usar consultas próprias por filtro e página.

Esses consumidores podem continuar seus fluxos locais. Ajustes se limitam a props,
tratamento de ausência/loading/erro, null de updatedAt e uso do seletor remoto.
Não migrar seus dados, cálculos ou persistência nesta etapa. Estados de erro da fonte
de Tasks precisam aparecer no consumidor, sem tratar falha como coleção vazia final.

Mocks de Tasks podem permanecer como fixtures de outros mocks, mas nunca alimentar
queries reais, completar responses, criar dados na API ou mapear vínculos por título.
IDs legados não UUID não disparam endpoints por ID. Relações locais não resolvidas
mantêm fallback de apresentação e possibilidade de remoção manual; não apagar
vínculos apenas porque uma query está incompleta ou falhou.

Após DELETE confirmado, acrescentar `clearTask(taskId)` aos stores locais de Plans
e Work Logs, seguindo a estrutura já existente de `clearCategory`. Ele limpa somente
referências ao ID excluído e preserva os registros. Essa chamada fica no hook de
exclusão da página Tasks, fora dos hooks de dados. Não usar esses stores para montar
detalhes reais ou verificar sucesso da exclusão no servidor.

Arquivos permitidos na implementação: os oito arquivos de calls, modelos/hooks/
componentes de Tasks, página Tasks e seus componentes, adaptador `tasks-store.ts`,
extensão pontual de `use-end-session.ts`, props dos dois consumidores de
`TaskCombobox` (`features/plans/calendar/plan-dialog.tsx` e
`app/pages/registers/work-logs/components/work-log-dialog.tsx`), os dois métodos
`clearTask` e ajustes mínimos nos consumidores diretos afetados. Helpers de atraso
e comparadores são ajustados somente para as representações reais de Tasks.
Não ampliar para correções gerais ou reescrita das primitivas de Gantt/Kanban.

## 9. Critérios de aceite

| ID | Cenário | Resultado verificável |
| --- | --- | --- |
| CA-01 | Inspecionar as oito calls | Rotas/métodos da seção 3; inputs/outputs tipados, signal nos GETs, cookie existente e nenhuma tentativa de JSON em `204` |
| CA-02 | Criar e recarregar a página | Um POST, ID do servidor, persistência após reload, defaults `BACKLOG`/`LOW` e um sucesso visual |
| CA-03 | Título vazio/espaços, enum inválido ou dia impossível | Zero requests; erros Zod/RHF abaixo dos campos e associados por ARIA |
| CA-04 | Descrição opcional, título repetido/longo, datas ausentes/iguais/invertidas | Form não inventa restrições ausentes da API; dados válidos podem ser enviados |
| CA-05 | Editar só título, só prioridade ou campos combinados | Um PATCH geral com apenas diferenças; campos omitidos preservados; nenhum request sem mudança |
| CA-06 | Limpar descrição, startDate e dueDate em edições isoladas | PATCH envia null somente no campo limpo; reload confirma a limpeza; POST vazio omite campos opcionais |
| CA-07 | Listar, buscar com acentos/caixa e combinar facetas | `search` e parâmetros repetidos corretos; OR na faceta, AND entre facetas; mesmos resultados da API sem novo filtro local |
| CA-08 | Paginar e ordenar por cada campo suportado | Pares completos, limite 10 na lista, total de meta e ordem do servidor; nenhuma paginação/ordenação só da página em memória |
| CA-09 | URL inválida, última página esvaziada e total zero | Normalização segura, correção de página com novo GET, vazio somente após sucesso; sem requests inválidos/loop |
| CA-10 | Alternar lista, board e timeline com mais de 200 Tasks | Lista paginada; board/timeline sem page/limit e com todos os resultados filtrados; sem vazamento de página da tabela |
| CA-11 | Loading inicial, GET vazio, erro inicial e erro de refetch | Estados distintos; Alert/retry; cache anterior preservado quando disponível, sem vazio falso |
| CA-12 | Mover status por menu/drag, inclusive `DONE → BACKLOG` | Um PATCH `/status`; sem efeitos em campos irmãos ou criação de Plan/Work Log; cancelamento/mesma coluna não chama API |
| CA-13 | Mover/redimensionar Gantt e falhar a escrita | PATCH `/schedule` somente ao finalizar; datas alteradas corretas; falha restaura preview, libera interação e mostra Alert |
| CA-14 | Calendário em São Paulo e fuso positivo; dueDate hoje | Mesmo dia escolhido/enviado/exibido após reload; nenhum timestamp em request de data; sem atraso prematuro hoje |
| CA-15 | Resposta com updatedAt null e demais opcionais null | Lista, board, timeline e detalhes não quebram, não criam datas falsas e exibem ausência corretamente |
| CA-16 | Abrir detalhes com vínculos reais e com stores locais divergentes | Summary/activity vêm do GET de detalhes; ordem/kind/isConfirmed corretos; nenhum uso de mock para totais |
| CA-17 | Abrir detalhes sem relações e trocar rapidamente A/B | Zero/vazio somente após sucesso; nenhum dado de A exibido como B; falhas e `404` recuperáveis |
| CA-18 | Cancelar, confirmar e falhar exclusão | Cancelar não escreve; confirmação faz um DELETE; falha não fecha nem limpa dados; sucesso remove Task e seus detalhes |
| CA-19 | Excluir Task vinculada a Plan/Work Log persistidos | Registros sobrevivem com relação Task nula, sem PATCH adicional; ponte local limpa só o ID excluído após sucesso |
| CA-20 | Buscar opções e carregar múltiplas páginas | `q`/limit/cursor corretos, sem duplicatas, respeita nextCursor null, não carrega detalhes de cada opção |
| CA-21 | Alterar busca, exceder 100 caracteres e receber cursor inválido | Busca nova começa sem cursor; erro local abaixo do input impede request inválido; `400` fica em Alert com reinício |
| CA-22 | Seleção fora das páginas, rede falha e Task sem vínculo | Label selecionado preservado/resolvido por ID; sem limpeza involuntária; seleção null continua possível |
| CA-23 | Create/edit/delete muda título/resultado de busca | Listas e options reconciliadas, cursor reiniciado e seleção atualizada; sem inserir Task fora do filtro |
| CA-24 | API retorna `400` com fieldErrors para form localmente válido | Somente Alert geral; nenhum erro HTTP em `formState.errors`; rascunho mantido |
| CA-25 | Submit repetido, Enter, Escape e ações simultâneas no mesmo ID | Uma escrita em voo por Task, bloqueios funcionais e feedback pending; nenhum fechamento prematuro |
| CA-26 | Escrita conclui e refetch falha | Um sucesso da escrita; Alert na consulta; retry faz somente GET, sem duplicar mutação |
| CA-27 | Outra aba exclui alvo antes de leitura/edição/status/schedule/delete | `404` bloqueia alvo e reconcilia caches; não encerra sessão válida nem repete escrita |
| CA-28 | `401`, rede indisponível, `5xx` e cancelamento intencional | Revalidação existente para `401`; erros recuperáveis em Alert sem loops; cancelamento sem falso erro |
| CA-29 | Logout/login em outra conta com queries/mutations atrasadas | Cache/mutations de Tasks removidos; nenhum dado, seleção, toast ou efeito local da conta anterior |
| CA-30 | Usar Tasks sem Categories/Plans/Work Logs e visitar consumidores | Fluxos de Tasks independentes; consumidores leem fonte real sem ganhar integração HTTP própria |
| CA-31 | Usar teclado/mobile e leitores de erro | Labels, foco, descrições de erro e estados disabled preservados; drag possui alternativa em menu/form |
| CA-32 | Revisar diff e validação estática da implementação | Somente escopo da seção 8; backend e fluxos validados de Identity/Categories preservados; contratos de Tasks sem casts amplos |

## 10. Verificação futura e entrega desta SPEC

Validar a implementação com API autenticada e inspeção de rede. Usar uma conta
vazia e dados suficientes para paginação, facetas, nulos e múltiplas páginas de
options; incluir vínculos reais preparados pela API para detalhes/exclusão, pois
Plans/Work Logs continuam locais no frontend. Registrar resultados e limitações,
sem declarar a cobertura de vínculos comprovada apenas pelo schema ou mocks.

Verificar com respostas controladas/throttling os casos de falha, dupla submissão,
cursor inválido, refetch após sucesso, troca de filtros/IDs e mudança de sessão
durante requests. Verificar as conversões de datas em fusos negativo e positivo.
Não acrescentar uma infraestrutura ampla de testes ao frontend apenas para esta etapa.

Executar `pnpm --dir web run typecheck` após implementar e também
`pnpm --dir web exec tsc --noEmit -p tsconfig.app.json`, pois o tsconfig raiz usa
referências e o script atual, isoladamente, não verifica todos os arquivos React.
Comparar diagnósticos preexistentes antes/depois: não introduzir novos erros nem
corrigir problemas fora do escopo para obter resultado artificialmente limpo.
Executar build se a mudança afetar o bundle, conforme `web/AGENTS.md`, e verificar
`git diff --check`.

A entrega atual altera exclusivamente este documento em `web/docs/specs`, com
revisão de aderência ao código existente e dos critérios de aceite. Não implementa
hooks, calls ou componentes e não modifica documentação/código do backend.
Finalizar com um único commit desta SPEC, sem push.
