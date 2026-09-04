# SPEC 06 — Integração de Work Logs do frontend com a API

Status: implementada. Resultados da validação registrados na seção 18.
Data: 2026-09-03.

## 1. Objetivo, escopo e fronteiras

Integrar o CRUD e todos os fluxos operacionais de Work Logs às cinco operações HTTP já
implementadas: criação, consulta por intervalo, edição geral, alteração de horário e exclusão.
React Query passa a ser a única fonte dos Work Logs reais da área operacional. O atom Jotai,
IDs gerados no navegador e mocks deixam de representar persistência operacional.

Um Task define o resultado desejado, um Plan reserva tempo pretendido e um Work Log registra
trabalho efetivamente realizado. Task e Category são vínculos opcionais do Work Log; o módulo
continua útil quando um ou ambos não existem ou suas fontes estão temporariamente indisponíveis.
Timezone é preferência de apresentação e interpretação civil, não atributo persistido do Work
Log, embora a API exija `timeZone` nas três operações que podem validar seu intervalo.

Incluído nesta implementação:

- cinco calls HTTP tipadas, DTOs de transporte, modelo lido, receipt de criação, mappers,
  query keys, query por intervalo, mutations, locks e reconciliação de cache;
- página operacional nas visões de dia, semana e mês, incluindo navegação, filtros, resumo,
  minutos não rastreados, criação, edição, exclusão, drag, resize e “Log now”;
- conversão explícita entre instantes ISO e horários civis no timezone IANA configurado;
- efeitos sobre Work Logs da confirmação de Plan e da exclusão de Task/Category;
- remoção da dependência do store operacional por Dashboard e Reports, substituída por fixtures
  administrativas próprias, explícitas e imutáveis.

Fora do escopo:

- qualquer alteração em `api/`, inclusive contratos, regras, schema, migrations ou testes;
- integração real de Dashboard, Reports, gráfico de contribuições ou exports;
- redesign do calendário ou mudanças amplas nos componentes visuais compartilhados;
- projetos, subtarefas, recorrência, timer em execução, tracking em tempo real, jornada de
  trabalho, horário comercial, duração mínima ou novas regras de negócio;
- implementar confirmação de Plan no módulo de Work Logs ou fazer calls adicionais em resposta
  a `record-as-done`;
- infraestrutura ampla de testes.

Não existe fallback de erro para fixtures. Dados administrativos continuam claramente
prototípicos; dados operacionais vêm somente da API. Não criar `useWorkLogs()` sem intervalo e
não buscar todo o histórico para preservar artificialmente a API do store atual.

## 2. Base analisada e diferenças do estado atual

Foram conferidos os cinco controllers de Work Logs, DTOs de entrada e saída,
`WorkLogPresenter`, entidade `WorkLog`, value object `WorkLogData`, casos de uso, porta e
repositório Prisma, mappers, schema/migration, repositório em memória e testes unitários/E2E.
Também foram analisados o endpoint composto de confirmação de Plan e o `ON DELETE SET NULL` de
Task/Category.

No frontend, foram conferidos Ky, React Query, geração de sessão, revalidação, limpeza de cache,
integrações de Plans/Tasks/Categories, calendário compartilhado, helpers de timezone, página,
formulário, regras, mocks, atom e todos os consumidores diretos de `useWorkLogs`.

| Estado atual | Resultado exigido |
| --- | --- |
| `work-logs-store.ts` inicia um atom com `WORK_LOGS_MOCK` | queries por sessão, intervalo e filtros são a fonte operacional |
| `IWorkLog` mistura persistência e `ICalendarItem` | DTO HTTP, modelo lido e item visual ficam separados |
| criação usa `crypto.randomUUID()` | ID e metadados vêm do `201` |
| datas usam `toISOString()`/`isSameDay` no timezone do navegador | conversão e regras civis usam o timezone IANA configurado |
| toda a coleção é filtrada no cliente | intervalo e filtros são enviados ao GET |
| ausência de conflito é inferida da coleção local | somente a API confirma ausência global de sobreposição |
| erro de overlap identifica o título local conflitante | resposta real é `400` e não identifica o Work Log conflitante |
| sucesso fecha diálogo antes de I/O | UI aguarda `201`/`204`; falha preserva rascunho e superfície |
| drag/resize altera o atom imediatamente | preview efêmero e um PATCH ao finalizar o gesto |
| “Log now” usa a coleção visível/global e o timezone do navegador | leitura própria do dia civil atual, sem filtros, e helpers IANA |
| Work Logs oferece `day`, `week`, `agenda` | oferecer `day`, `week`, `month`; o mês já existe no calendário compartilhado |
| Dashboard/Reports leem o mesmo atom mutável | cada área recebe fixture administrativa imutável própria |
| deletes de Task/Category percorrem o atom | backend limpa a FK; cliente invalida o prefixo da geração atual |

A substituição de `agenda` por `month` em `WORK_LOG_VIEWS` corrige a divergência entre a UI
atual e o fluxo requerido. É apenas configuração de uma visão compartilhada já existente, não
um redesign. A visão `agenda` continua disponível no calendário genérico, mas não integra o
escopo operacional desta entrega.

## 3. Contratos HTTP reais

Todas as rotas são protegidas pela sessão HTTP-only. `@/lib/ky` já usa
`credentials: 'include'`. Nunca enviar `userId`, token, cookie legível, `Authorization` manual
ou campos que não pertençam ao DTO. Propriedades `Date` dos DTOs Nest são strings ISO 8601 no
JSON transmitido.

Todas as calls definem `retry: 0`. O retry da leitura pertence ao React Query; mutations não
são repetidas automaticamente. A call de GET aceita `options?: { signal?: AbortSignal }` e
encaminha o signal. Calls de `204` retornam `Promise<void>`, apenas aguardam Ky e nunca chamam
`.json()`.

### 3.1. Inventário das cinco operações

| Operação | Método e rota | Path/query | Body | Sucesso | Response |
| --- | --- | --- | --- | --- | --- |
| Listar | `GET /api/work-logs` | `from` e `to` obrigatórios; `taskId`, `categoryId`, `withoutTask`, `withoutCategory` opcionais | nenhum | `200` | `{ data: WorkLogDto[] }` |
| Criar | `POST /api/work-logs` | nenhum | `CreateWorkLogRequest` | `201` | `{ data: CreatedWorkLogDto }` |
| Editar | `PATCH /api/work-logs/:workLogId` | `workLogId` UUID | `EditWorkLogRequest` sem o ID | `204` | nenhum |
| Alterar horário | `PATCH /api/work-logs/:workLogId/schedule` | `workLogId` UUID | `EditWorkLogScheduleRequest` sem o ID | `204` | nenhum |
| Excluir | `DELETE /api/work-logs/:workLogId` | `workLogId` UUID | nenhum | `204` | nenhum |

