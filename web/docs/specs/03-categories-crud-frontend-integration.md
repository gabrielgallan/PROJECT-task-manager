# SPEC 03 — Integração do CRUD de Categories no frontend

Status: implementada. Resultados de verificação registrados na seção 11.
Data: 2026-09-03.

## 1. Objetivo e escopo

Conectar o gerenciamento de categorias em Settings às cinco rotas existentes da API,
substituindo o CRUD em memória por dados persistidos, com chamadas tipadas, hooks,
React Query, validação Zod/React Hook Form e estados claros de carregamento e erro.
Este documento define o resultado esperado; o plano de implementação será criado depois.

Categorias continuam sendo classificações opcionais de Plans e Work Logs. Não pertencem
a Tasks. Excluir uma categoria preserva os registros relacionados e remove apenas o vínculo.
O CRUD deve funcionar mesmo sem Plans ou Work Logs carregados no frontend.

Incluído:

- Cinco funções HTTP em `web/src/api`, uma por operação.
- Modelos, query keys, hooks de consulta/mutação e hooks de lógica de Categories.
- Integração de `CategoriesSettings`, `CategoryDialog` e `DeleteCategoryDialog`.
- Ajustes pontuais nos componentes de categoria e na fonte de dados compartilhada.
- Limpeza dos dados de Categories no ciclo de sessão existente.

Fora do escopo:

- Alterações em `api/`, novos endpoints ou mudanças de contrato.
- Integração HTTP de Tasks, Plans, Work Logs, Dashboard ou Reports.
- Refatoração dos fluxos de Identity, OAuth, cookies ou do cliente HTTP global.
- Reformulação visual, novas dependências, infraestrutura genérica de formulários ou erros.
- Persistência da preferência `uncategorizedColor`: manter o comportamento local atual.
- Implementação de código nesta entrega de documentação.

Preservar o idioma inglês da interface, a estrutura visual e o comportamento responsivo.
Os caminhos abaixo são relativos à raiz do repositório.

## 2. Fontes e diagnóstico

Contratos conferidos nos cinco controllers de Categories e respectivos DTOs em
`api/src/infra/http/task-manager/controllers`, em `CategoryPresenter`, na entidade
`Category`, nos casos de uso e em `PrismaCategoriesRepository`. Conferidos também
`api/STATUS.md`, os testes E2E desses controllers e
`api/docs/specs/03-categories-http-contract-refinement.md`.

Padrões de integração analisados: `web/src/lib/ky.ts`, `web/src/lib/react-query.ts`,
as calls `get-profile.ts` e `edit-profile.ts`, os hooks de Identity, seus schemas e
`web/src/app/pages/settings/components/account-settings.tsx`.

| Situação observada | Decisão desta SPEC |
| --- | --- |
| `categories-store.ts` inicializa um atom com `CATEGORIES_MOCK` | React Query passa a ser a única fonte de categorias reais |
| O diálogo já usa `useForm`, `zodResolver` e `Controller` | Reaproveitar o schema e extrair a lógica; acrescentar o ciclo assíncrono |
| O diálogo gera `crypto.randomUUID()` e bloqueia nomes duplicados | Usar o ID retornado pelo servidor e remover a restrição de unicidade |
| O formulário usa `FieldError` | Renderizar erros de campo no formato explícito solicitado na seção 6 |
| Settings calcula impacto pelos stores locais | Consultar exclusivamente a rota de impacto antes da confirmação |
| Create retorna JSON; edit e delete retornam `204` | Preservar essas diferenças nas assinaturas e no tratamento do retorno |
| Identity possui ciclo de sessão e tratamento defensivo de `HTTPError` | Reutilizar o ciclo; criar mensagens próprias de Categories |
| Identity pode converter validações da API em erros de campo | Em Categories, erros da API ficam somente no Alert geral |
| Plans, Work Logs, Dashboard e Reports leem `useCategories` | Preservar um adaptador de leitura compartilhado, sem um segundo store de dados |

A API implementada é a referência para o contrato. Não assumir o estado antigo de
integração descrito em documentos gerais nem implementar itens de SPECs antigas de Identity.

## 3. Contrato HTTP e tipagem

### 3.1. Transporte

