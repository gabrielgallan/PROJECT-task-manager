# SPEC 02 — Integração de Identity na interface web

Status: especificação consolidada para implementação futura. Esta entrega altera somente documentação.

## 1. Objetivo e decisões

Conectar os fluxos de Identity da interface às chamadas existentes de `web/src/api`,
substituindo mocks e ações simuladas por consultas e mutações com React Query.
Corrigir as incompatibilidades de interface identificadas antes de conectar os formulários.

Esta SPEC complementa [01-identity-api-calls.md](./01-identity-api-calls.md). A SPEC 01
define os contratos HTTP; este documento define os consumidores, a experiência e o
ciclo de vida dos dados. Não reimplementar a camada de transporte.

Decisões confirmadas pelo usuário:

- Adaptar o frontend à API atual, sem alterações no backend.
- Não integrar GitHub ou Google nesta etapa.
- Após cadastro, redirecionar para login com o email preenchido, sem autenticação automática.

Decisões de implementação adotadas para completar os fluxos:

- Remover os botões OAuth e seus separadores das páginas de login e cadastro.
  Preservar as duas funções HTTP de providers para uma etapa posterior.
- Remover `username` do modelo, da validação e das apresentações de identidade.
- Exibir email somente para leitura no perfil; permitir editar nome e cargo.
- Exigir nome no cadastro; permitir limpar nome e cargo na edição de perfil.
- Incluir upload de avatar, redefinição de senha, exclusão de conta e revogação de
  todas as sessões, completando as 13 operações não OAuth.
- Manter a interface em inglês, como as telas existentes; não introduzir i18n nesta etapa.
- Preservar a estrutura visual atual, seus componentes e o comportamento responsivo.

## 2. Limites

Incluído: páginas de autenticação por senha, perfil, avatar, segurança, sessões,
identidade exibida em Settings e navegação desktop/mobile, proteção do layout,
tratamento de erros e sincronização do cache desses fluxos.

Fora do escopo:

- Alterações em `api/`, contratos HTTP, cookies, CORS, provedores de email ou OAuth.
- Edição de email, username, `hasPassword`, associação de providers e remoção de avatar.
- Callbacks OAuth, client IDs, variáveis de ambiente de providers ou dependências novas.
- Integração de Tasks, Plans, Work Logs, Categories, relatórios e dashboards.
- Persistência de notificações, tema, timezone e horários de trabalho por Identity.
- Reformulação visual ampla, alterações genéricas nas primitivas de UI e correções
  de TypeScript sem relação com os arquivos e comportamentos desta SPEC.

Os stores operacionais continuam sendo protótipos independentes de usuário. Esta
entrega não os converte em dados persistidos ou segregados por conta. Preferências
locais, como tema e timezone, continuam locais e não são apagadas no logout.

## 3. Diagnóstico consolidado

Análise baseada nos componentes, schemas, rotas, controllers, DTOs, presenters e
casos de uso locais. Não representa comprovação de funcionamento dos serviços externos.

| Área | Situação atual | Solução nesta SPEC |
| --- | --- | --- |
| Login | Integração parcial; mínimo de 1 caractere, envio duplicável, erro assumido como `error.data.message` | Mínimo de 6; controle de pendência; leitura defensiva de erro; renovação dos dados de identidade |
| Cadastro | Nome opcional, senha sem máximo, submit com `console.log` | Nome obrigatório, senha de 6–18; `register`; login com email preenchido |
| OAuth | Botões sem comportamento | Remover controles visíveis; manter wrappers sem uso |
| Layout autenticado | `!data` é tratado como logout; acesso a `data.profile` ainda indefinido | Separar carregamento, sessão inválida e falha de consulta |
| Perfil em Settings | `PROFILE_MOCK`, estado local e tipos não anuláveis | Perfil compartilhado do React Query; adaptar valores nulos para apresentação |
| Username | Obrigatório no schema, ausente no formulário e na API | Remover de tipos, schema, defaults e cabeçalhos |
| Email do perfil | Editável, sem endpoint para salvar | Somente leitura, fora do schema e payload de edição |
| Nome/cargo | Nome obrigatório; cargo limitado a 60 só no frontend | Opcionais na edição; vazios enviados como `null`; remover limite artificial de cargo |
| Avatar | Apenas exibição; sem upload | Seção independente para selecionar e enviar arquivo |
| Troca de senha | Mínimo de 8, sem máximo; sucesso simulado | Nova senha de 6–18; confirmação local; submit real |
| Recuperação | Texto promete código; envio simulado | Texto de link; envio real e confirmação |
| Redefinição | Sem página nem rota | `/auth/reset-password?code=<UUID>`; mapear `code` para `tokenId` |
| Sessões | Mock com IDs não UUID e última atividade inventada | Dados reais; rótulos derivados; apresentar início da sessão |
| Revogação individual | Remove apenas item local | `revokeSession`, pendência e atualização da consulta |
| Revogação completa | Controle ausente | Confirmação que inclui o dispositivo atual e encerramento local |
| Logout | Navegação sem revogar cookie/sessão | `signOut` e encerramento compartilhado em desktop/mobile |
| Exclusão | Botão sem ação | Confirmação explícita, `deleteUser`, encerramento após sucesso |
| Identidade mobile | Nome/avatar/username fixos | Mesmo perfil e fallbacks usados no desktop |