Antes de interpolar `workLogId`, validar UUID localmente e aplicar `encodeURIComponent`.
UUID inválido no path é `400` no pipe da API, não `404`. Os IDs dos filtros não são validados
como UUID pelo DTO atual, mas o frontend deve enviar somente UUIDs validados provenientes das
fontes reais ou do parâmetro `?task=`.

### 3.2. Tipos de transporte e responses exatos

Criar `features/work-logs/model/work-log-api-types.ts` com os tipos compartilhados:

```ts
type IsoDateTime = string

interface WorkLogTaskSummaryDto {
	id: string
	title: string
}

interface WorkLogCategorySummaryDto {
	id: string
	name: string
	color: string
}

interface WorkLogDto {
	id: string
	task: WorkLogTaskSummaryDto | null
	category: WorkLogCategorySummaryDto | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

interface CreatedWorkLogDto {
	id: string
	taskId: string | null
	categoryId: string | null
	title: string
	description: string | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}
```

O GET retorna resumos `task` e `category`, sem `taskId`/`categoryId` na raiz. O POST retorna os
IDs das relações, sem resumos. Ambos retornam metadados. Essas formas não podem ser alargadas,
unificadas por cast ou preenchidas com dados inventados. `category.color` é `string`; cor não
reconhecida usa o fallback visual sem apagar a Category.

O receipt de criação pode ser normalizado como `CreatedWorkLog`, ainda com IDs em vez de
resumos, mas não é um `WorkLog` lido e não é inserido como `WorkLogDto` no cache. O mapper do
GET produz o modelo operacional; o mapper do POST apenas confirma a escrita e preserva seus
campos exatos para eventual telemetria/resultado da mutation.

### 3.3. Listagem

```ts
interface FetchWorkLogsRequest {
	from: IsoDateTime
	to: IsoDateTime
	taskId?: string[]
	categoryId?: string[]
	withoutTask?: true
	withoutCategory?: true
}

interface FetchWorkLogsResponse {
	data: WorkLogDto[]
}
```

Serializar arrays repetindo `taskId` e `categoryId` com `URLSearchParams.append`. Não usar CSV,
JSON, `taskId[]` ou sentinelas. Enviar flags somente como string `true`; omitir flags falsas.
`from < to` é obrigatório. O resultado vem ordenado por `startsAt ASC`, depois `id ASC`.

O repositório seleciona exatamente Work Logs do usuário que interceptam o intervalo:

```text
startsAt < to AND endsAt > from
```

Um item que termina exatamente em `from` ou começa exatamente em `to` fica fora; contidos,
iniciados antes ou terminados depois entram. A semântica é semiaberta `[from, to)`.

Filtros preservam OR dentro de cada faceta e AND entre facetas:

```text
(taskId IN selecionados OR taskId IS NULL quando withoutTask)
AND
(categoryId IN selecionados OR categoryId IS NULL quando withoutCategory)
```

Sem seleção, a faceta é omitida. O cliente não reaplica filtros remotos nem reduz o resultado
por mês principal; o servidor já definiu a semântica.

### 3.4. Criação

```ts
interface CreateWorkLogRequest {
	taskId?: string
	categoryId?: string
	title: string
	description?: string
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	timeZone: string
}

interface CreateWorkLogResponse {
	data: CreatedWorkLogDto
}
```

`title` tem 1–255 caracteres; `description`, no máximo 1000; `taskId` e `categoryId` são UUIDs
opcionais; `startsAt`, `endsAt` e `timeZone` são obrigatórios. O POST não aceita `null` nas
relações ou descrição: ausência representa “sem vínculo/descrição”. A API não faz trim nem
rejeita título composto somente por espaços; a UI pode continuar exigindo conteúdo útil como
decisão de formulário, sem declarar isso como regra do backend.

### 3.5. Edição geral

```ts
interface WorkLogIdRequest {
	workLogId: string
}

interface EditWorkLogRequest extends WorkLogIdRequest {
	taskId?: string | null
	categoryId?: string | null
	title?: string
	description?: string | null
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
	timeZone: string
}
```

`timeZone` é sempre obrigatório, mesmo se o patch alterar apenas texto ou relação, pois o caso
de uso revalida o intervalo resultante. Ausência preserva campo; `null` limpa Task, Category ou
description. Timestamps são opcionais, nunca nulos. O backend aceita body contendo somente
`timeZone`, mas a UI não envia mutation sem mudança efetiva.

### 3.6. Alteração de horário e exclusão

```ts
interface EditWorkLogScheduleRequest extends WorkLogIdRequest {
	startsAt?: IsoDateTime
	endsAt?: IsoDateTime
	timeZone: string
}

type DeleteWorkLogRequest = WorkLogIdRequest
```

Schedule aceita cada borda como opcional e sempre exige `timeZone`. Drag normalmente envia as
duas bordas; resize envia apenas a borda efetivamente alterada quando isso representar o gesto
sem ambiguidade. DELETE não tem body.

### 3.7. Arquivos de transporte

Criar uma função por operação:

| Arquivo em `web/src/api` | Função e retorno |
| --- | --- |
| `fetch-work-logs.ts` | `fetchWorkLogs(request, options?) -> Promise<FetchWorkLogsResponse>` |
| `create-work-log.ts` | `createWorkLog(body) -> Promise<CreateWorkLogResponse>` |
| `edit-work-log.ts` | `editWorkLog({ workLogId, ...body }) -> Promise<void>` |
| `edit-work-log-schedule.ts` | `editWorkLogSchedule({ workLogId, ...body }) -> Promise<void>` |
| `delete-work-log.ts` | `deleteWorkLog({ workLogId }) -> Promise<void>` |

Calls somente transportam e serializam. Não leem `localStorage`, projetam calendário, exibem
toast, invalidam cache ou classificam mensagem de erro.

## 4. Regras reais de Work Logs

Create, edit e schedule validam no caso de uso:

1. `timeZone` é um timezone IANA aceito por `Intl.DateTimeFormat`;
2. `endsAt > startsAt`;
3. início e fim pertencem ao mesmo dia civil no `timeZone` enviado;
4. `endsAt` não está no futuro no instante de execução da API;
5. não existe outro Work Log do mesmo usuário com `startsAt < novoEndsAt` e
   `endsAt > novoStartsAt`;
6. ao editar, o próprio `workLogId` é excluído da busca de sobreposição.