- Reutilizar `api` de `@/lib/ky`, com `baseUrl` e `credentials: 'include'` existentes.
- Usar caminhos `api/categories...` sem barra inicial nas calls, como Identity.
- A sessão identifica o usuário. Não enviar `userId`, token ou `Authorization` manual.
- Exportar interfaces de entrada e saída por operação. Sem parâmetros HTTP, não criar
  uma interface de request vazia. Sem body de resposta, usar `Promise<void>`.
- Propagar rejeições do Ky. Calls não exibem toast/Alert, não navegam e não alteram cache.
- Enviar apenas os campos do body, explicitamente; `categoryId` pertence ao path.
- Nas mutações, desabilitar repetição automática também no Ky (`retry: 0`), além do
  React Query. Uma falha de rede não autoriza reenviar uma escrita automaticamente.
- Permitir `AbortSignal` como opção de transporte das duas consultas para consumir
  o `signal` do React Query. Essa opção não é query parameter nem parte do JSON.

### 3.2. Inventário obrigatório

| Arquivo em `web/src/api/` e função | Método e rota pública | Request HTTP | Response de sucesso |
| --- | --- | --- | --- |
| `create-category.ts` — `createCategory` | `POST /api/categories` | Body: `name`, `color` obrigatórios | `201`, `{ data: ICategory }` |
| `fetch-categories.ts` — `fetchCategories` | `GET /api/categories` | Nenhum parâmetro ou body | `200`, `{ data: ICategory[] }` |
| `edit-category.ts` — `editCategory` | `PATCH /api/categories/:categoryId` | Path: UUID; body parcial: `name?`, `color?` | `204`, sem body |
| `delete-category.ts` — `deleteCategory` | `DELETE /api/categories/:categoryId` | Path: UUID; sem body | `204`, sem body |
| `get-category-deletion-impact.ts` — `getCategoryDeletionImpact` | `GET /api/categories/:categoryId/deletion-impact` | Path: UUID; sem body | `200`, `{ data: { plansCount: number, workLogsCount: number } }` |

Não há paginação, busca, ordenação configurável ou consulta de categoria individual.
A listagem retorna todas as categorias do usuário, ordenadas por nome pela API.
Preservar a ordem retornada; não inventar metadados de paginação.

### 3.3. Tipos de dados

Reutilizar `ICategory` e `TCategoryColor` de `features/categories/model` como fontes
únicas do modelo. Não adicionar `userId`, `createdAt` ou `updatedAt` às respostas:
esses campos não são expostos pelo presenter.

```ts
// Modelo compartilhado existente; não duplicar nos arquivos de calls.
interface ICategory {
	id: string
	name: string
	color: TCategoryColor
}

// Em create-category.ts
export interface CreateCategoryRequest {
	name: string
	color: TCategoryColor
}
export interface CreateCategoryResponse {
	data: ICategory
}

// Em fetch-categories.ts
export interface FetchCategoriesResponse {
	data: ICategory[]
}

// Em edit-category.ts
export interface EditCategoryRequest {
	categoryId: string
	name?: string
	color?: TCategoryColor
}

// Em delete-category.ts
export interface DeleteCategoryRequest {
	categoryId: string
}

// Em get-category-deletion-impact.ts
export interface GetCategoryDeletionImpactRequest {
	categoryId: string
}
export interface GetCategoryDeletionImpactResponse {
	data: {
		plansCount: number
		workLogsCount: number
	}
}
```

Assinaturas de retorno: `Promise<CreateCategoryResponse>`,
`Promise<FetchCategoriesResponse>`, `Promise<void>`, `Promise<void>` e
`Promise<GetCategoryDeletionImpactResponse>`, respectivamente. Para as consultas,
uma opção de transporte tipada `{ signal?: AbortSignal }` pode ser um argumento
separado; `fetchCategories` continua sem request de domínio.

As calls com JSON retornam o envelope `data` completo via `.json<Response>()`.
As calls de edição/exclusão somente aguardam a resposta: nunca chamar `.json()` em `204`.
O cache mantém o envelope tipado; a camada de leitura pode expor `categories = data?.data ?? []`
acompanhadas do estado da consulta. Um array derivado vazio não significa consulta concluída.

