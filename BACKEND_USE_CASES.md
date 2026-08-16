# Backend — use cases exigidos pelo frontend

Mapa resumido dos casos de uso e consultas necessários para substituir os mocks e stores locais. As rotas são referências de contrato; a implementação pode agrupá-las de outra forma desde que preserve os comportamentos descritos.

> Revisão de Identity: 16/08/2026. A seção de Identity foi confrontada com o frontend e com a implementação atual do backend. As demais seções permanecem como rascunho anterior e não foram revalidadas nesta revisão.

## Convenções gerais

- Todos os recursos pertencem ao usuário autenticado.
- IDs e timestamps são gerados pelo backend.
- Datas trafegam em ISO 8601, preferencialmente UTC; consultas dependentes do dia recebem `timezone` quando necessário.
- Task, Category, Plan e Work Log são recursos independentes.
- `taskId` e `categoryId` são opcionais em Plans e Work Logs.
- Excluir uma Task ou Category mantém os registros relacionados e define a respectiva referência como `null`.
- Em filtros com múltiplos valores, os valores da mesma faceta usam OR; facetas diferentes usam AND.
- As validações existentes no frontend também devem ser aplicadas no backend.

## Identity

Esta seção cobre somente autenticação, identificação do usuário, perfil, credenciais e sessões. Tasks, Categories, Plans, Work Logs e Notifications não fazem parte desta validação.

### Decisões refletidas pela implementação atual

- Autenticação cria uma `Session` persistida e entrega ao navegador um token opaco em cookie `session` com `httpOnly` e `sameSite=lax`.
- Somente o hash do token de sessão é persistido.
- O guard global valida a sessão e disponibiliza `userId` e `sessionId` para rotas protegidas.
- Google e GitHub usam Authorization Code: o frontend obtém o `code` do provider e o envia à API. A API faz a troca do código, identifica ou cria o usuário, vincula a `Account` e cria a sessão.
- O perfil atual não possui `username`. O email identifica o usuário, mas não é editável pelo use case de perfil.
- A sessão de domínio expira em 30 dias e pode ser revogada sem ser removida do histórico.

### Cobertura atual

Os status distinguem um use case de domínio implementado de uma funcionalidade disponível ponta a ponta.

| Fluxo visível ou necessário | Domínio | HTTP/infra | Situação para o frontend |
| --- | --- | --- | --- |
| Cadastrar com nome, email e senha | `RegisterUseCase` implementado e testado | `POST /api/users` | Coberto, com divergências de validação descritas abaixo |
| Entrar com email e senha | `AuthenticateUseCase` implementado e testado | `POST /api/sessions` cria cookie | Coberto |
| Entrar com Google | `AuthenticateWithProviderUseCase` implementado e testado | `POST /api/sessions/google` recebe `code` | Backend coberto; botão e redirect OAuth ainda são mocks no frontend |
| Entrar com GitHub | `AuthenticateWithProviderUseCase` implementado e testado | `POST /api/sessions/github` recebe `code` | Backend coberto; botão e redirect OAuth ainda são mocks no frontend |
| Validar sessão em rotas protegidas | `ValidateSessionTokenUseCase` implementado e testado | `SessionAuthGuard` global | Coberto no backend; o frontend ainda não possui proteção/bootstrapping de rotas |
| Obter usuário atual | `GetProfileUseCase` implementado e testado | `GET /api/profile` | Cobre o bootstrap da identidade; não é necessário um `GET /auth/session` separado neste desenho |
| Editar nome e cargo | `EditProfileUseCase` implementado e testado | `PUT /api/profile` | Parcial: não permite limpar valores e o frontend também envia email e username |
| Solicitar recuperação de senha | `RequestPasswordRecoverUseCase` implementado e testado | `POST /api/profile/password/recover` | Coberto no backend; formulário do frontend ainda usa mock |
| Redefinir senha pelo link/código | `ResetPasswordUseCase` implementado e testado | `PATCH /api/profile/password` | Backend coberto; não existe página de nova senha no frontend |
| Enviar avatar | `UploadAvatarUseCase` implementado e testado | Sem uploader concreto, provider ou controller | Somente domínio; o frontend mantém avatar somente leitura |
| Listar sessões | `FetchSessionsUseCase` e teste em andamento | Contrato e repositório em memória alterados; Prisma e controller pendentes | Ainda não disponível; o build falha enquanto `PrismaSessionsRepository.fetchByUserId` não for implementado |
| Revogar uma sessão | Ausente | Ausente | Necessário para cada ação “Revoke” da tela Security |
| Revogar todas as sessões | Ausente | Ausente | Solicitado, mas ainda não há ação correspondente no frontend |
| Sair da sessão atual | Pode reutilizar a revogação por ID | Ausente | Necessário: os menus desktop/mobile hoje apenas navegam para `/auth/sign-in` |
| Alterar senha autenticada | Ausente | Ausente | Necessário para o formulário “Update password” da tela Security |
| Excluir a própria conta | Ausente | Ausente | Botão visível, mas requer decisão sobre confirmação e exclusão de dados de outros domínios |