Intervalos adjacentes podem tocar. Task e Category não são obrigatórios. Não existem duração
mínima, jornada, horário comercial ou limite máximo de duração além do mesmo dia civil. As
constantes atuais `DEFAULT_WORK_LOG_DURATION = 30` e `MIN_WORK_LOG_DURATION = 5` são heurísticas
do protótipo. A primeira pode permanecer como tamanho inicial do rascunho; a segunda não pode
rejeitar um intervalo e pode ser removida se o novo algoritmo não precisar dela.

A API é autoritativa. A validação local pode rejeitar com segurança:

- timezone/preferência inválida, horário civil inexistente e conversão impossível;
- `end <= start` depois de converter para instantes;
- dias civis diferentes no timezone configurado;
- `end > agora` pela leitura local do relógio;
- sobreposição com um Work Log conhecido, pois encontrar um conflito é evidência suficiente.

A validação local não pode aprovar definitivamente a ausência de overlap: a query pode cobrir
outro intervalo, estar filtrada, estar desatualizada ou não conter um concorrente recém-criado.
Não bloquear a mutation apenas porque a coleção parcial não permite provar algo; enviar e
deixar a API decidir. Diferença de relógio também torna a validação de futuro apenas uma ajuda.

O `400` de overlap expõe hoje apenas a mensagem genérica do caso de uso e não inclui ID, título
ou intervalo conflitante. A UI deve dizer que o horário conflita com trabalho já registrado,
sem prometer identificar qual item e sem depender literalmente do texto do backend.

## 5. Modelo normalizado, mappers e timezone

### 5.1. Separação de representações

Manter o payload HTTP cru no cache e projetá-lo para a UI:

```ts
interface WorkLog {
	id: string
	title: string
	description: string | null
	task: WorkLogTaskSummaryDto | null
	category: WorkLogCategorySummaryDto | null
	startsAt: IsoDateTime
	endsAt: IsoDateTime
	createdAt: IsoDateTime
	updatedAt: IsoDateTime | null
}

interface WorkLogCalendarItem extends ICalendarItem {
	workLog: WorkLog
	// Coordenadas civis sem offset, exclusivas da geometria do calendário.
	startDate: string
	endDate: string
}
```

`toWorkLog(dto)` preserva o modelo lido; `toWorkLogCalendarItem(workLog, timeZone)` usa
`instantToCalendarText`. `toCreatedWorkLog(dto)` mantém o receipt distinto. Campos visuais
`startDate`/`endDate` nunca substituem `startsAt`/`endsAt` e nunca são enviados diretamente.
IDs normais são lidos de `workLog.task?.id` e `workLog.category?.id`.

### 5.2. Preferência e helpers compartilhados

Reutilizar `features/calendar/lib/time-zone` sem criar infraestrutura paralela:

- `useTimeZone()` observa `task_manager.timezone` na mesma aba e entre abas;
- `instantToCalendarDate/Text` projeta instantes recebidos;
- `calendarDateToInstant` interpreta campos civis;
- `calendarRangeToIso` converte e valida limites;
- `calendarDayStartToInstant` converte limites civis da query;
- `getZonedToday` e projeção do instante atual definem “hoje” e “agora”.

O timezone do navegador serve apenas como fallback inicial quando não há preferência válida.
Depois disso, nenhuma regra ou conversão pode depender silenciosamente dele. `startsAt` e
`endsAt` são instantes absolutos; mudar a preferência não faz PATCH e não altera esses valores.
Ela reprojeta itens/formulário, atualiza indicadores de hoje/agora e recalcula os limites ISO
da query civil selecionada.

O calendário e date-fns podem continuar usando objetos `Date` como coordenadas civis
artificiais. A fronteira civil → instante deve passar pelos helpers Temporal, nunca por
`Date.prototype.toISOString()`.

### 5.3. DST e mudança de timezone com diálogo aberto

Preservar a política já implementada:

- horário inexistente no salto de DST gera `InvalidCalendarTimeError`, fica associado ao campo
  Start/End e não envia request;
- horário ambíguo escolhe a ocorrência `earlier` por padrão e mostra aviso não técnico;
- se um instante original persistido corresponde ao mesmo horário civil ambíguo que não foi
  alterado, `original` preserva exatamente esse instante, inclusive a ocorrência `later`;
- limites de início do dia usam o primeiro instante válido do dia civil; não forçam 24 horas.

Ao mudar timezone com formulário aberto, primeiro interpretar os valores atuais no timezone
anterior e depois reprojetar seus instantes no novo timezone. Para edição, fornecer os
`startsAt`/`endsAt` persistidos como originais, preservando campos não alterados. Para criação,
preservar os instantes do rascunho já materializado. Se a entrada civil anterior já era
inválida, mantê-la para correção em vez de inventar um instante.

Regras de mesmo dia devem comparar datas civis no timezone configurado. Remover o uso direto
de `date-fns/isSameDay` sobre instantes reais nos schemas/regras de Work Logs.

## 6. Consulta por intervalo, filtros e query keys

### 6.1. Intervalo visível

Reutilizar `Calendar.onVisibleRangeChange`, `itemsRange`, `getVisibleCalendarRange`,
`getCalendarCells` e `calendarDayStartToInstant`, todos já introduzidos por Plans. Não duplicar
em Work Logs a estrutura de dia, semana ou grid mensal.

- Dia: `from` é o início do dia selecionado e `to` o início do dia seguinte no timezone.
- Semana: sempre segunda-feira 00:00 até a segunda seguinte 00:00, sete dias civis completos.
- Mês: início da primeira célula renderizada até o início do dia posterior à última célula,
  incluindo células dos meses anterior e seguinte e grids de 35/42 dias.

Converter cada limite civil independentemente. Em DST, um dia pode durar 23/25 horas e uma
semana não precisa equivaler a `7 * 24h`. Nunca usar `23:59:59.999`, limites civis em UTC fixo
ou margens artificiais.

`Show weekends` altera somente colunas. Ele não participa do cálculo estrutural, query key,
cancelamento ou GET. Seleção de data, navegação e mudança de visão publicam novo intervalo. A
query só fica habilitada depois do primeiro `onVisibleRangeChange`.

### 6.2. Normalização e chaves

Criar `work-log-query-keys.ts`:

```ts
const workLogKeys = {
	all: ['work-logs'] as const,
	lists: (generation: number) => ['work-logs', generation, 'list'] as const,
	list: (generation: number, request: NormalizedFetchWorkLogsRequest) =>
		['work-logs', generation, 'list', request] as const,
	mutation: (generation: number, operation: WorkLogMutationOperation) =>
		['work-logs', generation, 'mutation', operation] as const,
}
```