`CategoryDto.color` está declarado como `string` na classe HTTP, mas os DTOs de entrada,
a entidade e a persistência restringem o valor às mesmas 18 cores já existentes no frontend:
`red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`,
`blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `slate`.
Usar `TCategoryColor` conforme esse contrato, sem importar código de `api/` no bundle web.

### 3.4. Regras e respostas de erro

- Nome: `string`, `trim`, mínimo 1 e máximo 40 caracteres. Não aceitar `null`.
- Cor: um dos valores de `CATEGORY_COLORS`; não aceitar `null`, hexadecimal ou valor livre.
- Edição: campos opcionais; omissão mantém o valor existente. A API aceita body vazio,
  mas a interface evita PATCH quando não houver alteração efetiva.
- Nomes duplicados são aceitos. Não impor validação local de unicidade ou prever `409`
  como parte deste contrato. A identidade de cada item é seu ID, nunca nome/cor.
- IDs de rota são UUIDs reais vindos da listagem ou criação; não enviar IDs de mock,
  `null`, `undefined` ou sentinelas como `no-category`.
- A API normaliza o nome com NFC, trim e colapso de espaços internos. O DTO valida
  trim/limites antes dessa normalização de domínio; o schema web deve respeitar essa
  ordem. Após escrita, o valor confirmado pela API é o valor canônico de apresentação.
- `400`: body ou UUID inválido, nome/cor rejeitados. `401`: sessão ausente/inválida.
- `404`: categoria inexistente ou pertencente a outro usuário, em edit/delete/impacto.
  Não distinguir essas duas situações nem tratar esse `404` como logout.
- Falhas inesperadas podem retornar `5xx`; erros sem resposta HTTP também devem ser tratados.

Há dois formatos locais de erro relevantes. O DTO Swagger genérico não descreve
integralmente a resposta customizada do `ZodValidationPipe`:

```ts
type CategoryApiErrorBody =
	| { statusCode: number; message: string; error: string }
	| {
			message: 'Data validation failed'
			errors: {
				formErrors: string[]
				fieldErrors: Record<string, string[] | undefined>
			}
		}
