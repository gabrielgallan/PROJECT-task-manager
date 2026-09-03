# SPEC 01 — Chamadas HTTP de Identity

Status: especificação para implementação em outra task. Nenhuma chamada deve ser implementada nesta task.

## Objetivo

Completar as funções de acesso à API de Identity em `web/src/api`, com um arquivo por
chamada HTTP, reutilizando o cliente `api` de `@/lib/ky` e o padrão de
`authenticate.ts` e `get-profile.ts`.

O resultado será uma camada de transporte tipada, pronta para consumo posterior.
A integração com componentes, páginas, hooks e React Query fica para outra task.

## Fontes e estado analisado

Contratos conferidos no código local:

- `api/src/infra/http/identity/identity.module.ts`: os 15 controllers registrados.
- `api/src/infra/http/identity/controllers/*.controller.ts`: métodos, rotas,
  autenticação, entradas, status e retornos efetivos.
- `api/src/infra/http/identity/controllers/dto/*.ts`: schemas Zod e DTOs de resposta.
- `api/src/infra/http/identity/presenters/user-presenter.ts` e
  `session-presenter.ts`: formato público dos dados.
- `api/src/infra/auth/session-auth.guard.ts` e `session-cookie.ts`: sessão por cookie.
- Casos de uso de edição de perfil, upload de avatar e revogação de sessões:
  semântica de campos opcionais, formatos de imagem e alcance da revogação.
- `api/STATUS.md`: inventário de Identity.
- `web/src/api/authenticate.ts`, `web/src/api/get-profile.ts` e
  `web/src/lib/ky.ts`: padrão existente no frontend.

Os dois arquivos de chamadas existentes já atendem aos contratos examinados e devem
ser preservados. A implementação prevista acrescenta 13 arquivos, totalizando 15
chamadas de Identity. Os caminhos citados nesta SPEC são relativos à raiz do repositório.

## Escopo e limites

- Criar somente os 13 arquivos novos de Identity listados abaixo em `web/src/api/`.
- Não alterar backend, DTOs da API, configurações, dependências ou cliente Ky.
- Não modificar as chamadas existentes nem outras alterações locais em andamento.
- Não integrar componentes, layouts, páginas, formulários, rotas ou stores.
- Não criar hooks, query keys, queries, mutations ou invalidações do React Query.
- Não implementar navegação OAuth, obtenção de códigos, callbacks, redirecionamentos,
  tratamento visual de erros, toasts ou gerenciamento de estado de autenticação.
- Não criar endpoints, modelos de domínio, serviços genéricos, barrel exports ou
  abstrações compartilhadas sem necessidade para estas chamadas.
- Não incluir Tasks, Plans, Work Logs, Categories ou áreas administrativas.

## Padrão obrigatório de implementação

1. Arquivos em kebab-case; uma função `export async function` em camelCase por arquivo.
2. Importar `api` de `@/lib/ky`; não instanciar outro cliente nem usar `fetch`/Axios.
3. Declarar interfaces locais com o nome da operação seguido de `Request` e
   `Response`, como nos arquivos existentes. Não usar tipos inline na assinatura.
4. Se houver body ou parâmetro de rota, usar uma interface `Request` e receber um
   único objeto tipado, com desestruturação. Sem entrada, a função não recebe argumentos
   e não precisa de interface vazia. Nenhuma rota analisada recebe query parameters.
5. Se houver JSON de sucesso, declarar uma interface `Response`, anotar
   `Promise<NomeResponse>` e retornar `return await api...json<NomeResponse>()`.
6. Para sucesso sem corpo, anotar `Promise<void>` e somente aguardar `await api...`.
   Não chamar `.json()`, retornar o objeto HTTP ou criar interface de resposta vazia.
   Essa regra também vale para a recuperação de senha, que retorna **201 sem corpo**.
7. Enviar campos JSON explicitamente em `json: { ... }`. Usar `body: formData` apenas
   no upload de avatar. Não enviar parâmetros de rota no body.
8. Usar os caminhos `api/...`, sem barra inicial, como nas chamadas existentes.
   A URL base já é responsabilidade do cliente compartilhado.
9. Preservar os nomes, a opcionalidade e a nulabilidade do contrato HTTP. Datas recebidas
   em JSON são `string` ISO 8601, não instâncias de `Date`. Não converter ou formatar dados.
10. Manter `success: boolean` nas interfaces, seguindo `AuthenticateResponse`, embora
    o backend retorne o literal `true` no sucesso. Não confundir esse campo com erros HTTP.