Esse prefixo alinha-se à invalidação `['work-logs']` já feita após
`record-as-done`. A implementação deve importar `workLogKeys.all` no hook de Plans para evitar
string duplicada, sem alterar o comportamento da operação composta.

`normalizeWorkLogRequest` remove duplicatas, ordena IDs, omite arrays vazios e flags falsas e
preserva `from`/`to`. A ordem dos cliques não pode criar caches equivalentes diferentes.
`showWeekends`, formato de hora, timezone nominal, previews e drafts não entram na key; o efeito
do timezone sobre a consulta já está expresso nos limites ISO.

Sentinelas atuais `none` e `no-category` nunca saem da UI:

- IDs reais selecionados → `taskId`/`categoryId` repetidos;
- `none` → `withoutTask: true`;
- `no-category` → `withoutCategory: true`.

O parâmetro `?task=` da página Tasks é aceito se for UUID válido, sem aguardar a lista completa
de Tasks. Um ID inválido é ignorado e nunca entra no GET.

### 6.3. Hook de leitura

`useWorkLogsQuery(request, timeZone, enabled)` segue `usePlansQuery`:

- captura a geração de sessão e usa `workLogKeys.list` normalizada;
- encaminha `signal` à call;
- antes de revalidar `401`, verifica `!signal.aborted && current()`;
- usa `retry: false`, `networkMode: 'always'`, `staleTime: 0`;
- mapeia DTO → Work Log → item visual no `select` com o timezone atual;
- fica desabilitada durante lifecycle `busy`/`ended` ou sem intervalo.

Não usar `placeholderData: keepPreviousData`. O `itemsRange` entregue ao calendário precisa
corresponder ao intervalo civil que originou os itens. Dados de outra key nunca são exibidos
como pertencentes ao novo intervalo.

## 7. Estados do calendário e derivações

Distinguir explicitamente:

1. antes do intervalo: calendário sem itens, sem GET e sem empty state;
2. loading inicial: status acessível, sem mensagem de vazio;
3. sucesso vazio: mensagem “No work logs in this range” e criação disponível;
4. sucesso com dados: calendário normal;
5. erro inicial: Alert geral e botão `Try again`, sem vazio falso;
6. refetch/fetching com cache da mesma key: manter itens e mostrar estado discreto;
7. erro de refetch com cache: manter itens da mesma key, Alert e retry do GET.

Somente a leitura tem botão de retry. Abortos intencionais por troca de key, desmontagem ou
sessão não exibem Alert/toast. Voltar a um intervalo visitado aproveita cache e pode revalidar.

Resumo e derivações recebem somente os dados da query que corresponde ao intervalo e filtros
atuais:

- `sumMinutes` soma os instantes dos resultados atuais;
- no dia, `getUntrackedMinutes` continua client-side: intervalo entre o primeiro início e o
  último fim menos os minutos registrados, sem endpoint e sem jornada presumida;
- semana e mês mostram apenas o resumo do intervalo inteiro retornado;
- nenhuma derivação usa resposta da key anterior, preview de outra geração ou fixture.

Como Work Logs válidos não cruzam dia, a derivação diária não precisa recortar intervalos. As
funções puras devem operar em instantes normalizados; agrupamentos civis, quando necessários,
recebem `timeZone` explicitamente.

## 8. “Log now”

### 8.1. Problemas do comportamento atual

`getLogNowRange` hoje filtra com `isSameDay` no timezone do navegador, presume que recebeu toda
a coleção, usa o maior fim anterior a `now` e, para gaps menores que cinco minutos, volta 30
minutos. Isso pode atravessar o início do dia ou criar um rascunho que sobrepõe o último log.
Também falha quando o calendário está em outro período ou com filtros.

### 8.2. Leitura dedicada e cacheada do dia atual

Ao acionar “Log now”:

1. capturar uma única vez o instante `now` e a geração atual;
2. obter `today = getZonedToday(timeZone)`;
3. construir o request sem filtros `[início civil de today, início civil do próximo dia)`;
4. executar uma query sob demanda usando a mesma `workLogKeys.list` e a mesma função de leitura;
5. deduplicar uma request idêntica em voo e reutilizar dados de API ainda válidos na mesma key;
6. aguardar uma leitura bem-sucedida antes de abrir o rascunho; durante isso, desabilitar o
   botão e anunciar loading. Falha mostra erro/retry de leitura e não abre dados fictícios.

Essa query é independente do intervalo/filtros visíveis, mas não é uma API nova nem uma busca
sem intervalo. Se a visão atual já for exatamente o dia de hoje sem filtros, a key é idêntica e
o cache/request é compartilhado. Ela pertence ao prefixo normal e é limpa com a sessão.

### 8.3. Sugestão determinística

Com os logs não filtrados do dia:

- `end` é o instante `now` capturado;
- se existe um último `endsAt < now`, `start` é esse fim, garantindo o gap livre mais recente;
- sem log anterior, `start` é `now - 30 minutos` em duração absoluta, limitado ao início real
  do dia civil;
- se o último fim é igual a `now`, se algum dado inconsistente termina depois de `now` ou se o
  intervalo resultante não é positivo/livre, não abrir; mostrar que não há intervalo concluído
  livre terminando agora;
- um gap positivo menor que cinco minutos pode ser sugerido: cinco minutos não é regra de
  domínio. A constante mínima atual não rejeita nem expande o gap para dentro de outro log.

O resultado é apenas um rascunho editável. Guardar junto dele os instantes originais sugeridos
para que a reconversão de um horário ambíguo preserve a ocorrência exata enquanto o campo não
mudar. `now`, último fim e início do dia são instantes reais, portanto sua projeção não cria
horário inexistente; uma edição manual para horário inexistente é rejeitada normalmente.

Mesmo após a leitura, a API revalida futuro, mesmo dia e overlap no submit, cobrindo concorrência
e relógios divergentes. Não criar endpoint especial e não navegar o calendário para hoje como
pré-condição.

## 9. Criação, edição, exclusão, drag e resize

### 9.1. Mutations e locks

Criar mutations `create`, `edit`, `delete` e `schedule` com `retry: false`,
`networkMode: 'always'` e `gcTime: 0`. Capturar geração e callback `current()` no início. Um
runtime por `QueryClient` mantém locks `${generation}:${workLogId}`; criação usa chave por
instância. Um único lock cobre formulário, delete, drag e resize do mesmo Work Log.

Se lifecycle estiver `busy`/`ended`, geração mudou, UUID for inválido ou lock não for obtido,
lançar um erro local silencioso `WorkLogActionBlockedError`. Liberar lock em `finally`. O hook
`useWorkLogPending(id)` alimenta disabled state do item, botões e handles.

### 9.2. Criação e edição