Fontes principais:

- `web/src/app/pages/auth/{sign-in,sign-up,forgot-password}/index.tsx`.
- `web/src/app/pages/settings/index.tsx`, `model/profile-settings.ts` e componentes
  `account-settings.tsx` e `security-settings.tsx`.
- `web/src/app/layouts/default/index.tsx`, `components/app-sidebar.tsx`,
  `components/nav-user.tsx` e `components/mobile-nav-user.tsx`.
- `web/src/router.tsx`, `web/src/lib/react-query.ts`, `web/src/lib/ky.ts` e `web/src/api/`.
- `api/src/infra/http/identity/controllers/`, respectivos DTOs e presenters.
- `api/src/infra/email/resend/resend-email-sender.ts`: URL efetiva do link de recuperação.
- Casos de uso de senha/sessões e `prisma-sessions-repository.ts`: alcance das operações.

## 4. Organização e tipos

Criar um núcleo pequeno em `web/src/features/identity/`:

| Arquivo | Responsabilidade |
| --- | --- |
| `model/identity.ts` | Tipos de perfil/sessão derivados dos retornos das chamadas; apresentação de nome/iniciais e rótulos de sessão |
| `model/identity-forms.ts` | Schemas e tipos de formulários; regras compartilhadas de senha/email; transformação de campos editáveis |
| `model/identity-errors.ts` | Classificação defensiva de erro HTTP/transporte e mensagens por operação |
| `hooks/use-profile.ts` | Query compartilhada de perfil e sua chave |
| `hooks/use-sessions.ts` | Query de sessões e sua chave |
| `hooks/use-end-session.ts` | Mutação de logout e rotina compartilhada de encerramento local |

Manter as demais mutações próximas às páginas/componentes que as consomem. Não criar
um hook por wrapper apenas para repassar a chamada, nem um segundo store de perfil.
O estado dos formulários e do arquivo selecionado continua local.

Derivar os tipos públicos usados nos componentes sem mudar `web/src/api`:

```ts
import type { fetchSessions } from '@/api/fetch-sessions'
import type { getProfile } from '@/api/get-profile'

export type IdentityProfile = Awaited<ReturnType<typeof getProfile>>['profile']
export type IdentitySession = Awaited<ReturnType<typeof fetchSessions>>['sessions'][number]
```

Os nomes `IdentityProfile` e `IdentitySession` pertencem à camada consumidora. Não
adicionar propriedades inexistentes como `username`, `lastActiveAt` ou `hasPassword`.
Datas permanecem strings no cache; formatação ocorre na apresentação.

Substituir os tipos duplicados de usuário em sidebar/menus pelo tipo compartilhado.
Remover `model/profile-settings.ts` depois de migrar todos os imports: seu tipo e mock
deixam de ser necessários. `AccountSettings` recebe o perfil real e executa sua própria
mutação; eliminar `onProfileChange` e o estado `useState(PROFILE_MOCK)` de Settings.

Novos componentes locais em Settings: `avatar-settings.tsx`, `active-sessions.tsx` e
`delete-account-dialog.tsx`. A confirmação de revogação completa pode ficar dentro de
`active-sessions.tsx`. Reutilizar `AlertDialog`, `Alert`, `Skeleton` e campos existentes.

## 5. Perfil, autenticação e cache

### Queries