```

Esses tipos documentam os bodies conhecidos; não garantem o formato de toda falha de
rede ou infraestrutura. O `catch` recebe `unknown`; inspecionar `HTTPError`, status e
eventual `error.data` defensivamente. Nunca converter uma rejeição em array vazio,
sucesso fictício ou erro de formulário.

## 4. Organização de responsabilidades

Fluxo: componente → hook de lógica → hook React Query → call HTTP → API.
As decisões de apresentação ficam fora das calls e os componentes não importam Ky.

| Local proposto | Responsabilidade |
| --- | --- |
| `web/src/api/` — cinco arquivos da seção 3.2 | Chamadas HTTP e seus contratos tipados |
| `web/src/features/categories/model/category-query-keys.ts` | Factory única de chaves da feature |
| `web/src/features/categories/model/category-schema.ts` | Schema e tipo do formulário; reaproveitar o existente |
| `web/src/features/categories/model/category-errors.ts` | Normalização de erro `unknown` em mensagem por operação |
| `web/src/features/categories/hooks/use-categories-query.ts` | `useQuery` da listagem e estados da consulta |
| `web/src/features/categories/hooks/use-category-deletion-impact.ts` | `useQuery` de impacto condicionada ao diálogo/ID |
| `web/src/features/categories/hooks/use-category-mutations.ts` | Hooks `useCreateCategory`, `useEditCategory`, `useDeleteCategory`, com `useMutation` e sincronização do cache |
| `web/src/features/categories/hooks/use-category-form.ts` | `useForm`, defaults/reset, comparação de edição, submit e erro geral do formulário |
| `web/src/app/pages/settings/hooks/use-categories-settings.ts` | Abertura dos diálogos, seleção do alvo, mensagens da listagem e coordenação da preferência local |
| `web/src/app/pages/settings/hooks/use-delete-category-dialog.ts` | Consulta de impacto, confirmação assíncrona, erro geral e ponte de limpeza dos vínculos locais |
| `web/src/features/categories/store/categories-store.ts` | Adaptador do `useCategories` atual: consulta compartilhada + preferência local |

O adaptador preserva `categories`, `uncategorizedColor` e `setUncategorizedColor` para
os consumidores de leitura, expondo também os estados da consulta quando necessários.
Remover `categoriesAtom` e as mutações síncronas `addCategory/updateCategory/removeCategory`.
Não espelhar o resultado da query em atom, `useState` ou `localStorage`. Manter somente
o atom da preferência; não criar outra camada de repositório ou Provider.

Os hooks de mutação possuem as regras de cache; os hooks de lógica possuem o formulário,
erros visíveis, fechamento e toasts. Efeitos de sucesso não devem ser executados em
duplicidade nas duas camadas. Usar `mutateAsync` com `try/catch` e `retry: false`;
preservar o padrão de Identity de `networkMode: 'always'` para falhas offline imediatas.
Manter pendência até concluir a sincronização prevista, sem ocultar um erro de refetch.

## 5. Cache, consultas e sessão

### 5.1. Query keys

Usar uma factory central e readonly, sem strings repetidas nos consumidores:

```ts
export const categoryKeys = {
	all: ['categories'] as const,
	list: (generation: number) => ['categories', generation, 'list'] as const,
	deletionImpact: (generation: number, categoryId: string) =>
		['categories', generation, 'deletion-impact', categoryId] as const,
}
```

`generation` é a geração já exposta por `useIdentityLifecycle`, não um novo ID de usuário
nem um dado enviado à API. O perfil atual não expõe `userId`; não inventar esse campo.
Separar os caches por geração evita reaproveitar dados de uma sessão anterior.
Usar `mutationKey` sob `['categories', generation, operação]` para as três mutações.

Todas as instâncias da listagem usam a mesma chave na mesma sessão. Não criar chaves
por página, modo de diálogo, nome ou cor. Usar o `QueryClient` existente.

### 5.2. Regras de consulta

- Listagem: habilitada no contexto autenticado, quando `!busy && !ended`; `retry: false`
  e `staleTime: 0`. Revalidar ao remontar e ao voltar o foco, usando o cache disponível.
- Não inicializar com `CATEGORIES_MOCK` ou `initialData: []`. Mostrar vazio somente após
  sucesso real com `data: []`.
- Impacto: habilitado apenas com diálogo aberto, ID válido e sessão ativa. Reconsultar
  em toda abertura, inclusive para o mesmo ID, e quando o alvo mudar; `retry: false`
  e `staleTime: 0`.
- Nunca usar `placeholderData` para transportar contagens de uma categoria para outra.
- Após abrir/reabrir, a confirmação exige sucesso de uma consulta dessa abertura para
  o alvo atual. Dados antigos em cache não liberam a exclusão durante o refetch.
- Cancelar a consulta de impacto ao fechar ou trocar de alvo. Consumir `AbortSignal`
  e ignorar cancelamentos esperados, sem Alert de falha de conexão.

### 5.3. Sincronização após mutações

Não implementar atualização otimista antes da confirmação HTTP nesta etapa.

| Resultado confirmado | Efeito no cache |
| --- | --- |
| Create `201` | Cancelar listagem anterior em voo; se houver lista em cache, inserir/substituir por ID usando `response.data`, sem duplicar. Invalidar e reconsultar a lista para restaurar a ordem canônica |
| Edit `204` | Cancelar listagem anterior em voo; invalidar e reconsultar a lista. Não presumir uma categoria no body nem fabricar o nome normalizado pelo servidor |
| Delete `204` | Cancelar consultas anteriores pertinentes; remover o ID da lista em cache, remover a query de impacto desse ID e invalidar/reconsultar a lista |
| Edit/delete/impacto `404` | Exibir erro geral, invalidar a lista para reconciliação e impedir novas ações sobre o alvo que deixou de existir; remover seu impacto obsoleto |
| Outra falha HTTP/rede da mutação | Preservar dados e rascunho; não emitir toast de sucesso nem limpar vínculos locais |

Não preencher uma lista ainda desconhecida com apenas o item criado. Nesse caso,
consultar a lista completa. A atualização por ID após create/delete só ocorre após sucesso.
Esperar o refetch de consumidores ativos; listas inativas permanecem invalidadas para a
próxima leitura. Não usar `queryClient.clear()` ou invalidar caches de outros módulos.

Sucesso da escrita e sucesso da atualização da listagem são estados diferentes.
Se a escrita concluir e o refetch falhar, informar o sucesso da escrita uma única vez,
fechar o diálogo e mostrar na listagem um Alert com opção de atualizar. Não apresentar
“falha ao salvar” nem reenviar a mutação para tentar recuperar a consulta. Dados antigos
podem permanecer visíveis com indicação de desatualização até o novo fetch.

### 5.4. Integração limitada com Identity

Reutilizar `useIdentityLifecycle` e `useEndSession`: bloquear consultas/escritas durante
encerramento e proteger continuações assíncronas com a geração capturada. Respostas
atrasadas não podem escrever no cache da nova sessão, limpar seus vínculos locais,
fechar seus diálogos ou emitir toasts referentes à sessão anterior.

Estender apenas a limpeza de sessão em
`web/src/features/identity/hooks/use-end-session.ts` para cancelar/remover queries sob
`categoryKeys.all` e remover mutations de Categories, nos mesmos pontos já usados
por `endSession` e `afterSignIn`. Não alterar os contratos ou formulários de Identity.
Desabilitar consultas isoladamente não apaga dados: a remoção do cache é obrigatória.
Remover uma mutation do cache não cancela a escrita HTTP; a proteção dos callbacks
pela geração continua necessária.

Em `401`, usar a revalidação de sessão existente; se confirmada a expiração, deixar
esse fluxo encerrar a sessão. Se a sessão continuar válida ou a revalidação falhar
por infraestrutura, manter erro geral recuperável. `404` de Categories não aciona
revalidação de perfil com `includeNotFound`.

## 6. Formulário e separação de erros

### 6.1. Validação local

`useCategoryForm` deve usar `useForm<TCategoryFormData>` e
`zodResolver(categorySchema)`, com `register('name')` e `Controller` para `color`.

- Nome: `z.string().trim().min(1, 'Name is required').max(40, 'Name must be 40 characters or less')`.
- Cor: `z.enum(CATEGORY_COLORS)` com mensagem explícita `Select a valid color`.
- Criação: defaults `{ name: '', color: 'blue' }`.
- Edição: preencher com o item selecionado e enviar somente campos alterados, comparando
  os valores validados com os originais. Manter ambos os campos válidos no formulário,
  mesmo que o request PATCH permita propriedades opcionais.
- `Save` fica desabilitado sem mudanças efetivas; repetir a verificação no submit.
- Remover a busca de duplicatas e seu `setError('name', ...)`; remover a dependência
  do formulário da coleção completa de categorias.
- Resetar valores, erros e estado da mutation ao abrir uma nova operação/trocar alvo.
  Não resetar o rascunho por todo refetch de fundo da lista.
- Validação inválida impede qualquer call; `<form noValidate>` mantém Zod como fonte
  das mensagens, sem substituição por balões nativos do navegador.

### 6.2. Erros de campo

Somente erros de validação local Zod/React Hook Form aparecem abaixo de cada campo.
Substituir `FieldError` neste diálogo pelo formato abaixo, com ID associado ao controle:

```tsx
{errors.name && (
	<p id="name-error" className="text-sm text-destructive">
		{errors.name.message}
	</p>
)}