11. Propagar as rejeições do Ky. Não capturar erros para retornar sucesso fictício,
    `false`, array vazio ou `undefined`; não introduzir um envelope compartilhado de erros.
12. Seguir TypeScript estrito e o estilo do projeto: tabs, aspas simples, sem
    semicolons obrigatórios, imports organizados e linhas de até 100 caracteres no código.

### Sessão e responsabilidade do transporte

O cliente compartilhado já usa `credentials: 'include'`. A API autentica pelo cookie
HTTP-only `session`; não recebe bearer token nestas chamadas. Não ler ou escrever
esse cookie em JavaScript, armazenar tokens ou incluir `Authorization` manualmente.

`userId`, IP e user-agent não são campos das interfaces de Request: a API obtém esses
dados da sessão ou da requisição. O único identificador de sessão informado pela
função chamadora é o `sessionId` da revogação individual.

## Inventário HTTP e arquivos

Os caminhos HTTP abaixo incluem a barra inicial para representar as rotas públicas.
Nos argumentos do Ky, usar os mesmos caminhos sem essa barra.

| Arquivo em `web/src/api/` | Função | Método e rota | Acesso | Sucesso | Ação |
| --- | --- | --- | --- | --- | --- |
| `authenticate.ts` | `authenticate` | `POST /api/sessions` | Público | 201, JSON | Preservar |
| `authenticate-with-github.ts` | `authenticateWithGithub` | `POST /api/sessions/github` | Público | 201, JSON | Criar |
| `authenticate-with-google.ts` | `authenticateWithGoogle` | `POST /api/sessions/google` | Público | 201, JSON | Criar |
| `register.ts` | `register` | `POST /api/users` | Público | 201, JSON | Criar |
| `get-profile.ts` | `getProfile` | `GET /api/profile` | Sessão | 200, JSON | Preservar |
| `edit-profile.ts` | `editProfile` | `PUT /api/profile` | Sessão | 204, sem corpo | Criar |
| `upload-avatar.ts` | `uploadAvatar` | `PUT /api/profile/avatar` | Sessão | 204, sem corpo | Criar |
| `change-password.ts` | `changePassword` | `PATCH /api/profile/password` | Sessão | 204, sem corpo | Criar |
| `request-password-recover.ts` | `requestPasswordRecover` | `POST /api/profile/password-recover` | Público | 201, sem corpo | Criar |
| `reset-password.ts` | `resetPassword` | `PATCH /api/profile/password-recover` | Público | 204, sem corpo | Criar |
| `fetch-sessions.ts` | `fetchSessions` | `GET /api/sessions` | Sessão | 200, JSON | Criar |
| `revoke-session.ts` | `revokeSession` | `DELETE /api/sessions/:sessionId` | Sessão | 204, sem corpo | Criar |
| `revoke-all-sessions.ts` | `revokeAllSessions` | `DELETE /api/sessions` | Sessão | 200, JSON | Criar |
| `sign-out.ts` | `signOut` | `POST /api/sign-out` | Sessão | 204, sem corpo | Criar |
| `delete-user.ts` | `deleteUser` | `DELETE /api/profile` | Sessão | 204, sem corpo | Criar |

## Interfaces e contratos por chamada

Os blocos seguintes especificam os tipos; cada interface pertence ao arquivo da
respectiva chamada. As restrições de validação documentam o backend, sem exigir
schemas Zod ou validação adicional nesta camada de transporte.

### Autenticação por credenciais — existente

```ts
interface AuthenticateRequest {
	email: string
	password: string
}

interface AuthenticateResponse {
	success: boolean
}
```

Body JSON. Email válido e não vazio; senha com no mínimo 6 caracteres. O DTO de
autenticação não impõe o máximo de 18 caracteres usado no cadastro e na troca de senha.
Retorno: `Promise<AuthenticateResponse>`. A API define o cookie de sessão no sucesso.

### Autenticação com GitHub e Google

```ts
interface AuthenticateWithGithubRequest {
	code: string
}

interface AuthenticateWithGithubResponse {
	success: boolean
}

interface AuthenticateWithGoogleRequest {
	code: string
}

interface AuthenticateWithGoogleResponse {
	success: boolean
}
```

Cada função envia `{ code }` como JSON para sua própria rota e retorna sua
`Promise<...Response>`. `code` é obrigatório e não vazio. O provider é determinado pela
rota; não enviar `provider`, `redirectUri`, email, token ou dados de perfil.
Ambas as rotas definem o cookie de sessão. A obtenção do código OAuth fica fora do escopo.

### Cadastro

