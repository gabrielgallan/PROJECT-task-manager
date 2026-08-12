# Backend — use cases exigidos pelo frontend

Resumo das funcionalidades que a API deverá disponibilizar para substituir os mocks e stores locais do frontend. Os nomes abaixo representam use cases e não precisam corresponder individualmente a endpoints HTTP.

## Convenções

- Todos os recursos pertencem ao usuário autenticado.
- IDs e timestamps são gerados pelo backend.
- Datas são transmitidas em ISO 8601, preferencialmente em UTC.
- Plans e Work Logs podem existir sem Task.
- Excluir uma Task não deve excluir seus Plans ou Work Logs.
- Validações do frontend também devem existir no backend.

```ts
type Page<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  pageCount: number
}

type DeleteResult = { deletedId: string }
```

## Autenticação

### Sign In

- `AuthenticateWithPassword({ email, password }) -> AuthSessionDto`
- `BeginOAuthAuthentication({ provider: 'google' | 'github' }) -> { authorizationUrl }`
- `CompleteOAuthAuthentication({ provider, code, state }) -> AuthSessionDto`
- `GetCurrentSession() -> AuthSessionDto | null`
- `SignOut() -> { success: true }`

### Sign Up

- `RegisterUser({ name?, email, password }) -> AuthSessionDto`

### Forgot Password

- `RequestPasswordRecovery({ email }) -> { accepted: true }`

O fluxo atual ainda não possui páginas para validar o código/link de recuperação e cadastrar a nova senha.

## Tasks

```ts
type TaskStatus = 'backlog' | 'in_progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

type TaskDto = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  startDate: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

type TaskFilters = {
  search?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
}
```

### Table

- `ListTasksPaginated(filters, sort, page, pageSize) -> Page<TaskDto>`
- Ordenação disponível por `title`, `status`, `priority`, `updatedAt` e `dueDate`.

### Kanban e Timeline

- `ListTasks(filters) -> TaskDto[]`
- Compartilha os filtros da Table, mas não utiliza paginação.

### Detalhes e ações

- `GetTaskDetails({ taskId }) -> TaskDetailsDto`
- `CreateTask(input) -> TaskDto`
- `UpdateTask({ taskId, ...input }) -> TaskDto`
- `ChangeTaskStatus({ taskId, status }) -> TaskDto`
- `RescheduleTask({ taskId, startDate, dueDate }) -> TaskDto`
- `DeleteTask({ taskId }) -> DeleteResult`
- `ListTaskOptions() -> Array<{ id, title }>` para Plans, Work Logs e Reports.

```ts
type TaskDetailsDto = {
  task: TaskDto
  plannedMinutes: number
  loggedMinutes: number
  balanceMinutes: number | null
  activity: Array<{
    id: string
    kind: 'plan' | 'work-log'
    title: string
    startDate: string
    endDate: string
    confirmed?: boolean
  }>
}
```

## Plans

```ts
type PlanDto = {
  id: string
  title: string
  description: string | null
  color: string
  startDate: string
  endDate: string
  taskId: string | null
  confirmedAt: string | null
}
```

### Calendário

- `ListPlansInRange({ from, to, taskIds?, includeUnassigned? }) -> PlanDto[]`
- `CreatePlan(input) -> PlanDto`
- `UpdatePlan({ planId, ...input }) -> PlanDto`
- `ReschedulePlan({ planId, startDate, endDate }) -> PlanDto`
- `DeletePlan({ planId }) -> DeleteResult`

As views Day, Week e Month consultam o intervalo visível e não exigem paginação.

### Record as done

- `RecordPlanAsDone({ planId }) -> { plan: PlanDto, workLog: WorkLogDto }`

Essa operação deve ser transacional. Ela cria o Work Log e marca `confirmedAt`, rejeitando Plans futuros, já confirmados ou que gerem conflito de horário.

## Work Logs

```ts
type WorkLogDto = {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  taskId: string | null
  createdAt: string
  updatedAt: string
}
```

### Calendário

- `ListWorkLogsInRange({ from, to, taskIds?, includeUnassigned? }) -> WorkLogDto[]`
- `GetSuggestedLogNowRange() -> { startDate, endDate }`
- `CreateWorkLog(input) -> WorkLogDto`
- `UpdateWorkLog({ workLogId, ...input }) -> WorkLogDto`
- `RescheduleWorkLog({ workLogId, startDate, endDate }) -> WorkLogDto`
- `DeleteWorkLog({ workLogId }) -> DeleteResult`

As views Day, Week e Agenda não exigem paginação. O backend deve impedir intervalos futuros, atravessando a meia-noite ou sobrepostos a outro Work Log do usuário.

## Dashboard

- `GetDashboardOverview({ referenceDate, timezone }) -> DashboardOverviewDto`
- `GetPlannedVsLoggedSeries({ days: 7 | 30 | 90, timezone }) -> DailyWorkPointDto[]`

O overview deve retornar:

- Tasks atrasadas e próximas do vencimento, incluindo comparação semanal.
- Minutos planejados e registrados na semana atual.
- Plans de hoje.
- Contribuições diárias de Work Logs no ano.
- Tasks com mais tempo registrado no ano.

```ts
type DailyWorkPointDto = {
  date: string
  plannedMinutes: number
  loggedMinutes: number
}
```

Antes da integração, o segundo stat card precisa ser corrigido: está rotulado como `Completed tasks`, mas recebe contagens de vencimentos futuros. Os deltas semanais também ainda são mocks.

## Reports

- `GenerateWorkLogReport({ from, to, taskIds?, includeUnassigned?, groupBy }) -> WorkLogReportDto`
- `ExportWorkLogReport({ filtros, groupBy, columns, format }) -> arquivo`
- Formatos atuais: `csv` e `xlsx`.

O relatório deve retornar os Work Logs selecionados e um resumo contendo total de minutos, quantidade de registros, dias ativos, Tasks envolvidas e minutos sem Task.

## Settings

### Profile

- `GetCurrentUserProfile() -> UserProfileDto`
- `UpdateCurrentUserProfile(input) -> UserProfileDto`
- `DeleteCurrentUserAccount() -> { deleted: true }`

```ts
type UserProfileDto = {
  id: string
  name: string
  email: string
  username: string
  jobTitle: string
  avatarUrl: string | null
}
```

O avatar permanece somente leitura no MVP.

### Security

- `ChangePassword({ currentPassword, newPassword }) -> { success: true }`
- `ListActiveSessions() -> ActiveSessionDto[]`
- `RevokeSession({ sessionId }) -> DeleteResult`

Uma sessão precisa informar navegador, sistema operacional, tipo de dispositivo, último acesso e se é a sessão atual.

### Notifications

- `GetNotificationSettings() -> NotificationSettingsDto`
- `UpdateNotificationSettings(input) -> NotificationSettingsDto`

As preferências incluem canais in-app/browser, lembrete de Plan com antecedência de 5, 10, 15 ou 30 minutos e resumo diário com horário `HH:mm`. A permissão da API `Notification` continua sendo responsabilidade do navegador.

## Fora do escopo da API

- Theme, language e timezone enquanto permanecerem no localStorage.
- View e formato dos calendários.
- Estado da sidebar armazenado em cookie.
- Command global, que atualmente pesquisa apenas rotas e ações estáticas.

## Ordem sugerida

1. Autenticação e sessão.
2. Queries e CRUD de Tasks.
3. Queries por intervalo e CRUD de Plans.
4. Queries por intervalo e CRUD de Work Logs.
5. Profile, Security e Notifications.
6. Dashboard agregado.
7. Reports e exportações.