- Preservar a chave de perfil `['user:profile']`; usar `['user:sessions']` para sessões.
- `useProfile` reutiliza a mesma consulta no layout e em Settings. Não espelhar dados
  remotos em Jotai ou `localStorage`.
- `useSessions` fica ativo quando a aba Security está selecionada. Evitar consulta
  de sessões em login, cadastro e recuperação.
- Configurar `retry: false` nas queries/mutações de Identity nesta camada, preservando
  o cliente Ky e as configurações globais. O Ky mantém sua política de transporte
  existente; não prometer ausência de retries de rede internos.
- Manter revalidação ao focar a janela e reconectar. Não introduzir polling.

### Proteção do layout

1. Sem dados e com consulta pendente: mostrar skeleton do shell; não renderizar
   `Outlet`, não acessar `data.profile` e não redirecionar.
2. Perfil obtido: renderizar shell e conteúdo. Refetch em segundo plano não desmonta
   a página nem apaga campos em edição.
3. `getProfile` retorna 401: ocultar conteúdo protegido, encerrar dados locais de
   Identity e navegar com `replace` para `/auth/sign-in`. Exibir uma única mensagem
   de sessão encerrada; não criar toasts durante renderização.
4. Outros erros sem dados: mostrar falha de carregamento com botão de nova tentativa.
   Não interpretar 404, 5xx ou indisponibilidade de rede como senha inválida/logout.
5. Outros erros com perfil já carregado: manter conteúdo e mostrar aviso recuperável.

Efeitos de navegação/limpeza devem ocorrer em handlers ou efeitos, com encerramento
idempotente. Uma única falha não pode gerar toasts ou navegações repetidos por consumidor.

### Encerramento e troca de conta

- Logout bem-sucedido, revogação completa bem-sucedida, exclusão bem-sucedida e sessão
  comprovadamente inválida convergem para a mesma rotina de encerramento local.
- Bloquear novas ações durante o encerramento, cancelar consultas de Identity em
  andamento e remover queries e resultados de mutações de Identity. Respostas tardias
  não podem restaurar o perfil anterior ou produzir toasts de sucesso na tela de login.
- Navegar para `/auth/sign-in` com `replace`. Não tentar ler, apagar ou recriar o cookie
  HTTP-only em JavaScript, nem chamar `signOut` depois de uma exclusão/revogação completa.
- Identificar mutations de Identity com prefixo de chave `['identity', ...]` para
  permitir limpeza direcionada. Não limpar cache, stores ou preferências de outras áreas.
- Após autenticação bem-sucedida, descartar dados de Identity da conta anterior antes
  de navegar para `/registers/tasks`; o layout carregará o perfil da sessão nova.
- Um 401 de uma ação não deve ser confundido automaticamente com sessão expirada:
  revogação individual também usa 401 para falta de permissão. Revalidar o perfil;
  se o perfil responder 401, encerrar; se válido, mostrar o erro da operação.
- As páginas públicas permanecem acessíveis, inclusive recuperação/redefinição.
  Não adicionar redirecionamento automático de usuário autenticado nessas páginas.

## 6. Fluxos públicos

### Login

- Email válido; senha com mínimo de 6, sem máximo artificial (o DTO de login não tem máximo).
- Remover botões GitHub/Google, ícones e separador que só serviam a essas opções.
- Manter login, link de cadastro e recuperação. Usar `URLSearchParams` para propagar
  email, preservando `+` e demais caracteres. Nunca passar senha na URL ou no estado de navegação.
- Desabilitar submit durante envio, limpar erro anterior ao tentar novamente e
  mostrar mensagem de credenciais inválidas para 400. Falhas de rede/5xx permitem nova tentativa.
- Em sucesso, executar a transição de identidade descrita na seção 5. Não tratar
  uma falha posterior de consulta de perfil como falha da autenticação já concluída.

### Cadastro

- Campos: nome obrigatório após trim, email válido e senha de 6 a 18 caracteres.
  Não adicionar cargo ou confirmação de senha a este formulário nesta etapa.
- Submeter somente `name`, `email` e `password`. Remover logs de payloads/senhas.
- Em 409, mostrar erro no email indicando conta já existente e manter os valores editáveis.
- Em sucesso, navegar com `replace` para `/auth/sign-in?email=<email codificado>`;
  exibir `Account created. Sign in to continue.` uma vez. Não chamar `authenticate`.

### Solicitação de recuperação