```ts
interface RegisterRequest {
	name: string
	email: string
	password: string
	jobTitle?: string
}

interface RegisterResponse {
	success: boolean
}
```

Body JSON. `name` não vazio, email válido e não vazio, senha entre 6 e 18 caracteres.
`jobTitle` é opcional, mas não aceita `null`. Retorno: `Promise<RegisterResponse>`.
O cadastro não define cookie de sessão nem devolve usuário ou token.

### Consulta de perfil — existente

```ts
interface GetProfileResponse {
	profile: {
		name: string | null
		email: string
		jobTitle: string | null
		avatarUrl: string | null
	}
}
```

Sem Request. Retorno: `Promise<GetProfileResponse>`. Preservar o envelope `profile` e
os campos nulos presentes no presenter, mesmo onde o Swagger marca campos como opcionais.

### Edição de perfil

```ts
interface EditProfileRequest {
	name?: string | null
	jobTitle?: string | null
}
```

Body JSON com `name` e `jobTitle`. Campo omitido mantém o valor atual; `null` limpa
o valor. Não converter ausência em `null` nem eliminar um `null` explícito.
O schema também aceita strings vazias. Não enviar email ou avatar nesta chamada.
Retorno: `Promise<void>`.

### Upload de avatar

```ts
interface UploadAvatarRequest {
	file: File
}
```

Criar um `FormData` local, adicionar `formData.append('file', file)` e enviar
`api.put('api/profile/avatar', { body: formData })`. Não definir `Content-Type`
manualmente: o navegador deve incluir o boundary de multipart.

O arquivo é obrigatório. O controller configura `MaxFileSizeValidator` com
`maxSize: 5000000` bytes; o caso de uso aceita os MIME types `image/jpeg`, `image/png`,
`image/webp` e `image/heic`. Não enviar base64, URL, `fileName`, `fileType` ou `userId`
como campos JSON adicionais. Retorno: `Promise<void>`; a nova URL não vem na resposta.

### Alteração de senha

```ts
interface ChangePasswordRequest {
	currentPassword: string
	newPassword: string
}
```

Body JSON. `currentPassword` não vazio; `newPassword` entre 6 e 18 caracteres.
Não enviar confirmação de senha. Retorno: `Promise<void>`.

### Solicitação de recuperação de senha

```ts
interface RequestPasswordRecoverRequest {
	email: string
}
```

Body JSON com email válido e não vazio. O backend envia o link de recuperação;
não retorna token, mensagem nem `{ success: true }`. Retorno: `Promise<void>`,
apesar do status 201. Não tentar interpretar JSON.

### Redefinição de senha

```ts
interface ResetPasswordRequest {
	tokenId: string
	password: string
}
```

Body JSON. `tokenId` deve ser UUID e pertence ao body, não à URL ou à query.
`password` deve ter entre 6 e 18 caracteres. Não renomear para `token` ou
`newPassword`. Retorno: `Promise<void>`.

### Listagem de sessões

```ts
interface FetchSessionsResponse {
	sessions: {
		id: string
		ipAddress: string | null
		userAgent: {
			osName?: string
			osVersion?: string
			browserName?: string
			deviceType?: string
		} | null
		isCurrent: boolean
		createdAt: string
		revokedAt: string | null
	}[]
}
```

Sem Request, filtros ou paginação. Retorno: `Promise<FetchSessionsResponse>`.
Preservar o envelope `sessions` e os valores recebidos; não ordenar ou filtrar.
O DTO do backend usa `Date`, mas o JSON serializado contém strings ISO 8601.
O presenter pode omitir campos internos de `userAgent` quando não identificados.
Não acrescentar `tokenHash`, token, `expiresAt`, `updatedAt` ou campos de UI.

### Revogação individual

```ts
interface RevokeSessionRequest {
	sessionId: string
}
```

O UUID `sessionId` é parâmetro de rota: compor
`api/sessions/${encodeURIComponent(sessionId)}`. Não enviar body ou query.
Retorno: `Promise<void>`.

### Revogação de todas as sessões

```ts
interface RevokeAllSessionsResponse {
	sessionsCount: number
}
```

Sem Request ou body. Retorno: `Promise<RevokeAllSessionsResponse>`.
Preservar `sessionsCount`, inclusive quando for zero. A operação abrange todas as
sessões do usuário, inclusive a atual; não há parâmetro para excluí-la.

### Sign-out

Sem Request, Response ou body. Retorno: `Promise<void>`.
O controller identifica a sessão atual pelo cookie, revoga essa sessão e limpa o
cookie. Não reutilizar a rota de revogação individual como substituição.

