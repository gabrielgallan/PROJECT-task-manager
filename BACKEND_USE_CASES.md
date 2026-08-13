# Backend — use cases exigidos pelo frontend

Mapa resumido dos casos de uso e consultas necessários para substituir os mocks e stores locais. As rotas são referências de contrato; a implementação pode agrupá-las de outra forma desde que preserve os comportamentos descritos.

## Convenções gerais

- Todos os recursos pertencem ao usuário autenticado.
- IDs e timestamps são gerados pelo backend.
- Datas trafegam em ISO 8601, preferencialmente UTC; consultas dependentes do dia recebem `timezone` quando necessário.
- Task, Category, Plan e Work Log são recursos independentes.
- `taskId` e `categoryId` são opcionais em Plans e Work Logs.
- Excluir uma Task ou Category mantém os registros relacionados e define a respectiva referência como `null`.
- Em filtros com múltiplos valores, os valores da mesma faceta usam OR; facetas diferentes usam AND.
- As validações existentes no frontend também devem ser aplicadas no backend.

## Autenticação

- `POST /auth/sign-in` — email e senha.
- `POST /auth/sign-up` — nome, email e senha.
- `POST /auth/oauth/:provider/start` — iniciar Google ou GitHub.
- `GET /auth/oauth/:provider/callback` — concluir autenticação OAuth.
- `GET /auth/session` — sessão atual.
- `DELETE /auth/session` — encerrar sessão atual.
- `POST /auth/password-recovery` — solicitar recuperação de senha.

O fluxo para validar o link de recuperação e cadastrar uma nova senha ainda não possui interface no frontend.

## Tasks

### Listagem

- `GET /tasks`
  - Parâmetros: `q`, `status[]`, `priority[]`, `sortBy`, `sortDir`, `page`, `pageSize`.
  - Pesquisa por título e descrição.
  - Ordenação por `title`, `status`, `priority`, `updatedAt` ou `dueDate`.
  - Ordem de status: `backlog`, `in_progress`, `done`.
  - Ordem de prioridade: `low`, `medium`, `high`, `critical`.
  - `dueDate` nulo fica no fim, independentemente da direção.
  - A List usa paginação; Board e Timeline solicitam todos os resultados filtrados.

### Pesquisa para comboboxes

- `GET /tasks/options`
  - Parâmetros: `q`, `cursor` e `limit`.
  - Pesquisa por título.
  - Retorna somente `id` e `title`.
  - Usado nos formulários de Plans e Work Logs e nos filtros de Reports.
  - Deve continuar retornando a opção selecionada pelo ID quando ela não estiver na página atual da pesquisa.

### Detalhes e comandos

- `GET /tasks/:taskId` — Task, totais planejado/registrado/balanço e atividade combinada de Plans e Work Logs.
- `POST /tasks` — criar Task.
- `PATCH /tasks/:taskId` — editar dados gerais.
- `PATCH /tasks/:taskId/status` — mover entre colunas do Board.
- `PATCH /tasks/:taskId/schedule` — alterar início e entrega pela Timeline.
- `DELETE /tasks/:taskId` — excluir e desassociar Plans e Work Logs.

## Categories

### Consultas e CRUD

- `GET /categories`
  - Parâmetros opcionais: `q` e `sort`.
  - Ordenação padrão por nome.
  - Usado em Settings, comboboxes e filtros.
- `GET /categories/:categoryId/deletion-impact` — quantidade de Plans e Work Logs que ficarão sem Category.
- `POST /categories` — nome e cor.
- `PATCH /categories/:categoryId` — alterar nome ou cor; a nova cor vale imediatamente para todos os registros relacionados.
- `DELETE /categories/:categoryId` — excluir e definir `categoryId = null` nos Plans e Work Logs relacionados.

O nome deve ter entre 1 e 40 caracteres e ser único por usuário, ignorando caixa e espaços externos. As cores aceitas são:

`blue`, `sky`, `cyan`, `slate`, `teal`, `green`, `lime`, `emerald`, `red`, `rose`, `yellow`, `amber`, `orange`, `indigo`, `violet`, `purple`, `fuchsia` e `pink`.

### Preferência visual

- `GET /settings/calendar-preferences` — inclui `uncategorizedColor`.
- `PATCH /settings/calendar-preferences` — altera a cor usada por Plans e Work Logs sem Category.

## Plans

### Calendário