- Create converte o rascunho para ISO, inclui `timeZone`, envia exatamente um POST e aguarda
  `201` antes de toast/fechamento.
- Não gerar ID e não inserir `CreatedWorkLogDto` como `WorkLogDto`. Depois do aceite, invalidar
  listas da geração e refazer as ativas. Se o refetch falhar, a criação continua aceita; o erro
  fica na leitura e a UI nunca oferece repetir automaticamente o POST.
- Edit compara com o modelo cru persistido e envia um PATCH geral com somente diferenças mais
  `timeZone`. Omissão preserva; `null` limpa. Submit sem diferença gera zero requests e pode
  fechar sem toast de sucesso.
- Em erro, manter diálogo/valores, liberar controles, exibir Alert geral e não mostrar sucesso.

### 9.3. Exclusão

Exigir confirmação acessível, não apenas apagar ao clicar. Cancelar envia zero requests;
confirmar envia exatamente um DELETE e aguarda `204`. Depois do aceite, cancelar queries da
geração, remover o ID de todas as listas cacheadas, invalidar o prefixo e refazer listas ativas.
Fechar e mostrar sucesso apenas se a geração ainda for atual. Refetch falho não restaura item
deletado nem oferece repetir DELETE.

### 9.4. Drag e resize

Preview é estado visual efêmero, não update otimista persistente do cache:

- enviar schedule apenas ao finalizar um gesto válido e se os instantes mudaram;
- drag resolve o novo início civil e preserva a duração absoluta
  `oldEndsAt - oldStartsAt`; calcular o novo fim a partir do instante;
- resize resolve apenas a borda alterada e preserva a borda original;
- converter com o timezone atual, incluir `timeZone` e nunca usar `toISOString()` sobre a
  coordenada civil;
- horário inexistente, ordem inválida, mesmo dia inválido, futuro conhecido, drop cancelado ou
  na origem envia zero requests;
- durante a mutation, bloquear ações concorrentes daquele ID.

Em `204`, atualizar deterministicamente `startsAt`/`endsAt` nos DTOs cacheados, remover o item
das listas cujo `[from,to)` ele deixou de interceptar e invalidar/refazer listas ativas. Relações
e filtros não mudam em schedule. Somente depois do aceite/reconciliação um item movido para fora
desaparece. Em falha, retirar preview, restaurar posição/tamanho anterior, liberar lock e mostrar
Alert sem toast.

O diálogo Start/End permanece alternativa para teclado e touch. Handles não podem ser a única
forma de editar horário.

### 9.5. Reconciliação da edição geral

Depois de `204`, cancelar listas antes de alterá-las. Aplicar localmente somente dados
determinísticos:

- texto, descrição, timestamps e limpeza explícita de relação para `null` podem ser refletidos;
- reavaliar interseção da key e filtros normalizados quando os dados necessários forem conhecidos;
- ao trocar Task/Category para um ID não nulo sem resumo exato retornado pela API, não fabricar
  título/nome/cor. Remover temporariamente o item afetado das listas e exigir refetch, ou manter
  a lista invalidada sem publicar uma representação falsa; a implementação deve escolher a
  primeira opção para evitar exibir relação antiga como nova;
- invalidar e refazer as listas ativas em todos os casos.

Essa política evita duplicidade: writes aceitas nunca são repetidas para compensar GET falho.
Updates otimistas persistentes completos não são adotados porque POST/PATCH não devolvem a forma
de leitura e a coleção é particionada por intervalo/filtros. Apenas delete, schedule e patches
com informação suficiente recebem reconciliação local determinística e posterior refetch.

## 10. Formulário e validação

Criar `use-work-log-form.ts` seguindo o padrão de Plans. Usar React Hook Form, Zod e
`zodResolver`. O schema cobre:

- title obrigatório, máximo 255;
- description até 1000;
- `startDate`/`endDate` como coordenadas civis obrigatórias;
- `taskId`/`categoryId` como UUID nullable no formulário;
- ID do Work Log como UUID antes da mutation;
- preferência `timeZone` IANA válida e no máximo 255 antes do envio.

Validações que dependem de timezone ocorrem depois de `calendarRangeToIso` ou em schema factory
que receba explicitamente o timezone. A ordem absoluta, mesmo dia civil e futuro são associadas
ao campo adequado. Overlap conhecido aparece em Alert/regra de intervalo, não como garantia de
que a coleção está completa.

Create omite description vazia e relações nulas. Edit distingue valor inalterado/omitido de
limpeza explícita `null`. Timestamps só entram no body quando mudaram; `timeZone` sempre entra.

Erros locais usam `FieldError`, `aria-invalid`, descrição associada e foco no primeiro campo
inválido. Erros HTTP ficam em `Alert` geral e nunca são injetados artificialmente em
`formState.errors`. A mutation não reseta o formulário em falha. Fechamento por Escape, botão
ou overlay é bloqueado enquanto a escrita está em voo para não perder estado/feedback.

Tasks e Categories continuam vindo das fontes reais integradas. Loading, erro e retry dos
seletores não se confundem com lista vazia. “No task” e “No category” continuam selecionáveis;
criar/editar sem vínculos permanece possível se uma fonte falhar. Em edição, os resumos do GET
mantêm o label/cor do vínculo atual mesmo sem join global.

## 11. Tratamento de erros

Criar `getWorkLogError(error, operation)` baseado defensivamente no status, sem exibir corpo
bruto, stack, mensagem técnica ou depender da mensagem literal para classificar causas.

| Falha | Semântica e comportamento |
| --- | --- |
| cancelamento intencional | silencioso; nenhum Alert/toast/revalidação |
| rede/sem resposta | mensagem de conexão; leitura oferece retry, mutation preserva rascunho |
| `400` no GET | intervalo/filtros inválidos; Alert e retry/reset apenas da leitura |
| `400` em create/edit/schedule | DTO, timezone, ordem, mesmo dia, futuro ou overlap; manter diálogo/preview anterior e mostrar mensagem contextual genérica |
| `401` | revalidar perfil; encerrar sessão somente se a revalidação confirmar expiração |
| `404` no create | Task ou Category selecionada ausente/alheia; manter rascunho |
| `404` no edit | Work Log ou relação ausente/alheia são indistinguíveis; manter rascunho, marcar alvo indisponível e invalidar listas |
| `404` no schedule/delete | Work Log ausente/alheio; restaurar preview se houver, remover/inutilizar alvo e invalidar listas |
| `5xx` | serviço indisponível; nenhuma repetição automática de mutation |