### Exclusão de usuário

Sem Request, Response ou body. Retorno: `Promise<void>`.
A API identifica o usuário pela sessão. Não enviar ID, senha ou confirmação textual;
essa rota não aceita esses campos. Confirmação visual e limpeza de estado ficam fora
desta camada e desta implementação.

## Erros e particularidades do contrato

Todas as rotas protegidas podem responder 401 quando não há sessão válida. Entradas
validadas por Zod podem produzir 400. Erros HTTP e de transporte devem continuar
rejeitando a Promise, para tratamento futuro pelo consumidor.

| Operação | Erros específicos observados nos controllers |
| --- | --- |
| Autenticação por credenciais | 400 para credenciais inválidas |
| Autenticação OAuth | 400 para provider não suportado; Swagger declara 502, mas o switch do controller usa 500 para outros erros do caso de uso |
| Cadastro | 409 para email já cadastrado |
| Consulta/edição/exclusão de perfil | 404 para usuário não encontrado |
| Upload de avatar | 400 para arquivo ausente, tamanho ou tipo inválido; 404 para usuário não encontrado |
| Alteração de senha | 400 para senha atual inválida; 404 para usuário não encontrado |
| Solicitação de recuperação | 404 para usuário não encontrado |
| Redefinição de senha | 400 para token expirado ou usado; 404 para token ou usuário não encontrado |
| Listagem de sessões | Controller contempla 404 para recurso não encontrado |
| Revogação individual e sign-out | 404 para sessão não encontrada; 401 para operação não permitida |
| Revogação de todas as sessões | Controller contempla 500 para falha do caso de uso |

Essa tabela não é uma enumeração exaustiva de falhas de infraestrutura. Não modelar
erros como respostas de sucesso nem presumir um único formato de erro: o pipe Zod
retorna detalhes de validação distintos do DTO genérico `ApiErrorResponseDto`.

Os nomes com erros de grafia no backend (`RegisterResposeDto` e
`RevokeAllSessionsReponseDto`) não devem ser copiados para as interfaces do frontend
nem corrigidos no backend nesta implementação.

## Sequência proposta para a task de implementação

1. Conferir se os contratos e as duas chamadas existentes continuam iguais aos desta SPEC.
2. Criar os arquivos de cadastro e autenticação com providers, seguindo o padrão JSON existente.
3. Criar as operações de perfil e senha, distinguindo multipart, JSON e respostas sem corpo.
4. Criar as operações de sessões e sign-out, incluindo a resposta tipada de revogação em lote.
5. Revisar o mapeamento completo de 15 rotas e validar somente os arquivos do escopo.

Esta sequência é uma proposta; não deve ser executada na task que cria a SPEC.

## Critérios de aceite da implementação futura

- [ ] Existem 13 arquivos novos e as duas chamadas atuais foram preservadas.
- [ ] Cada arquivo contém uma única chamada e corresponde ao método e caminho do inventário.
- [ ] Toda entrada possui interface `Request`; todo payload JSON de sucesso possui
  interface `Response`; funções sem entrada não recebem objetos vazios.
- [ ] As funções de sucesso sem corpo retornam `Promise<void>` e não usam `.json()`,
  incluindo o POST de recuperação com status 201.
- [ ] Interfaces preservam campos opcionais, nulos, envelopes e datas como strings.
- [ ] O avatar usa `FormData` com chave `file`, sem `Content-Type` manual.
- [ ] A revogação individual usa o ID somente no caminho; operações da sessão atual
  não recebem `userId`, token ou ID adicional.
- [ ] Todas as chamadas usam `@/lib/ky` e propagam erros, sem lógica de UI ou cache.
- [ ] O diff da implementação contém apenas os 13 novos arquivos de `web/src/api/`.
- [ ] Executar `pnpm run typecheck` em `web/` e a verificação de estilo disponível no
  repositório, restrita aos arquivos novos. Registrar eventuais falhas preexistentes
  sem corrigi-las fora do escopo.
- [ ] Conferir por revisão de contrato o método, URL, body e retorno de cada função,
  especialmente os casos sem corpo, multipart e campos nulos. Não adicionar framework
  de testes ou executar operações reais de exclusão/revogação para validar wrappers.

## Entrega desta task de documentação

Criar somente `web/docs/specs/01-identity-api-calls.md`, revisar sua correspondência
com os contratos locais e fazer um único commit contendo apenas este arquivo, sem push.
Nenhuma etapa de implementação ou integração faz parte desta entrega.