### Contratos HTTP já adotados

- `POST /api/users` — cria usuário com `name`, `email`, `password` e `jobTitle` opcional.
- `POST /api/sessions` — autentica com `email` e `password`, cria sessão e cookie.
- `POST /api/sessions/google` — recebe o `code` OAuth do Google e cria sessão.
- `POST /api/sessions/github` — recebe o `code` OAuth do GitHub e cria sessão.
- `GET /api/profile` — retorna `name`, `email`, `jobTitle` e `avatarUrl` do usuário autenticado.
- `PUT /api/profile` — altera `name` e `jobTitle`.
- `POST /api/profile/password/recover` — cria token de recuperação válido por uma hora e envia o link por email.
- `PATCH /api/profile/password` — redefine a senha com `code` e `password`.

O cadastro não autentica automaticamente. Ao integrar o frontend, é necessário decidir entre redirecionar para Sign In depois do cadastro ou fazer `RegisterUseCase` também criar uma sessão.

### Sessions — próximos use cases

#### Finalizar `FetchSessionsUseCase`

Para atender “Active sessions”, a consulta deve retornar somente sessões do usuário autenticado que não estejam expiradas nem revogadas. O contrato público não deve expor `tokenHash`.

Resposta mínima sugerida:

```ts
type SessionSummary = {
  id: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
  isCurrent: boolean
}
```

- `isCurrent` é derivado comparando cada ID com o `sessionId` fornecido pelo guard.
- Ordenar a sessão atual primeiro e as demais por atividade/criação mais recente.
- Implementar `fetchByUserId` no repositório Prisma e registrar use case e controller no módulo HTTP.
- Expor `GET /api/sessions`.
- Browser, sistema operacional e tipo do dispositivo podem ser derivados de `userAgent` no presenter ou no frontend; não pertencem à entidade `Session`.
- A interface mostra “Last active”, mas o modelo atual não registra atividade. Se essa informação continuar no produto, adicionar `lastSeenAt` e atualizar seu valor com frequência limitada; caso contrário, exibir “Signed in at” usando `createdAt`.

#### `RevokeSessionUseCase`

Entrada:

```ts
type RevokeSessionUseCaseRequest = {
  userId: string
  sessionId: string
}
```

Regras:

- buscar a sessão pelo par `sessionId + userId`, sem permitir revogar sessão de outro usuário;
- chamar `session.revoke()` e persistir com `SessionsRepository.save`;
- manter a operação idempotente para uma sessão já revogada;
- retornar `ResourceNotFoundError` quando o ID não pertencer ao usuário, sem revelar a existência da sessão;
- expor `DELETE /api/sessions/:sessionId` com resposta `204`;
- se a sessão revogada for a atual, também expirar o cookie no response.

O logout dos menus pode usar o mesmo use case com o `sessionId` do guard por meio de `DELETE /api/sessions/current`; não precisa de outro caso de uso de domínio.

