# Backend — use cases exigidos pelo frontend

Mapa resumido dos casos de uso e consultas necessários para substituir os mocks e stores locais. As rotas são referências de contrato; a implementação pode agrupá-las de outra forma desde que preserve os comportamentos descritos.

> Revisão de Identity: 16/08/2026. A seção de Identity foi confrontada com o frontend e com a implementação atual do backend. A tabela de cobertura reflete aquela data e está sendo alterada em paralelo.
>
> Revisão de Tasks, Categories, Plans e Work Logs: 18/08/2026. As quatro seções foram confrontadas com a interface atual e deixaram de ser rascunho. Reports, Dashboard e Settings foram ajustados apenas onde dependem delas e ainda não passaram por revisão própria.

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

### Modelo

A Task tem `id`, `title`, `description?`, `status`, `priority`, `startDate?`, `dueDate?`, `createdAt` e `updatedAt`. Não existe Category em Task.

- `status`: `backlog`, `in_progress`, `done`. A ordem é o ciclo de vida, não alfabética.
- `priority`: `low`, `medium`, `high`, `critical`, em urgência crescente.
- `startDate` é o início planejado e é opcional. A Timeline usa `createdAt` como início quando ele falta e, quando o início cai depois da entrega, desenha a barra até `dueDate`. O backend não precisa reproduzir esse ajuste, mas também não deve exigir `startDate <= dueDate`.
- Task sem `dueDate` não entra na Timeline; a interface as agrupa à parte.

### Listagem

`GET /tasks`

O frontend já mantém a consulta na URL e é essa grafia que a API deve aceitar, para que a query string seja repassada sem tradução:

| Parâmetro | Formato | Observação |
| --- | --- | --- |
| `q` | texto | pesquisa em `title` e `description`, sem distinção de caixa |
| `status` | lista separada por vírgula | `status=backlog,in_progress` |
| `priority` | lista separada por vírgula | `priority=high,critical` |
| `sort` | `campo:direção` | ex.: `sort=dueDate:asc`; campos `title`, `status`, `priority`, `updatedAt`, `dueDate` |
| `page` | inteiro ≥ 1 | ausente significa 1 |

- O tamanho da página é fixo em 10 e hoje não trafega. Se `pageSize` for exposto, precisa ser opcional e manter 10 como padrão.
- Valor desconhecido em `status`, `priority` ou `sort` é descartado, não é erro: a URL é editável à mão e a listagem precisa sobreviver a isso.
- O padrão é `sort=dueDate:asc`, `page=1` e nenhum filtro.
- Seleção vazia em `status` ou `priority` significa "todos os valores", não "nenhum".

Regras de ordenação que a API precisa reproduzir exatamente:

- `status` e `priority` ordenam pelo ranque do domínio, não pelo texto.
- `title` compara ignorando acentos e caixa.
- `dueDate` nulo vai sempre para o fim, independentemente da direção.
- Todo empate desempata por `title` ascendente, e esse desempate não inverte junto com a direção. Em SQL: `ORDER BY <campo> <direção> NULLS LAST, title ASC`.

### Board e Timeline

Board e Timeline leem o mesmo conjunto filtrado da List, mas sem paginar e sem ordenar: cada um aplica a própria organização — colunas por status no Board, faixas por status e início na Timeline. Precisam de uma forma de pedir o resultado filtrado inteiro; a mais simples é aceitar `page=all` em `GET /tasks` em vez de criar outra rota.

### Pesquisa para comboboxes

`GET /tasks/options` — parâmetros `q`, `cursor` e `limit`.

- Pesquisa por título e retorna somente `id` e `title`.
- Usado nos formulários de Plans e Work Logs e nos filtros de Reports.
- Deve continuar retornando a opção selecionada pelo ID quando ela não estiver na página atual, senão um Plan que aponta para uma Task antiga exibe o campo vazio.
- Hoje a interface recebe a lista completa e filtra em memória. A rota continua sendo o caminho certo para escala, mas não bloqueia a primeira integração.

### Detalhes

`GET /tasks/:taskId` devolve a Task, os totais e a atividade combinada de Plans e Work Logs.