- Manter o email válido; mudar título para `Reset your password` e ação para
  `Send recovery link`. Remover a promessa de código digitável.
- Após 201, mostrar confirmação local de link enviado ao email submetido, com
  `Resend link`, `Use another email` e retorno ao login com email preenchido.
- Reenvio só ocorre por ação explícita; bloquear enquanto pendente, sem timer fictício.
- Em 404, mostrar `No account found with this email`; em rede/5xx/502, mostrar falha
  de envio e permitir repetir. Não mostrar confirmação quando a API rejeitou o envio.

### Redefinição

- Criar `web/src/app/pages/auth/reset-password/index.tsx` e registrar `reset-password`
  dentro de `/auth`, preservando o caminho já usado pelo email do backend.
- Ler `code` da query e validar UUID antes de habilitar submit. Não existe endpoint
  de validação antecipada de token: sua existência/expiração é verificada no envio.
- Campos: nova senha de 6–18 e confirmação igual. Enviar `{ tokenId: code, password }`;
  confirmação nunca sai do frontend. Não alterar ou aplicar trim à senha.
- Token ausente/malformado: mostrar link inválido e ação para pedir outro.
- 400 de token inválido/expirado/usado ou 404: mostrar link não utilizável e recuperação.
  Erro de validação de campos, quando identificável, permanece associado ao formulário.
- Em rede/5xx, manter formulário com possibilidade de nova tentativa.
- Após 204, limpar as senhas, mostrar `Password updated. Sign in to continue.` e
  navegar com `replace` para login. O token não fornece email; não inventar preenchimento.
- A recuperação atual também permite estabelecer senha para uma conta sem senha.
  Não criar detecção de provider ou UI condicional por `hasPassword`.

## 7. Perfil e avatar

### Apresentação compartilhada

- Settings, sidebar e menu mobile usam o mesmo perfil. Nenhum nome, email, foto ou
  inicial fixa de usuário permanece nessas superfícies.
- Nome de exibição: nome não vazio após trim; fallback para email.
- Iniciais: primeira letra do primeiro/último nome; sem nome, primeira letra do email.
- Foto nula, vazia ou com erro: fallback de iniciais. Fornecer texto alternativo.
- Settings exibe nome, email e cargo quando presente. Remover `@username` e o indicador
  decorativo de presença: a API não informa presença online.
- Mobile apresenta nome/email; sidebar pode preservar a linha de cargo, omitida se vazia.

### Edição

- Formulário editável contém apenas `name` e `jobTitle`, ambos strings no React Hook Form.
  Converter `null` para `''` somente na entrada dos campos, preservando o contrato do cache.
- Email permanece visível em input `readOnly`, sem registro no formulário, validação
  ou inclusão no payload. Remover `username` de schema, defaults e tipos.
- Retirar mínimo obrigatório de nome e máximo de 60 caracteres de cargo na edição.
  Após trim, string vazia torna-se `null` no payload; string preenchida é enviada como está normalizada.
- Enviar apenas campos efetivamente alterados, preservando a semântica de omissão.
  Se o payload ficar vazio após normalização, não chamar a API.
- Desabilitar salvar quando não houver alterações ou enquanto a operação estiver pendente.
  Na falha, manter os valores para correção/nova tentativa.
- Após 204, atualizar apenas os campos enviados no cache existente, preservando email
  e avatar; resetar o formulário para os valores salvos e invalidar a query de perfil.
  Refetch que falhar não transforma uma gravação concluída em erro de salvamento.
- Refetch ou upload de avatar não deve sobrescrever nome/cargo que estejam dirty.
  Sincronizar valores remotos quando o formulário estiver limpo; não aplicar `reset`
  indiscriminadamente a cada nova referência do objeto de perfil.

### Upload de avatar

- Adicionar seção independente em Account: avatar atual, seletor de arquivo, nome
  do arquivo escolhido e botão `Upload photo`. O upload não depende de salvar nome/cargo.
- Aceitar JPEG, PNG, WebP e HEIC usando seus MIME types do contrato; um arquivo por vez.
  MIME vazio ou não aceito produz erro local, sem inferência baseada apenas na extensão.
- Exigir arquivo não vazio com tamanho **menor que 5.000.000 bytes**. O validador Nest
  instalado usa comparação estrita `<`; rejeitar também exatamente 5.000.000 bytes.