Um `404` não encerra sessão válida. Após `404` de edit/delete/schedule, cancelar a leitura
relevante, remover o ID conhecido de caches da geração quando seguro, invalidar/refazer as
listas e impedir nova escrita naquele diálogo. No create, não remover nenhum Work Log: a falha
é de relação. A resposta atual do edit colapsa Work Log ausente e relação ausente em “Work log
not found”; por isso a mensagem pública deve admitir ambas.

Todos os erros de escrita mantêm o formulário aberto, exceto quando a sessão realmente termina
e a navegação de Identity assume o controle. Drag/resize restaura o visual. Somente sucesso HTTP
confirmado permite toast de sucesso.

## 12. Cache, concorrência e sessão

### 12.1. Ordem das operações de cache

`work-log-cache.ts` concentra operações, sem espalhar loops de cache em componentes:

1. capturar geração/current e executar a call;
2. se falhar, revalidar somente `401` e aplicar reconciliação de `404` quando cabível;
3. se aceita e ainda atual, cancelar `workLogKeys.lists(generation)`;
4. aplicar atualização determinística descrita na seção 9;
5. invalidar com `refetchType: 'none'`;
6. iniciar `refetchQueries({ type: 'active' })` sem transformar falha de leitura em falha da
   mutation já aceita.

Esse sequenciamento também cobre a corrida em que `record-as-done` invalida enquanto um GET de
Work Logs está em voo: a invalidação/cancelamento faz a leitura ativa convergir para o servidor;
nenhum Work Log é fabricado a partir do Plan.

### 12.2. Ciclo de sessão

Estender `clearIdentity` para cancelar/remover `workLogKeys.all`, mutations de Work Logs e a
query lazy de “Log now” (já contida no mesmo prefixo). Limpar também locks/runtime e todo preview,
erro ou diálogo local quando `generation` mudar.

Toda query e mutation captura a geração. Requests atrasadas da conta anterior não podem:

- escrever cache ou estado visual;
- fechar diálogo;
- emitir toast;
- manter/recriar preview ou lock;
- alimentar “Log now” ou resumo;
- reintroduzir dados pelo antigo atom/closure.

O transporte de uma mutation em voo pode não ser cancelável, mas seus efeitos de frontend são
ignorados após troca de geração. Remover o store Jotai elimina a segunda fonte capaz de vazar
estado entre contas.

## 13. Relações com Plans, Tasks e Categories

### 13.1. Plans

Confirmar um Plan continua fazendo exatamente um
`POST /api/plans/:planId/record-as-done` com `timeZone`. O frontend de Work Logs não chama POST,
PATCH ou GET extra como parte dessa operação, não cria ID/timestamps e não tenta reproduzir a
transação. Após `204`, o hook de Plans invalida `workLogKeys.all`; uma query operacional ativa
refaz a leitura e exibe o Work Log se ele satisfizer intervalo/filtros.

O backend atual cria Work Log e salva Plan em dois awaits sem transação explícita, limitação já
registrada na SPEC de Plans. Esta integração não corrige nem mascara essa pendência do backend.

### 13.2. Exclusão de Task/Category

As FKs Prisma usam `ON DELETE SET NULL`. Após DELETE aceito de Task ou Category:

- não percorrer Work Logs localmente e não enviar PATCH por Work Log;
- invalidar `workLogKeys.lists(generation)` além das invalidações de Plans já existentes;
- deixar o GET retornar `task: null` ou `category: null`;
- manter Work Log e seus instantes intactos.

Uma query em voo é cancelada/invalida antes do refetch para não repor o resumo removido por
resposta antiga. Se o refetch falhar, o estado da leitura comunica erro; fixture não aparece.

### 13.3. Renderização de relações

Itens carregados usam `workLog.task.title` e `workLog.category` do próprio GET. Não fazer cada
item depender da coleção global. As fontes reais de Tasks/Categories servem filtros e seletores,
com loading/erro/retry próprios. Uma cor desconhecida usa fallback visual de não categorizado,
mas a Category e seu ID continuam presentes semanticamente.

## 14. Consumidores atuais e migração do store

A busca atual encontrou cinco consumidores diretos de `useWorkLogs` e os seguintes consumidores
indiretos de arrays/helpers:

| Consumidor | Adaptação mínima |
| --- | --- |
| `app/pages/registers/work-logs/index.tsx` | remover store/CRUD local; manter fontes reais de Task/Category e delegar query/mutations por intervalo ao calendário |
| `app/pages/registers/work-logs/components/work-logs-calendar.tsx` | publicar intervalo, montar request/filtros, renderizar estados, usar hooks de mutation, preview, locks e Log now |
| `app/pages/analytics/dashboard/index.tsx` | importar fixture imutável própria do Dashboard; não usar query operacional |
| `app/pages/analytics/reports/index.tsx` | importar fixture imutável própria de Reports; filtros/exports continuam simulados |
| `app/pages/settings/hooks/use-delete-category-dialog.ts` | remover `clearCategory`; invalidar prefixo Work Logs da geração atual após DELETE aceito |
| `app/pages/registers/tasks/components/delete-task-dialog.tsx` | remover `clearTask`; invalidar prefixo Work Logs da geração atual após DELETE aceito |
| `features/plans/hooks/use-plan-mutations.ts` | usar a constante definitiva `workLogKeys.all` na invalidação de confirmação |
| `work-log-rules.ts` | manter helpers puros úteis, agora sobre instantes/timezone e sem criação/ID local |
| `work-log-contributions.ts`, `dashboard-insights.ts`, `work-log-report.ts` | continuar recebendo arrays, mas exclusivamente das fixtures administrativas nos protótipos |

`work-logs-store.ts` deve ser removido. `WORK_LOGS_MOCK` não permanece como coleção operacional
compartilhada. Criar fixtures separadas, por exemplo
`analytics/dashboard/fixtures/dashboard-work-logs.ts` e
`analytics/reports/fixtures/report-work-logs.ts`, congeladas ou tipadas `readonly` e copiadas
somente quando um cálculo exigir mutabilidade. Elas podem reutilizar um tipo prototípico puro,
mas uma tela não observa mutações da outra.

Dashboard e Reports podem continuar usando Tasks/Categories reais conforme o comportamento
atual, mas seus Work Logs e cálculos continuam explicitamente protótipos. O gráfico anual não
autoriza buscar histórico real. Helpers de contribuição/agregação não devem ser conectados à
query operacional por intervalo.

## 15. Arquivos e responsabilidades previstos

### 15.1. Criar