Totais: `plannedMinutes` (soma dos Plans da Task), `loggedMinutes` (soma dos Work Logs) e o saldo `loggedMinutes - plannedMinutes`. Quando `plannedMinutes` é zero a interface não apresenta saldo.

Cada entrada de atividade é achatada, e só `kind` diz de onde ela veio:

```ts
type TaskActivityEntry = {
  id: string
  kind: 'plan' | 'work-log'
  title: string
  startDate: string
  endDate: string
  /** Somente para plans. */
  isConfirmed?: boolean
}
```

Ordenar por `startDate` decrescente. O agrupamento por dia é feito na interface e assume essa ordem.

### Comandos

- `POST /tasks` — criar. `title`, `status` e `priority` obrigatórios; `description`, `startDate` e `dueDate` opcionais.
- `PATCH /tasks/:taskId` — editar dados gerais.
- `PATCH /tasks/:taskId/status` — mover entre colunas do Board.
- `PATCH /tasks/:taskId/schedule` — alterar `startDate` e `dueDate` pela Timeline.
- `DELETE /tasks/:taskId` — excluir e definir `taskId = null` nos Plans e Work Logs relacionados.

Ao abrir Plans a partir de uma Task, o frontend navega para `/registers/plans?task=<id>`, que vira o filtro `taskIds` de `GET /plans`.

## Categories

### Consultas e CRUD

- `GET /categories` — retorna todas as Categories do usuário, ordenadas por nome. A coleção é pequena e a interface a consome inteira em Settings, nos comboboxes e nos filtros; `q` e `sort` não são necessários agora.
- `GET /categories/:categoryId/deletion-impact` — `{ planCount, workLogCount }`, a quantidade de Plans e Work Logs que ficarão sem Category. O diálogo de exclusão mostra os dois números.
- `POST /categories` — `name` e `color`.
- `PATCH /categories/:categoryId` — alterar nome ou cor. A nova cor vale imediatamente para todos os registros relacionados, porque a cor é resolvida pela Category e não copiada para Plan ou Work Log.
- `DELETE /categories/:categoryId` — excluir e definir `categoryId = null` nos Plans e Work Logs relacionados.

O nome tem de 1 a 40 caracteres e é único por usuário. A unicidade compara com `trim` e caixa baixa, exatamente como o frontend normaliza. As cores aceitas são as 18 da interface:

`red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose` e `slate`.

### Preferência visual

- `GET /settings/calendar-preferences` — inclui `uncategorizedColor`.
- `PATCH /settings/calendar-preferences` — altera a cor usada por Plans e Work Logs sem Category.

Hoje `uncategorizedColor` vive apenas em memória e volta para `blue` a cada reload. É uma preferência do usuário e precisa persistir, então a rota continua no escopo.

## Plans

Um Plan é uma intenção: pode estar no futuro e pode atravessar a meia-noite. É isso que o separa de um Work Log.

### Modelo

`id`, `title`, `description?`, `startDate`, `endDate`, `taskId?`, `categoryId?`, `confirmedAt?`. A interface não lê `createdAt` nem `updatedAt`, mas o backend deve mantê-los.

O formulário exige `title` e `endDate > startDate`. Não há restrição de dia nem de futuro.

`confirmedAt` é uma marca local, não uma referência: Plans nunca apontam para Work Logs, e é isso que mantém os dois módulos independentes.

### Calendário

`GET /plans`

- Obrigatórios: `from` e `to`.
- Filtros: `taskIds[]`, `categoryIds[]`, `withoutTask`, `withoutCategory`.
- Ordenação padrão: `startDate` ascendente.
- Retorna Plans com resumos de `task` e `category` incluídos: o calendário mostra o título da Task no item e resolve a cor pela Category.
- Atende as views Day, Week e Month, sem paginação.

Os filtros do frontend hoje carregam sentinelas de interface dentro da própria lista de IDs — `none` para "sem task" e `no-category` para "sem category", com uma terceira grafia (`no-task`) só em Reports. Elas são internas à interface e devem ser traduzidas para `withoutTask` e `withoutCategory` na borda da API, nunca enviadas como IDs.