- Não criar recorte, conversão de imagem, preview obrigatório ou remoção de avatar.
  Isso evita depender de suporte de preview do navegador para HEIC.
- Chamar `uploadAvatar({ file })`; o wrapper já monta multipart. Não montar JSON/base64.
- Bloquear seleção/envio enquanto pendente. Em falha, preservar arquivo para nova tentativa.
- Após 204, limpar seleção, informar sucesso e invalidar perfil para obter `avatarUrl`.
  Se a atualização do perfil falhar, manter a foto anterior e oferecer nova tentativa
  da consulta; não reenviar automaticamente o arquivo.

## 8. Segurança e sessões

### Alteração de senha

- Senha atual não vazia; nova senha com 6–18 caracteres; confirmação deve coincidir.
- Enviar apenas `currentPassword` e `newPassword`. Não aplicar trim às senhas.
- 400 de credenciais inválidas: erro na senha atual; demais validações identificáveis
  ficam no campo correspondente. Limpar valores somente após sucesso 204.
- Manter a sessão atual após sucesso. A API não revoga sessões ao trocar/redefinir senha.
- Como o perfil não informa se há senha, mostrar o mesmo formulário para todos,
  acompanhado de `Forgot or haven't set a password? Send a recovery link`, apontando
  para recuperação com email preenchido. Não afirmar que a conta é OAuth.

### Listagem

- Trocar `SESSION_MOCKS` por `fetchSessions`. Manter a API como fonte de estado e UUIDs.
- A API já retorna sessões não revogadas e não expiradas; não inventar filtros de
  expiração sem `expiresAt`. Preservar a ordem recebida.
- Título: navegador e sistema identificados, por exemplo `Chrome on Windows`.
  Se só um estiver disponível, exibi-lo; sem ambos, `Unknown device`.
- Detalhes: sistema/versão disponíveis, IP disponível e `Signed in on <data/hora>`
  a partir de `createdAt`. Usar a formatação local existente; não chamar isso de última atividade.
- Ícones: smartphone para `mobile`, tablet para `tablet`, laptop para `desktop`;
  tipo ausente/desconhecido usa ícone neutro de dispositivo, sem inferir mobile.
- Mostrar badge `Current` para `isCurrent`; manter revogação individual apenas para as demais.
- Skeleton ao carregar, aviso com retry em falha e estado `No active sessions found`
  para array vazio. Uma falha de refetch preserva a lista anterior com aviso.

### Revogação individual

- Clicar em `Revoke` chama `revokeSession({ sessionId })` sem confirmação adicional.
  Indicar pendência no item; serializar ações de revogação enquanto houver uma pendente.
- Após 204, retirar o item do cache e invalidar sessões. Na falha, preservar item.
- 404 pode significar item removido em outro lugar: refazer consulta e mostrar aviso
  informativo. Para 401, aplicar a revalidação de perfil da seção 5.

### Revogação completa

- Acrescentar `Sign out of all devices` à seção de sessões.
- Antes do envio, usar confirmação com texto que inclui explicitamente o dispositivo
  atual. Não escrever `other devices`: a API não oferece essa operação.
- Enquanto pendente, bloquear confirmação repetida e outras ações de revogação.
- Após 200, encerrar a sessão local. `sessionsCount: 0` também é sucesso; não condicionar
  navegação ao valor ser truthy. Não apresentá-lo como contagem de dispositivos ativos,
  pois o backend pode contar sessões expiradas ainda não revogadas.
- Em falha de rede/servidor, manter diálogo com erro e retry. Em 401, revalidar perfil.

### Logout desktop/mobile

- Os dois menus usam o mesmo comportamento de `signOut`, com pendência e prevenção
  de chamadas duplicadas. Não basta navegar para login.
- Após 204, encerrar localmente. Em 401, revalidar perfil; se também inválido, finalizar
  saída sem exigir outra ação. Em 404, revalidar perfil antes de decidir saída.
- Falha de rede/5xx não gera mensagem de logout concluído: manter estado e oferecer retry.
- Corrigir composição dos triggers nos menus tocados para evitar botões interativos
  aninhados; manter acionamento por teclado e nomes acessíveis.

## 9. Exclusão de conta

- O botão da Danger zone abre `DeleteAccountDialog`, usando `AlertDialog` existente.
- Exibir consequência de exclusão permanente dos dados da conta na API e pedir
  confirmação digitando o email da conta. Comparar ao email exibido após trim;
  esse campo é apenas uma confirmação de UI, não parte da requisição.