| Arquivo | Responsabilidade |
| --- | --- |
| `src/api/fetch-work-logs.ts` | GET, query repetida, `AbortSignal`, response tipada |
| `src/api/create-work-log.ts` | POST e receipt `201` |
| `src/api/edit-work-log.ts` | PATCH geral `204` |
| `src/api/edit-work-log-schedule.ts` | PATCH de horário `204` |
| `src/api/delete-work-log.ts` | DELETE `204` |
| `features/work-logs/model/work-log-api-types.ts` | DTOs JSON, receipt, aliases de ID/timestamp |
| `features/work-logs/model/work-log-mappers.ts` | GET/POST normalizados e projeção visual |
| `features/work-logs/model/work-log-query-keys.ts` | prefixos e normalização de filtros |
| `features/work-logs/model/work-log-cache.ts` | cancelamento, patch/remove, interseção e reconciliação |
| `features/work-logs/model/work-log-errors.ts` | classificação segura de erros |
| `features/work-logs/model/work-log-runtime.ts` | locks por geração/ID e limpeza |
| `features/work-logs/hooks/use-work-logs-query.ts` | leitura por intervalo, sessão e timezone |
| `features/work-logs/hooks/use-work-log-mutations.ts` | create/edit/delete/schedule e efeitos protegidos |
| `features/work-logs/hooks/use-work-log-pending.ts` | estado observável de locks |
| `features/work-logs/hooks/use-work-log-form.ts` | RHF/Zod, diff, DST, pending e erro HTTP |
| `features/work-logs/hooks/use-log-now.ts` | query lazy do dia atual e rascunho determinístico |
| fixtures próprias de Dashboard e Reports | dados administrativos imutáveis, sem fallback operacional |

### 15.2. Alterar

| Área/arquivo | Responsabilidade |
| --- | --- |
| `work-log-types.ts` | separar `WorkLog`, receipt e `WorkLogCalendarItem` |
| `work-log-schema.ts` | limites reais, UUIDs e validação compatível com timezone |
| `work-log-rules.ts`/`work-log-constants.ts` | derivações puras, Log now e `day/week/month` |
| página, `work-logs-calendar.tsx`, diálogo, filtros e item | orquestração async, resumos do GET, acessibilidade e nenhum store |
| `features/identity/hooks/use-end-session.ts` | cancelar/remover queries, mutations e runtime de Work Logs |
| deletes de Task/Category | trocar limpeza local por invalidação da geração atual |
| `features/plans/hooks/use-plan-mutations.ts` | importar o prefixo definitivo de Work Logs |
| Dashboard/Reports e seus modelos | receber fixtures próprias sem depender da query operacional |
| helpers compartilhados de timezone/calendário | somente extensões pequenas se um helper comprovadamente faltar; não duplicar lógica |

### 15.3. Remover ou restringir

- remover `features/work-logs/store/work-logs-store.ts`;
- remover `createWorkLog` local que gera UUID/timestamps;
- remover ou restringir `features/work-logs/mocks/work-logs.ts` depois de migrar dados necessários
  para fixtures administrativas próprias;
- remover filtros client-side da página operacional e usos de `Date.toISOString()` em datas
  civis;
- não remover helpers de formatação/agregação que ainda tenham consumidores legítimos.

Pseudocódigo fica limitado às decisões acima; o plano posterior deve decompor a execução sem
reabrir contratos, timezone, estratégia de cache ou fronteiras administrativas.

## 16. Critérios de aceite da implementação futura

1. As cinco calls correspondem exatamente aos controllers, DTOs e presenters reais em método,
   rota, path/query/body, status e response.
2. GET encaminha `AbortSignal`; nenhuma call de `204` chama `.json()`; todas usam `retry: 0`.
3. Nenhuma call envia `userId`, token/cookie manual ou campo ausente dos DTOs.
4. DTO de GET com resumos e DTO de POST com IDs permanecem distintos; nenhum resumo é fabricado.
5. React Query é a única fonte operacional; não existe hook sem intervalo nem fallback mockado.
6. Query key contém prefixo `work-logs`, geração, `from`, `to` e filtros normalizados.
7. IDs repetidos são únicos/ordenados; sentinelas não são enviadas como IDs.
8. Múltiplos valores preservam OR dentro da faceta e Task/Category combinam com AND.
9. Dia consulta `[início civil, início do próximo dia)` no timezone configurado.
10. Semana sempre consulta segunda 00:00 até a segunda seguinte, sete dias civis completos.
11. Mostrar/ocultar fins de semana não muda key, não cancela e não gera GET.
12. Mês consulta primeira célula até manhã posterior à última, incluindo meses adjacentes.
13. Work Logs que satisfazem `startsAt < to AND endsAt > from` aparecem; os que apenas tocam a
    borda externa ficam fora.
14. Antes do intervalo, loading, vazio, dados, erro inicial, refetch com cache e retry são
    estados distintos e acessíveis.
15. Navegação rápida cancela requests obsoletos e nunca pinta dados do intervalo anterior no novo.
16. Voltar a intervalo visitado reutiliza cache; somente leitura oferece retry explícito.
17. Resumo usa apenas intervalo/filtros atuais; minutos não rastreados diários são client-side.
18. Timezone do navegador diferente da preferência não muda interpretação nem timestamps.
19. Instantes recebidos são apresentados no timezone configurado e campos civis são convertidos
    antes da mutation, sem `toISOString()` direto.
20. Create, edit e schedule sempre enviam `timeZone`; timezone não é persistido no modelo.
21. Mudar timezone reprojeta UI/formulário, hoje e query, sem alterar instantes persistidos.
22. Horário DST inexistente bloqueia a request com erro de campo; horário ambíguo usa `earlier`
    por padrão e preserva o instante original quando o civil não mudou.
23. Limites civis admitem dias de 23/25 horas e não usam fim-do-dia artificial ou UTC fixo.
24. `endsAt > startsAt`, mesmo dia civil e fim não futuro são pré-validados e confirmados pela API.
25. Intervalos adjacentes são aceitos; overlaps conhecidos são rejeitados localmente e ausência
    em coleção parcial nunca é tratada como prova global.
26. O erro de overlap é público e genérico, sem inventar o Work Log conflitante.
27. “Log now” funciona com outro dia/intervalo aberto e ignora filtros da visão.
28. “Log now” consulta/reutiliza o dia civil atual completo, não cria endpoint e não usa fixture.
29. Rascunho de “Log now” não cruza início do dia, não expande gap curto sobre outro log e trata
    intervalo zero/conflitante, DST inexistente e ambíguo conforme a seção 8.