#### `RevokeAllSessionsUseCase`

Entrada: `userId`.

Regras:

- revogar todas as sessões ativas do usuário em uma única operação de repositório;
- não excluir fisicamente as sessões;
- expor `DELETE /api/sessions` com resposta `204` e expirar o cookie atual;
- “todas” inclui a sessão atual. Se o produto adotar “Sign out other devices”, criar uma operação distinta que receba `exceptSessionId`.

### Credenciais e recuperação

#### `ChangePasswordUseCase`

O formulário atual de Security exige um fluxo autenticado diferente do reset por código.

Entrada: `userId`, `currentPassword` e `newPassword`.

Regras mínimas:

- carregar o usuário e validar `currentPassword` contra `passwordHash`;
- rejeitar senha atual inválida sem alterar o usuário;
- gerar e persistir o novo hash;
- decidir se a troca revoga as outras sessões; a recomendação é manter a sessão atual e revogar as demais;
- definir separadamente o comportamento de usuários criados apenas por OAuth, cujo `passwordHash` é nulo.

Como `PATCH /api/profile/password` já é usado pelo reset público, separar os contratos antes de expor este fluxo. Sugestão:

- `PATCH /api/profile/password` — troca autenticada;
- `POST /api/password-recovery` — solicita recuperação;
- `PATCH /api/password-recovery/:code` — redefine pelo código.

Renomear as rotas atuais é uma decisão de API, não uma exigência do domínio.

### Alinhamentos necessários entre frontend e domínio

1. **Username:** o frontend exibe e edita `username`, mas `User`, Prisma e os use cases não possuem esse campo. A direção mais alinhada ao backend atual é removê-lo da interface. Se username for requisito real, ele precisa ser modelado com unicidade e normalização antes da integração.
2. **Email do perfil:** o frontend permite editar email, mas o backend o trata como identificador sem setter. Tornar o campo somente leitura ou definir um fluxo próprio de alteração e verificação; não incluí-lo silenciosamente em `EditProfileUseCase`.
3. **Nome no cadastro:** o frontend aceita nome ausente, enquanto `POST /api/users` exige `name`. Escolher uma única regra; a interface atual de perfil já exige display name.
4. **Senha:** Sign Up exige no mínimo 6 caracteres no frontend; a API exige de 6 a 18. Security exige no mínimo 8 e não tem máximo. Centralizar a política e reutilizá-la nos três fluxos.
5. **Limpar cargo:** o frontend aceita `jobTitle` vazio, mas `EditProfileUseCase` usa uma checagem truthy e ignora string vazia. Tratar `undefined` como “não alterar” e `null`/vazio normalizado como “remover”.
6. **Avatar:** existe capacidade no domínio além do frontend atual, mas falta infraestrutura. Manter somente leitura até existir uploader e endpoint, ou concluir a integração e adicionar a ação na interface.
7. **Exclusão de conta:** não implementar apenas a partir do botão atual. Primeiro definir confirmação/reautenticação, retenção e como os dados fora de Identity serão tratados.

### Hardening antes de produção

- Igualar o TTL: a entidade de sessão expira em 30 dias, mas o cookie atual expira em 7 dias.
- Habilitar `secure` no cookie em produção e centralizar suas opções para login por senha e OAuth.
- O controller do GitHub lê o user agent de forma diferente dos outros controllers; normalizar para que sessões OAuth também tenham metadados.
- A recuperação de senha atualmente responde `404` para email inexistente, permitindo enumeração de contas. A resposta pública deve ser indistinguível para emails existentes e inexistentes.
- Invalidar tokens anteriores ao emitir um novo token de recuperação, limitar tentativas e considerar persistir somente o hash do token.
- No Prisma, a identidade externa deve ser única pelo par provider + provider account ID; evitar uma unicidade global de `providerAccountId` entre providers.

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

Perfil, credenciais e sessões agora estão documentados na seção **Identity**, usando os contratos adotados pela implementação atual.

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