- Oferecer cancelar e `Delete account`; desabilitar confirmação até o email coincidir.
  Enquanto pendente, impedir repetição e fechamento que oculte o andamento.
- Chamar `deleteUser()` sem argumentos. Após 204, executar encerramento local e
  mostrar confirmação na tela de login. Não chamar endpoints adicionais de exclusão.
- Em falha, manter diálogo e valores; 401 segue revalidação de perfil, sem reportar
  exclusão bem-sucedida quando somente a sessão expirou.
- Não afirmar que preferências locais ou mocks operacionais foram apagados: esta
  operação exclui a conta e dados persistidos na API, não os protótipos do frontend.

## 10. Erros, formulários e acessibilidade

- Cada submit aguarda `mutateAsync`; sucesso/toast/reset só ocorre após a resposta.
  Desabilitar botões enquanto pendentes e exibir rótulo de progresso além de spinner.
- Limpar erro da tentativa anterior ao reenviar. Preservar entradas em erro; não
  registrar senhas, tokens, arquivos ou payloads em console, URL ou armazenamento persistente.
- Checar `HTTPError` e estrutura de `data` antes de ler campos. O formato Zod contém
  detalhes diferentes do DTO genérico; não assumir que toda falha possui `message` string.
- Mapear erros esperados por operação/status para mensagens da UI. Associar detalhes
  de validação reconhecidos somente a campos conhecidos; detalhes desconhecidos recebem
  mensagem geral. Não exibir HTML, stack traces ou erros brutos de infraestrutura.
- Indisponibilidade de rede tem mensagem de conexão; 5xx tem mensagem de serviço e retry.
  Não criar interceptor global que converta todo 401 em logout.
- Mensagens de sucesso após navegação usam o toast existente disparado uma vez no
  handler de sucesso; não transportar credenciais ou depender de query flags para mostrar sucesso.
- Usar labels, `aria-invalid`, mensagens associadas aos campos e anúncios de sucesso/erro.
  Adotar `type="email"`, autocomplete apropriado e nomes para controles só com ícone.
- Manter foco e cancelamento nos diálogos, foco no primeiro campo inválido e leitura
  das mensagens por tecnologia assistiva. Validar desktop e viewport estreito de 320 px;
  substituir a largura fixa dos formulários por largura máxima com padding responsivo
  quando necessário, sem refazer o layout de autenticação.

## 11. Sequência de implementação e arquivos afetados

1. Registrar estado do repositório e baseline de TypeScript. Confirmar que os wrappers
   e contratos continuam compatíveis com a SPEC 01.
2. Criar os módulos compartilhados de Identity, corrigir a proteção do layout e
   sincronizar identidade entre sidebar, Settings e menu mobile.
3. Ajustar login/cadastro e remover controles OAuth. Integrar recuperação e criar
   página/rota de redefinição.
4. Migrar Account para perfil real; integrar edição, avatar e confirmação de exclusão.
5. Migrar Security para mutações/consultas reais e integrar revogações/logout.
6. Executar validação, revisar escopo e registrar limitações/falhas preexistentes.

Arquivos existentes previstos para alteração, além dos novos listados nas seções anteriores:

- `web/src/app/pages/auth/sign-in/index.tsx`, `sign-up/index.tsx` e `forgot-password/index.tsx`.
- `web/src/router.tsx`, apenas para incluir a rota pública de redefinição.
- `web/src/app/layouts/default/index.tsx` e seus componentes `app-sidebar.tsx`,
  `nav-user.tsx` e `mobile-nav-user.tsx`.
- `web/src/app/pages/settings/index.tsx`, `components/account-settings.tsx` e
  `components/security-settings.tsx`.
- Remoção de `web/src/app/pages/settings/model/profile-settings.ts` após migrar consumidores.

Não alterar os 15 wrappers, o cliente Ky, o QueryClient global, dependências ou
componentes das demais abas de Settings. Imports de componentes tocados podem ser
ajustados somente para a migração de Identity.

## 12. Validação e critérios de aceite

### Verificações estáticas

- Executar em `web/`: `pnpm run typecheck`,
  `pnpm exec tsc --noEmit -p tsconfig.app.json` e `pnpm run build`.