### Comandos

- `POST /plans` — aceita `taskId` e `categoryId` opcionais.
- `PATCH /plans/:planId` — editar conteúdo e relações.
- `PATCH /plans/:planId/schedule` — mover ou redimensionar no calendário.
- `DELETE /plans/:planId`.

### Registrar como concluído

`POST /plans/:planId/record-as-done`

- Cria um Work Log com título, período, Task e Category herdados do Plan.
- Marca `confirmedAt` no Plan.
- Operação transacional: ou os dois acontecem, ou nenhum.

Rejeita quando:

- o Plan já está confirmado;
- `endDate` ainda está no futuro, porque só se registra trabalho já feito;
- o período se sobrepõe a outro Work Log do usuário;
- o Plan atravessa a meia-noite.

O último caso é uma lacuna real do desenho atual, e não apenas mais uma validação: um Work Log precisa começar e terminar no mesmo dia, um Plan não, então existe Plan válido que nunca pode ser registrado. Hoje a interface deixa o botão habilitado e só mostra o erro depois do clique, com a mensagem genérica de Work Log. A API deve rejeitar com erro próprio e a interface deve bloquear o botão pelo mesmo motivo. Dividir o Plan em dois Work Logs foi descartado por alterar silenciosamente o que o usuário pediu.

A interface já desabilita o botão para Plan confirmado ou futuro, mas as quatro validações têm de existir no servidor de todo modo.

## Work Logs

Um Work Log é o registro do que foi feito. Sempre um intervalo fechado dentro de um único dia e nunca no futuro.

### Modelo

`id`, `title`, `description?`, `startDate`, `endDate`, `taskId?`, `categoryId?`, `createdAt`, `updatedAt`.

### Calendário

`GET /work-logs`

- Obrigatórios: `from` e `to`.
- Filtros: `taskIds[]`, `categoryIds[]`, `withoutTask`, `withoutCategory`, com a mesma tradução de sentinelas descrita em Plans.
- Ordenação padrão: `startDate` ascendente.
- Retorna Work Logs com resumos de `task` e `category` incluídos.
- Atende as views Day, Week e Agenda, sem paginação.

### Comandos

- `POST /work-logs` — aceita `taskId` e `categoryId` opcionais.
- `PATCH /work-logs/:workLogId` — editar conteúdo e relações.
- `PATCH /work-logs/:workLogId/schedule` — mover ou redimensionar no calendário.
- `DELETE /work-logs/:workLogId`.

### Regras do intervalo

Valem para criação, edição e reagendamento, e são as mesmas quatro que a interface aplica:

- `endDate > startDate`;
- início e fim no mesmo dia;
- `endDate` não pode estar no futuro;
- não pode se sobrepor a outro Work Log do usuário.

Sobreposição é medida em intervalo semiaberto: dois Work Logs podem se encostar, um terminando exatamente quando o outro começa, mas não podem se cruzar. A condição é `novoInício < outroFim && novoFim > outroInício`. Sem essa garantia a soma das durações deixa de ser tempo realmente trabalhado. Na edição, o próprio registro é ignorado na verificação.

O erro de sobreposição precisa identificar o Work Log conflitante, porque a interface mostra o título dele na mensagem.

### O que permanece no cliente

- **Intervalo sugerido para "Log now".** A rota `GET /work-logs/suggested-range` proposta antes foi descartada: a interface deriva o intervalo dos logs do dia que já tem em mãos — do fim do último log até agora, ou os 30 minutos anteriores a agora quando não há log no dia ou a folga é menor que 5 minutos. Depende do relógio e do fuso do cliente e não vale uma ida ao servidor.
- **Minutos não registrados.** O resumo do dia mostra "untracked" como o vão entre o primeiro início e o último fim do dia menos a soma das durações, e só quando há pelo menos dois logs. É derivado do que já foi carregado e não tem endpoint.

## Reports