- `GET /plans`
  - Obrigatórios: `from` e `to`.
  - Filtros: `taskIds[]`, `categoryIds[]`, `withoutTask`, `withoutCategory`.
  - Ordenação padrão: `startDate ASC`.
  - Retorna Plans com resumos de `task` e `category` incluídos.
  - Atende as views Day, Week e Month, sem paginação.
- `POST /plans` — aceita `taskId` e `categoryId` opcionais.
- `PATCH /plans/:planId` — editar conteúdo e relações.
- `PATCH /plans/:planId/schedule` — mover ou redimensionar no calendário.
- `DELETE /plans/:planId`.

### Registrar como concluído

- `POST /plans/:planId/record-as-done`
  - Cria um Work Log com Task e Category herdadas do Plan.
  - Marca `confirmedAt` no Plan.
  - Operação transacional.
  - Rejeita Plan futuro, já confirmado ou cujo período conflite com outro Work Log.

## Work Logs

### Calendário

- `GET /work-logs`
  - Obrigatórios: `from` e `to`.
  - Filtros: `taskIds[]`, `categoryIds[]`, `withoutTask`, `withoutCategory`.
  - Ordenação padrão: `startDate ASC`.
  - Retorna Work Logs com resumos de `task` e `category` incluídos.
  - Atende as views Day, Week e Agenda, sem paginação.
- `GET /work-logs/suggested-range` — intervalo sugerido para “Log now”.
- `POST /work-logs` — aceita `taskId` e `categoryId` opcionais.
- `PATCH /work-logs/:workLogId` — editar conteúdo e relações.
- `PATCH /work-logs/:workLogId/schedule` — mover ou redimensionar no calendário.
- `DELETE /work-logs/:workLogId`.

O backend deve rejeitar intervalos futuros, com fim anterior ao início, atravessando a meia-noite ou sobrepostos a outro Work Log do usuário.

## Reports

- `POST /reports/work-logs/preview`
  - Parâmetros: `from`, `to`, `taskIds[]`, `categoryIds[]`, `withoutTask`, `withoutCategory`, `groupBy` e `columns[]`.
  - `groupBy`: `day`, `task` ou `none`.
  - Colunas atuais: `date`, `start`, `end`, `duration`, `task`, `title`, `description`.
  - Retorna Work Logs com Task incluída, grupos e resumo agregado.
  - Category é necessária para filtragem, mas ainda não é coluna nem agrupamento do relatório.
- `POST /reports/work-logs/export`
  - Mesmos filtros, agrupamento e colunas do preview.
  - Formatos: `csv` e `xlsx`.

O resumo contém minutos totais, quantidade de Work Logs, dias ativos, quantidade de Tasks e minutos sem Task.

## Dashboard

- `GET /dashboard/overview`
  - Parâmetros: `referenceDate` e `timezone`.
  - Retorna Tasks atrasadas e próximas da entrega, minutos planejados e registrados na semana, Plans do dia, contribuições anuais de Work Logs e distribuição do tempo por Task.
  - Plans do dia vêm com Task e Category incluídas.
  - Distribuição do tempo vem com resumo da Task incluído.
- `GET /dashboard/planned-vs-logged`
  - Parâmetros: `days` (`7`, `30` ou `90`) e `timezone`.
  - Retorna minutos planejados e registrados por dia.

## Settings

### Perfil

- `GET /users/me`.
- `PATCH /users/me` — nome, username e cargo.
- `DELETE /users/me`.

O avatar permanece somente leitura nesta etapa.

### Segurança

- `PATCH /users/me/password` — senha atual e nova senha.
- `GET /users/me/sessions` — navegador, sistema operacional, dispositivo, último acesso e indicador da sessão atual.
- `DELETE /users/me/sessions/:sessionId`.

### Notificações

- `GET /users/me/notification-settings`.
- `PATCH /users/me/notification-settings`.

As preferências incluem canais in-app/browser, lembrete de Plan com antecedência de 5, 10, 15 ou 30 minutos e resumo diário em `HH:mm`. A permissão da API Notification continua sendo responsabilidade do navegador.

## Fora do escopo da API

- Theme e language enquanto permanecerem locais.
- View, formato de hora, finais de semana e posição dos calendários.
- Estado da sidebar.
- Command global, que atualmente pesquisa apenas rotas e ações estáticas.
- Category em Tasks.
- Category como coluna ou agrupamento de Reports.

## Ordem sugerida

1. Autenticação e sessão.
2. Tasks, incluindo listagem e pesquisa para comboboxes.
3. Categories e preferências do calendário.
4. Plans e operação “Record as done”.
5. Work Logs.
6. Perfil, segurança e notificações.
7. Dashboard.
8. Reports e exportações.