30. Duração padrão é apenas UX; cinco minutos nunca vira regra de validação.
31. Create envia uma mutation, aguarda `201`, usa ID do servidor e só então fecha/exibe sucesso.
32. Edit envia um PATCH com diferenças e `timeZone`; submit sem mudança envia zero requests.
33. Delete exige confirmação, cancelamento envia zero e confirmação envia exatamente um DELETE.
34. Drag/resize envia um schedule somente ao fim válido e com mudança efetiva.
35. Drag preserva duração absoluta; resize altera a borda correta; ambos mantêm alternativa por
    formulário para teclado/touch.
36. Ações concorrentes do mesmo Work Log ficam bloqueadas durante qualquer mutation.
37. Falha de escrita restaura preview, mantém rascunho, libera controles e não mostra sucesso.
38. Item movido para fora só desaparece depois do `204` e reconciliação.
39. POST/PATCH sem forma de leitura suficiente preferem invalidação/refetch; relações não são
    preenchidas com joins ou resumos inventados.
40. Write aceita seguida de refetch falho não duplica mutation nem toast e deixa retry apenas no GET.
41. Rede, `400`, `401`, `404`, `5xx` e aborto recebem tratamento distinto e mensagens seguras.
42. `404` de Work Log/relação não encerra sessão; edit/delete/schedule invalidam a lista obsoleta.
43. Tasks/Categories em loading/erro não impedem Work Log sem vínculo; seletores preservam estado
    e oferecem retry.
44. Itens usam resumos do GET para título/cor, sem depender de joins globais.
45. Confirmação de Plan faz uma única call de Plans e o novo Work Log aparece após
    invalidação/refetch do mesmo prefixo.
46. Confirmação não fabrica Work Log, ID ou timestamp e não implementa operação composta no módulo.
47. Exclusão de Task/Category não envia PATCH de Work Log; refetch mostra relação nula.
48. Dashboard e Reports usam fixtures próprias imutáveis, sem query operacional ou fallback.
49. Store/atom de Work Logs deixa de existir como persistência compartilhada.
50. Logout/login cancela/remove queries, mutations, Log now, previews e locks; resposta atrasada
    da conta anterior não produz cache, UI ou toast.
51. Labels, ARIA, foco, teclado, touch e bloqueio de fechamento durante pending continuam usáveis.
52. Não há alteração em backend, expansão administrativa, redesign, projetos, subtarefas,
    recorrência, timer ou tracking em tempo real.

## 17. Verificação

### 17.1. Verificação estática

Executar da raiz e registrar resultados separadamente:

```bash
pnpm --dir web run typecheck
pnpm --dir web exec tsc --noEmit -p tsconfig.app.json
pnpm --dir web run build
git diff --check
```

Executar também o Biome somente nos arquivos alterados, conforme a configuração do repositório.
Não corrigir arquivos fora do escopo para obter saída limpa. Separar diagnósticos preexistentes
de regressões introduzidas. Typecheck, compilação explícita do projeto React e build devem ser
registrados mesmo quando pareçam redundantes.

Testes focais são adequados para helpers puros de limites/timezone/Log now, normalização de
query e reconciliação. Não adicionar runner ou infraestrutura transversal apenas para esta
integração.

### 17.2. Validação manual com API autenticada e Network

Iniciar API/web, autenticar e verificar método, URL, cookies, parâmetros repetidos, body,
status, quantidade de requests e ausência de parse em `204`. Cobrir:

- dia, semana completa com fins de semana ocultos/exibidos e grid mensal com células adjacentes;
- itens contidos, atravessando `from`/`to` e tocando as bordas semiabertas;
- filtros isolados/combinados, múltiplos IDs, sem Task e sem Category;
- timezone negativo (`America/Sao_Paulo`/`America/New_York`) e positivo
  (`Asia/Tokyo`/`Pacific/Auckland`) com navegador em outro timezone;
- mudança de timezone sem alteração de instantes persistidos;
- transições DST com horário inexistente, repetido e dias de 23/25 horas;
- intervalos adjacentes, tentativa de overlap, fim futuro e limite civil de meia-noite;
- create/edit/delete, limpeza de relações, falhas `400`/`404`/rede/`5xx` e refetch falho;
- drag/resize válido, sem mudança, concorrente, para fora do intervalo e rollback visual;
- navegação rápida com throttling, cancelamento, cache anterior, vazio e retry;
- “Log now” com outro dia aberto, filtros ativos, começo do dia, gap curto e nenhum gap;
- confirmação de Plan com query em voo e aparecimento do Work Log após refetch;
- exclusão de Task e Category com relação nula após refetch;
- logout/login entre duas contas enquanto GET, Log now e mutation estão atrasados;
- navegação por teclado, foco visível, labels, touch e edição por formulário.

A matriz manual deve registrar separadamente problemas preexistentes do calendário/API e
regressões da implementação. Esta SPEC não autoriza corrigir diagnósticos alheios ao
escopo.

## 18. Registro da implementação

A integração foi implementada exclusivamente no frontend: cinco calls Ky tipadas, modelos de
transporte/leitura/calendário separados, React Query por geração/intervalo/filtros, mutations
com locks, reconciliação determinística, projeção temporal com `@js-temporal/polyfill`, “Log
now” lazy e remoção do store operacional Jotai. Dashboard e Reports passaram a usar fixtures
administrativas próprias e imutáveis. Nenhum arquivo em `api/` foi alterado.

Verificação executada:

- `pnpm --dir web run typecheck`: aprovado;
- `pnpm --dir web exec tsc --noEmit -p tsconfig.app.json`: mantém somente os sete diagnósticos
  preexistentes em `product-showcase.tsx` e `radial-metric-card.tsx`, sem novo diagnóstico;
- `pnpm --dir web run build`: aprovado, mantendo o aviso preexistente de bundle acima de 500 kB;
- Biome somente nos arquivos TypeScript alterados: sem erros; permanece o aviso preexistente
  `lint/performance/noAccumulatingSpread` em `work-log-report.ts`;
- `git diff --check`: aprovado; o Git apenas informou normalização futura de LF para CRLF;
- testes focais dos helpers confirmaram normalização/ordenação de filtros, intervalos
  semiabertos, adjacência e overlap, sugestão de “Log now” sem expandir gap curto,
  reconciliação para fora do cache, horário DST inexistente/repetido e dias de 23/25 horas;
- smoke manual com API autenticada confirmou carregamento e navegação de dia/semana/mês,
  filtro remoto, “Log now”, validação obrigatória e foco, criação, edição, submit sem mudanças,
  confirmação acessível/cancelamento de exclusão e ausência de erros no console. O registro
  criado exclusivamente para o smoke foi removido ao final.

A matriz manual completa de falhas de rede/status, timezones opostos, drag/resize, limpeza de
relações, confirmação de Plan e troca de conta durante operações em voo não foi executada nesta
entrega e continua sendo necessária antes da validação de produção desses cenários.