- O script padrão usa a configuração raiz com `files: []`; sua aprovação isolada
  não comprova que o código da aplicação foi validado.
- A revisão anterior identificou 10 erros de TypeScript preexistentes. Registrar
  baseline novamente na implementação: corrigir o acesso inseguro ao perfil, que
  pertence ao escopo, e não assumir que todos os erros anteriores devem permanecer.
- Executar Biome nos arquivos criados/alterados, sem reformatar outros módulos.
- Não adicionar framework de testes ou dependências nesta entrega. Validar os fluxos
  por navegador com respostas controladas/interceptadas quando disponível e revisão
  de payloads. Usar apenas contas e arquivos de teste em eventual validação real;
  não enviar emails nem executar exclusões em contas pessoais para testar.

### Cenários funcionais obrigatórios

| Cenário | Resultado esperado |
| --- | --- |
| Perfil demora a responder em acesso direto | Skeleton; nenhum redirecionamento ou acesso indefinido |
| Perfil responde 401 | Conteúdo protegido oculto, dados de Identity limpos, um redirecionamento |
| Perfil responde 5xx ou rede falha | Estado recuperável; sem logout falso |
| Cadastro sem nome, senha de 5/19 caracteres | Erros locais e nenhuma chamada |
| Cadastro com senha de 6/18 caracteres | Aceito pela validação local |
| Cadastro 201 com email contendo `+` | Login com email exato preenchido; nenhuma chamada de autenticação |
| Cadastro 409 | Erro de email; formulário preservado |
| Login pendente e clique repetido | Uma mutação de UI em andamento; botão desabilitado |
| Login de outra conta após saída | Nenhum perfil/sessão da conta anterior reaparece |
| Login/cadastro | Nenhum botão OAuth, callback ou solicitação a provider |
| Recuperação 201/404/502 | Confirmação apenas no sucesso; mensagens e retry adequados |
| Reset sem token ou UUID malformado | Link inválido; submit bloqueado |
| Reset válido, expirado, usado e inexistente | Sucesso ou estado de recuperação conforme resposta |
| Confirmação de senha diferente | Nenhuma chamada; erro na confirmação |
| Perfil com nome/cargo/avatar nulos | Inputs controlados, fallbacks corretos, sem `username` ou iniciais fixas |
| Limpar somente cargo | Payload com `jobTitle: null`, sem email, avatar ou nome não alterado |
| Refetch/avatar durante edição de nome | Rascunho não sobrescrito |
| Salvar perfil 204 seguido de falha no refetch | Sucesso da gravação preservado; aviso separado de atualização |
| Avatar com MIME inválido, vazio ou tamanho de 5.000.000 bytes | Bloqueio local com mensagem |
| Avatar aceito abaixo do limite, sucesso/falha | Multipart via wrapper; perfil atualizado ou arquivo preservado |
| Troca de senha | Apenas dois campos enviados; limpar no 204; sessão permanece |
| Sessões sem user-agent/IP ou com tipo desconhecido | Rótulos/ícones neutros, sem última atividade inventada |
| Sessões vazias/erro/refetch | Estado vazio ou recuperável sem mock substituto |
| Revogar sessão 204/404/401 | Atualização da lista ou revalidação adequada, sem logout indevido |
| Revogar todas, incluindo contagem zero | Confirmação explícita e saída após sucesso |
| Logout em desktop/mobile com 204 ou falha de rede | Mesma semântica; não declarar sucesso em falha |
| Exclusão com email divergente/cancelamento | Nenhuma requisição |
| Exclusão 204/erro | Encerramento ou diálogo preservado com erro |
| Navegação por teclado e viewport de 320 px | Campos, mensagens, menus e diálogos utilizáveis, sem overflow |

### Conclusão da implementação

- Todas as 13 operações não OAuth possuem consumidores funcionais e estados de UI.
- Nenhum dado de Identity permanece simulado nas superfícies migradas.
- Contratos da API, wrappers e demais áreas do produto permanecem intactos.
- Relatar verificações efetivamente executadas, erros preexistentes restantes e
  qualquer cenário que dependa de infraestrutura indisponível. Não declarar fluxo
  real de email/upload validado com base apenas em respostas simuladas.

## 13. Entrega desta consolidação

Esta task cria apenas `web/docs/specs/02-identity-frontend-integration.md`.
Implementação, alterações de componentes e integração real serão executadas em outra task.