- `POST /reports/work-logs/preview`
  - Parâmetros: `from`, `to`, `taskIds[]`, `categoryIds[]`, `withoutTask`, `withoutCategory`, `groupBy` e `columns[]`.
  - `groupBy`: `day`, `task` ou `none`.
  - Colunas: `date`, `start`, `end`, `duration`, `task`, `title` e `description`. O padrão da interface traz todas menos `description`.
  - O período padrão é o mês corrente.
  - Retorna as linhas com a Task incluída, os grupos e o resumo.
  - Category filtra, mas ainda não é coluna nem agrupamento.
- `POST /reports/work-logs/export`
  - Mesmos filtros, agrupamento e colunas do preview.
  - Formatos: `csv` e `xlsx`.

O resumo é `totalMinutes`, `workLogCount`, `activeDayCount`, `taskCount` e `unassignedMinutes`, este último os minutos de Work Logs sem Task.

Cada linha traz o Work Log, início, fim, duração em minutos e o rótulo da Task, que é "No task" quando não há Task e "Unknown task" quando o ID não resolve.

## Dashboard

- `GET /dashboard/overview`
  - Parâmetros: `referenceDate` e `timezone`.
  - Retorna Tasks atrasadas e próximas da entrega, minutos planejados e registrados na semana, Plans do dia, contribuições anuais de Work Logs e distribuição do tempo por Task.
  - Plans do dia vêm com Task e Category incluídas e com o estado derivado `recorded`, `now`, `upcoming` ou `past`.
  - Distribuição do tempo vem com resumo da Task incluído.
- `GET /dashboard/planned-vs-logged`
  - Parâmetros: `days` (`7`, `30` ou `90`) e `timezone`.
  - Retorna minutos planejados e registrados por dia.

As contribuições cobrem o ano-calendário de `referenceDate`, com um item por dia contendo os minutos do dia e a quantidade de Work Logs. Dias futuros vão zerados e marcados. O nível de 0 a 4 do gráfico é faixa de apresentação — zero, até 2h, até 4h, até 6h e acima de 6h — e deve continuar sendo calculado no cliente; o backend devolve os minutos.

A capacidade semanal do card de capacidade é hoje uma constante de 40 horas na interface, não uma preferência do usuário. Só vira contrato de API se as horas de trabalho virarem configuração; existe um componente de working hours no repositório que nenhuma tela usa.

## Settings

Perfil, credenciais e sessões estão documentados na seção **Identity**.

### Notificações

- `GET /users/me/notification-settings`.
- `PATCH /users/me/notification-settings`.

As preferências incluem canais in-app e browser, lembrete de Plan com antecedência de 5, 10, 15 ou 30 minutos e resumo diário em `HH:mm`. A permissão da API Notification continua sendo responsabilidade do navegador.

### Timezone

O seletor de timezone existe e guarda a escolha em `localStorage`, com o fuso do navegador como padrão. Não precisa de rota própria, mas é a origem do parâmetro `timezone` que Dashboard e Reports recebem.

## Fora do escopo da API

- Theme e language enquanto permanecerem locais.
- Timezone, view, formato de hora, finais de semana e posição dos calendários.
- Estado da sidebar.
- Command global, que hoje pesquisa apenas rotas e ações estáticas.
- Category em Tasks.
- Category como coluna ou agrupamento de Reports.
- Horas de trabalho: o componente existe, mas nenhuma tela o usa.
- Intervalo sugerido de "Log now" e minutos não registrados, ambos derivados no cliente.

## Ordem sugerida

1. Concluir Identity: troca de senha autenticada, CORS, `isCurrent` e filtro das sessões ativas.
2. Categories, que Plans e Work Logs referenciam.
3. Tasks: listagem, Board, Timeline e pesquisa para comboboxes.
4. Work Logs, incluindo as regras de intervalo.
5. Plans e "Record as done", que dependem das regras de Work Log.
6. Detalhe da Task, que agrega Plans e Work Logs.
7. Dashboard.
8. Reports e exportações.
9. Notificações.

A troca em relação à ordem anterior é Work Logs antes de Plans: "Record as done" cria um Work Log e reusa as quatro validações de intervalo, então construir Plans primeiro obrigaria a escrever essas regras duas vezes.