{errors.color && (
	<p id="color-error" className="text-sm text-destructive">
		{errors.color.message}
	</p>
)}
```

Aplicar `aria-invalid` e `aria-describedby` aos respectivos controles. Ajustar
`CategoryColorSelect` para encaminhar a descrição do erro e a referência de foco do
`Controller` ao trigger, preservando `onBlur`, `invalid` e `disabled` existentes.
Manter labels e navegação por teclado. Não alterar as primitivas genéricas de UI.

### 6.3. Erros da API

Manter `error: string | null` separado de `formState.errors` no hook de lógica.
Renderizar um Alert geral no formulário, diálogo de exclusão ou área da listagem:

```tsx
{error && (
	<Alert variant="destructive">
		<AlertDescription>{error}</AlertDescription>
	</Alert>
)}
```

Todo erro retornado pela API, inclusive `400` com `errors.fieldErrors`, fica nesse
Alert. Não chamar `setError` do React Hook Form para erros HTTP e não reutilizar
`getValidationErrors` de Identity. Toast não substitui o Alert de erro.
O estado geral deve ser limpo ao iniciar nova tentativa ou operação, mantendo os
valores digitados após falha. Mensagens técnicas, JSON bruto e stacks não são exibidos.

Centralizar em `getCategoryError(error: unknown, operation)` as mensagens de Categories:

| Condição | Mensagem esperada ou equivalente |
| --- | --- |
| Sem resposta HTTP | `Unable to connect. Check your connection and try again.` |
| `400` em create/edit | `The category could not be saved. Check the name and color and try again.` |
| `400` em impacto/delete | `This category could not be accessed. Refresh the list and try again.` |
| `401` ainda não resolvido pelo ciclo de sessão | `Unable to verify your session. Please try again.` |
| `404` | `This category is no longer available. Refresh the list.` |
| `5xx` | `The service is unavailable. Please try again.` |
| Outra falha | Mensagem de falha da operação atual: carregar, criar, salvar, excluir ou verificar impacto |

## 7. Fluxos e interatividade

### 7.1. Listagem

Settings distingue: carregamento inicial, sucesso vazio, sucesso com itens, falha inicial
e falha de atualização com cache anterior. Mostrar feedback de carregamento sem flash
de “No categories yet”; erro tem Alert e ação `Try again` que refaz somente a consulta.
Falha de refetch preserva itens anteriores e informa que a atualização falhou.
Manter preferência de cor local disponível independentemente do resultado HTTP.

### 7.2. Criação e edição

O submit validado aguarda `mutateAsync`. Exibir `Creating…`/`Saving…`; bloquear campos,
submit duplicado, Cancel, Escape e fechamento externo enquanto a operação estiver
pendente. O handler também verifica pendência/sessão para impedir envio por Enter ou
cliques repetidos. Ao falhar, manter diálogo e valores, mostrar Alert e permitir nova tentativa.

Após sucesso, sincronizar a lista conforme seção 5, fechar e emitir uma única mensagem
`Category created`/`Category updated`. O ID criado vem exclusivamente da resposta `201`.
Categoria removida externamente durante edição produz `404`: manter feedback acessível,
bloquear novo envio ao alvo inexistente e oferecer fechamento/atualização da listagem.

### 7.3. Impacto e exclusão

1. Clicar em Delete abre o diálogo para o item selecionado e consulta seu impacto.
2. Enquanto consulta, mostrar `Checking category usage…` e desabilitar confirmação.
   Não apresentar zero como substituto de valores desconhecidos.
3. Com sucesso, usar exatamente `plansCount` e `workLogsCount` da resposta, com singular/
   plural, para informar quantos registros ficarão sem categoria. Zero é resultado válido.
4. Com falha, mostrar Alert e `Try again`; confirmação permanece bloqueada. Em `404`,
   reconciliar a lista e oferecer fechamento, sem permitir DELETE desse alvo.
5. Confirmar envia apenas `DELETE /api/categories/:categoryId`. Durante a escrita,
   mostrar `Deleting…`, impedir duplicidade e fechamento. Falha mantém o diálogo aberto.
6. Após `204`, atualizar o cache, executar somente a ponte local descrita na seção 8,
   fechar e emitir `Category deleted`. Os registros persistidos ficam sem categoria por
   ação do backend, sem chamadas adicionais do frontend para editar relações.

O impacto é uma fotografia, não uma reserva transacional ou autorização permanente:
vínculos podem mudar entre GET e DELETE. Não inventar token de confirmação, bloqueio
por contagem positiva ou exigência de que a contagem final seja idêntica à consultada.
Cancelar antes da confirmação não exclui nada. Fechar/reabrir exige nova consulta de impacto.

## 8. Compatibilidade e limite das refatorações

`useCategories` é consumido por Settings, Plans, Work Logs, Dashboard e Reports.
Todos devem ler a mesma coleção real. O adaptador da seção 4 preserva os consumidores
de leitura; mudanças fora de Settings limitam-se a apresentar loading/erro da categoria
ou ajustar props estritamente necessárias. Não migrar dados ou regras desses módulos.

`CATEGORIES_MOCK` não pode inicializar, completar nem recuperar a query real. O arquivo
de mocks pode permanecer como dependência das fixtures de Plans/Work Logs. Seus IDs
legados não correspondem a categorias reais: nunca associar automaticamente por nome
ou cor, criar categorias na API para compensar mocks, ou enviar esses IDs às cinco calls.
Categorias não resolvidas usam o fallback visual existente; a listagem de opções mostra
somente categorias reais. Falha/carregamento de categorias não apaga vínculos nem impede
o uso independente de Plans e Work Logs sem categoria.

Para preservar a interação já existente no protótipo, após DELETE bem-sucedido,
reutilizar `clearCategory(id)` dos stores locais de Plans e Work Logs. Essa coordenação
fica no hook do diálogo em Settings, fora dos hooks de dados da feature Categories.
Limpar somente referências ao ID efetivamente excluído, sem remover registros e sem
reescrever os stores. Não usar esses stores para calcular ou alterar o impacto exibido;
contagens da API podem diferir dos registros locais de protótipo.

Arquivos esperados na implementação: as cinco calls, modelos/hooks de Categories,
o adaptador `categories-store.ts`, hooks/componentes específicos de Settings e o ajuste
de limpeza em `use-end-session.ts`. Mudanças pontuais em componentes de categoria são
permitidas para acessibilidade/estados assíncronos. Não incluir correções gerais,
renomeações em massa ou modificações do backend.

## 9. Critérios de aceite

| ID | Cenário verificável | Resultado exigido |
| --- | --- | --- |
| CA-01 | Inspecionar as calls | Exatamente as cinco operações da seção 3.2, no cliente existente, com requests/responses tipados, envelope `data` preservado e sem parse de JSON em `204` |
| CA-02 | Abrir Settings com sessão válida e recarregar a página | Categorias vêm do GET real, ordenadas pela API; dados criados anteriormente continuam presentes |
| CA-03 | GET lento, vazio, falho e refetch falho | Loading sem vazio falso; vazio só após sucesso; Alert/retry nas falhas; cache anterior preservado quando disponível |
| CA-04 | Criar categoria válida | Um POST com `name`/`color`; ID vem do servidor; item aparece após sincronização e existe após reload; diálogo fecha e toast ocorre uma vez |
| CA-05 | Submeter nome vazio, só espaços, 41 caracteres ou cor inválida | Nenhuma call; mensagem abaixo do campo correspondente, com classes/IDs/ARIA da seção 6; nomes de 1 e 40 caracteres são aceitos |
| CA-06 | Criar/editar com nome já utilizado e com espaços nas bordas | Duplicata permitida; validação aplica trim; apresentação final corresponde ao nome normalizado pelo servidor |
| CA-07 | Editar nome, somente cor e salvar sem mudanças | PATCH envia somente mudanças; preserva campos omitidos; sem mudanças não envia request; `204` não gera erro de parse |
| CA-08 | API rejeita form localmente válido, inclusive com `fieldErrors` | Alert geral com mensagem útil, sem adicionar erro HTTP a `formState.errors`; rascunho preservado e nova tentativa possível |
| CA-09 | Abrir exclusão de categorias A e B, cancelar e reabrir A | GET de impacto por ID a cada abertura; nunca mostrar contagens de outro alvo; sem DELETE ao cancelar; confirmação bloqueada durante consulta |
| CA-10 | Impacto zero, positivo, falho ou `404` | Zero permite confirmar; positivo informa contagens reais; falha tem Alert/retry; falha/`404` nunca libera exclusão |
| CA-11 | Confirmar exclusão com vínculos reais na API | Um DELETE seguido de `204`; categoria desaparece; Plans/Work Logs persistidos permanecem com `categoryId: null`; nenhuma call adicional de escrita nesses módulos |
| CA-12 | Falha de delete ou repetição de clique/Enter durante escrita | Nenhuma remoção local em falha; diálogo permanece com Alert; pendência bloqueia fechamento e envios repetidos |
| CA-13 | Operação em outra aba remove o alvo antes de editar/excluir/consultar impacto | `404` reconcilia lista e informa indisponibilidade; não encerra sessão válida nem repete escrita automaticamente |
| CA-14 | Escrita tem sucesso e GET seguinte falha | Sucesso da escrita é preservado; Alert na lista e retry somente do GET; não induzir duplicação de POST/PATCH/DELETE |
| CA-15 | Navegar entre consumidores e alterar categoria | Uma única fonte de dados e query key por sessão; nome/cor/opções convergem após refetch; sem fallback para mocks |
| CA-16 | Logout, login em outra conta e resposta atrasada da sessão anterior | Queries/mutations de Categories anteriores removidas; nenhuma categoria, contagem ou efeito atrasado vaza para a nova sessão |
| CA-17 | Receber `401`, erro de rede ou `5xx` | `401` participa do ciclo de sessão existente; falhas recuperáveis têm Alert; não há loop de retry ou exposição de mensagem técnica |
| CA-18 | Usar teclado e layout mobile | Labels, foco, descrição dos erros, abertura/fechamento e estados disabled continuam acessíveis e utilizáveis |
| CA-19 | Alterar cor de “Uncategorized items” e usar módulos sem categoria | Preferência continua local e independente; nenhuma request adicional, categoria obrigatória ou associação com Tasks é introduzida |
| CA-20 | Verificar escopo e tipos da implementação futura | `pnpm --dir web run typecheck` passa; alterações restritas às responsabilidades desta SPEC, sem backend ou dependências novas |

## 10. Verificação da implementação futura

Validar os cenários acima com API local autenticada e DevTools de rede, incluindo uma
conta sem categorias e uma categoria ligada a Plan/Work Log reais. Como esses módulos
ainda são protótipos no frontend, preparar os vínculos pela API para verificar o impacto
e a preservação dos registros, sem implementar suas integrações nesta etapa.

Usar throttling/offline e respostas controladas para observar loading, falhas, duplicidade
de submit e troca de sessão durante requests. Registrar os resultados dos cenários
críticos e eventuais limitações no trabalho de implementação. A ausência de um runner
de testes no `web/package.json` não autoriza acrescentar uma infraestrutura de testes
ampla neste escopo; verificar contratos e fluxos sem testes que apenas repitam o código.

Executar `pnpm --dir web run typecheck` após implementar. Executar build se houver
mudança que afete o bundle, conforme `web/AGENTS.md`. A validação desta entrega é
documental: revisão dos contratos, coerência dos fluxos e diff restrito a esta SPEC.

## 11. Implementação e verificação — 2026-09-03

Implementados os cinco contratos HTTP, hooks de consulta/mutação, formulários e diálogos
assíncronos, cache por geração de sessão e adaptador de leitura dos consumidores existentes.
Identity recebeu somente a extensão da limpeza de queries/mutations de Categories.
Os dados de categorias não são mais inicializados com mocks; a preferência de cor permanece local.

Validação funcional executada em Chromium headless com Playwright temporário, utilizando
o frontend e a API locais. Contas sintéticas foram criadas para a verificação e removidas
ao terminar. Não foram adicionadas dependências ou infraestrutura de testes ao projeto.

Foram aprovados 22 grupos de verificação:

- Listagem autenticada vazia, carregamento sem vazio falso, erro inicial e recuperação.
- POST real com ID do servidor, normalização, nomes duplicados e persistência após reload.
- PATCH apenas do nome ou da cor, bloqueio sem alterações e resposta `204` sem parse de JSON.
- Nome vazio, espaços e excesso de caracteres com erros locais e associação ARIA; limites
  de 1/40 caracteres e mensagem do enum de cor conferidos no schema.
- `400` com `fieldErrors` somente no Alert geral, preservação do rascunho e falha de rede.
- Bloqueio de submit repetido, Cancel e Escape durante escrita.
- Escrita concluída com falha posterior do GET: sucesso preservado e retry apenas de leitura.
- Impacto real com Plan e Work Log vinculados; DELETE preserva ambos, consultados depois
  pela API com `category: null` (o presenter de listagem expõe a relação, não `categoryId`).
- Impacto zero, reabertura exigindo nova consulta, falha/retry e cancelamento da request.
- Falha de DELETE preservando categoria; `404` na edição ou impacto sem logout e sem loop.
- Logout removendo queries/mutations; resposta de escrita atrasada sem afetar a próxima conta.
- `401` confirmando expiração pelo fluxo existente de Identity.
- Formulário mobile, fechamento por teclado, preferência sem escrita HTTP e rascunho
  preservado durante refetch. Nenhuma exceção de runtime nos fluxos executados.

Verificação estática e de produção:

- `pnpm --dir web run typecheck`: aprovado. O comando atual usa o tsconfig raiz com
  referências e não percorre, sozinho, os arquivos do projeto React.
- `pnpm --dir web exec tsc --noEmit -p tsconfig.app.json`: mesmos nove diagnósticos
  preexistentes da verificação anterior às alterações; nenhum diagnóstico nos arquivos
  de Categories ou nos demais arquivos modificados. Os erros existentes estão em
  `product-showcase.tsx` (seis), `task-board-card.tsx`, `tasks-board.tsx` e
  `radial-metric-card.tsx`; suas correções ficaram fora deste escopo.
- `pnpm --dir web run build`: aprovado, com aviso de bundle maior que 500 kB.
- Biome nos arquivos TypeScript alterados e `git diff --check`: aprovados.

Limites: os demais módulos continuam com dados de protótipo. A verificação de relações
persistidas usou a API diretamente; não representa integração HTTP de Plans/Work Logs.
As verificações de navegador foram executadas nesta entrega e não constituem uma suíte
de regressão instalada no repositório.
