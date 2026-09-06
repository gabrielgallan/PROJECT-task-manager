# SPEC 07 — Integração da lista mobile de Tasks com a API

Status: planejada.
Data: 2026-09-05.

## 1. Objetivo

Integrar o protótipo `TasksMobileList` ao fluxo real de Tasks para que a view de lista
em telas menores que 768 px use os dados paginados da API, preserve os filtros da
página e permita alterar status por swipe. O sheet inferior deve abrir os mesmos
fluxos de detalhes, edição e exclusão já usados pela tabela desktop.

Esta entrega futura deve substituir apenas o estado demonstrativo do protótipo. Ela
não redesenha a página de Tasks, não cria outro modelo de Task e não duplica regras
que já existem na feature.

Task continua sendo uma unidade de resultado. O swipe altera somente seu status; ele
não cria Plan, Work Log, subtarefa, projeto ou qualquer vínculo obrigatório.

## 2. Escopo

Incluído:

- Remoção dos mocks e da coleção mutável local de `tasks-mobile-list.tsx`.
- Consumo do resultado paginado de `useTasksQuery`, já orquestrado pela página.
- Uso dos filtros aplicados e da paginação existentes, com ordenação mobile fixa.
- Integração do swipe com `useEditTaskStatus` e `edit-task-status.ts`.
- Feedback por toast para sucesso e falha da alteração de status.
- Integração do sheet inferior com detalhes, edição e exclusão reais.
- Reuso do empty state, loading, erro e bloqueio por Task já existentes.
- Acessibilidade por teclado, foco, gesto reduzido e prevenção de ações duplicadas.
- Verificação responsiva em temas claro e escuro.

Fora do escopo:

- Alterações em `api/`, contratos HTTP, banco de dados ou regras do backend.
- Alterações em Plans, Work Logs, Categories, Dashboard ou Reports.
- Novas operações mobile além de detalhes, edição, exclusão e swipe de status.
- Inclusão de Plan, Log work ou seletor completo de status no sheet mobile.
- Ordenação controlada, cabeçalhos de tabela ou escolha de coluna no mobile.
- Mudanças funcionais na tabela desktop, board ou timeline.
- Novas dependências, nova primitiva de gesto ou alteração genérica no shadcn/ui.
- Atualização otimista inventada apenas para o mobile.

Todos os arquivos alterados pela implementação devem permanecer em `web/`.

## 3. Base existente e lacunas

O frontend de Tasks já possui a integração HTTP estabelecida pela SPEC 04:

- `useTasksPage` mantém view, filtros, sort e página na URL e orquestra as queries.
- `useTasksQuery` executa `fetchTasks` com React Query e converte `TaskDto` em `Task`.
- `useEditTaskStatus` executa a mutation, aplica o lock por Task e reconcilia as
  listas e detalhes no cache.
- `edit-task-status.ts` envia `PATCH api/tasks/:taskId/status`.
- `TasksList` recebe resultado e callbacks por props e não conhece o transporte HTTP.
- `TaskDetailsSheet`, `TaskDialog` e `DeleteTaskDialog` já implementam os fluxos
  reais acionados pela tabela desktop.

O protótipo mobile ainda diverge desse fluxo:

| Situação atual | Resultado exigido |
| --- | --- |
| `MOBILE_TASKS_MOCK` fornece cinco Tasks fixas | Renderizar `result.tasks` retornadas pela query paginada |
| `TaskDto` e `toTask` existem apenas para montar o mock | Remover ambos do componente mobile |
| `useState<Task[]>` funciona como uma segunda fonte de verdade | Não manter cópia mutável; os dados vêm exclusivamente das props |
| Swipe altera o array local e sempre mostra sucesso | Aguardar a mutation real e diferenciar sucesso de falha |
| Paginação usa `page=1`, `total=110` e callback vazio | Usar metadados reais e `setPage` da página |
| Lista vazia renderiza somente um `<ul>` vazio | Reusar `TasksEmptyState` com saídas adequadas |
| Sheet apenas fecha seus botões | Disparar detalhes, edição e exclusão reais |
| Item bloqueia somente durante a animação de retorno | Bloquear também enquanto qualquer escrita da mesma Task estiver pendente |

## 4. Decisões de produto mobile

### 4.1. Breakpoint e coexistência com desktop

Manter `useIsMobile` e o breakpoint já adotado pelo projeto:

- largura menor que 768 px: `TasksMobileList`;
- largura a partir de 768 px: `TasksList` desktop.

Somente uma das duas representações da view `list` deve estar montada por vez. Board
e timeline continuam com o comportamento atual. Trocar o viewport não altera dados,
filtros ou página; apenas troca sua representação.

### 4.2. Densidade e informações apresentadas

Cada item mobile continua mostrando somente:

- ícone e nome acessível do status atual;
- título em uma linha, truncado quando necessário;
- prioridade;
- vencimento relativo ou `No due date`.

Descrição, datas completas, atividade, Plans e Work Logs pertencem ao fluxo de
detalhes. A redução de campos é intencional para leitura rápida em tela pequena.

### 4.3. Ordenação

O mobile não oferece controles de ordenação. Sua chamada paginada deve usar sempre:

- `sortBy: 'dueDate'`;
- `sortDir: 'asc'`.

Uma ordenação explícita e determinística evita que itens mudem de página entre
requisições. Parâmetros de sort já presentes na URL podem permanecer preservados
para quando a tabela desktop voltar a ser exibida, mas não afetam a requisição da
lista mobile. Filtros e página continuam compartilhados entre os dois layouts.

## 5. Fluxo de dados e responsabilidades

```text
URL (view, filtros, página)
        |
        v
useTasksPage + useTasksQuery
        |
        +--> TasksList (desktop)
        |
        +--> TasksMobileList (mobile)
                 |
                 +--> swipe ------> changeStatus
                 |                     |
                 |                     v
                 |              useEditTaskStatus
                 |                     |
                 |                     v
                 |        PATCH /api/tasks/:id/status
                 |                     |
                 |                     v
                 |          reconciliação React Query
                 |
                 +--> actions sheet --> callbacks da página
                                        |
                                        +--> detalhes
                                        +--> edição
                                        +--> exclusão
```

Responsabilidades normativas:

| Camada | Responsabilidade |
| --- | --- |
| `edit-task-status.ts` | Transporte tipado do PATCH; sem toast, cache ou estado visual |
| `use-task-mutations.ts` | Mutation, validação do ID, sessão, lock e reconciliação de cache |
| `use-tasks-page.ts` | Query da página, callbacks, seleção de diálogos e feedback da ação |
| `TasksMobileList` | Renderização, seleção temporária do item, paginação e composição do gesto |
| `SwipeableTaskItem` | Movimento horizontal, limiar, alternativa de teclado e estado visual local |
| `TaskMobileActionsSheet` | Apresentar e encaminhar as três ações permitidas |
| `TasksPage` | Escolher layout responsivo e conectar os callbacks aos fluxos existentes |

`TasksMobileList` e `TaskMobileActionsSheet` não importam funções de `web/src/api`,
não instanciam mutations e não escrevem diretamente no cache. A página fornece dados
e callbacks, como já ocorre em `TasksList`.

## 6. Consulta, filtros e paginação

### 6.1. Request da lista

Em view `list`, `useTasksPage` continua executando uma única query paginada com:

- `search`, quando o filtro aplicado não estiver vazio;
- `status`, quando houver ao menos um status aplicado;
- `priority`, quando houver ao menos uma prioridade aplicada;
- `page` lida da URL;
- `limit: TASKS_PAGE_SIZE`;
- sort fixo mobile ou sort controlado desktop, conforme a seção 4.3.

Não criar um `useTasksMobileQuery`, uma query duplicada ou um fetch dentro do
componente. A composição do request pode considerar `isMobile`, mas deve continuar
passando por `normalizeTaskRequest`, `taskKeys.list` e `fetchTasks`.

O cache key deve refletir o request efetivo. Ao mudar de mobile para desktop, ou o
inverso, React Query pode usar/refazer a entrada apropriada sem misturar resultados
com ordenações diferentes.

### 6.2. Props da lista mobile

`TasksMobileList` deve receber, no mínimo:

- `result: ITaskQueryResult`;
- informação suficiente para distinguir lista vazia filtrada de base vazia;
- `onPageChange`;
- `onClearFilters`;
- `onNewTask`;
- `onStatusChange`;
- `onDetails`;
- `onEdit`;
- `onDelete`.

É aceitável receber `query` e usar `hasActiveTaskFilters`, repetindo o contrato da
lista desktop, ou receber o booleano `filtered` já derivado pela página. Não duplicar
a regra de detecção de filtros dentro do componente.

### 6.3. Paginação

`Pagination` recebe:

- `page: result.page`;
- `total: result.total`;
- `limit: TASKS_PAGE_SIZE`;
- `onPageChange` conectado a `setPage`.

Alterar página atualiza a URL e, por consequência, a query. A correção já existente
para uma página maior que o novo `pageCount` deve continuar funcionando após filtrar,
editar status ou excluir uma Task.

A paginação permanece visível para uma lista não vazia. Não renderizar números
demonstrativos, calcular total pelo tamanho da página ou paginar novamente no cliente.

### 6.4. Loading, erro, vazio e revalidação

Preservar a orquestração da página:

- primeira carga sem dados: mostrar o status de loading existente;
- erro de leitura: mostrar o Alert existente e `Try again`;
- dados anteriores durante refetch: manter a lista disponível;
- zero resultados com filtros: `TasksEmptyState` oferece `Clear filters`;
- zero resultados sem filtros: `TasksEmptyState` oferece `New task`.

Falha de listagem não pode ser interpretada como lista vazia. O componente mobile
não cria fallback com mock nem mantém a página anterior em estado local próprio.

## 7. Alteração de status por swipe

### 7.1. Mapeamento do gesto

Manter o protótipo com transições de um passo:

| Status atual | Swipe para a esquerda | Swipe para a direita |
| --- | --- | --- |
| `BACKLOG` | Sem ação | `IN_PROGRESS` (`Start`) |
| `IN_PROGRESS` | `BACKLOG` (`Move to backlog`) | `DONE` (`Mark as done`) |
| `DONE` | `IN_PROGRESS` (`Reopen`) | Sem ação |

Os destinos devem ser resolvidos contra `TASK_TRANSITIONS`; o mapa do gesto não
redefine labels, ícones nem permissões. Um sentido sem destino válido não dispara
callback, mesmo que o usuário force deslocamento além do limiar.

Manter os parâmetros atuais do protótipo, salvo ajuste comprovadamente necessário
durante a validação visual:

- limiar de confirmação: 52 px;
- deslocamento útil máximo: 96 px;
- sem momentum;
- elasticidade baixa;
- `touch-action: pan-y` para preservar o scroll vertical.

O painel revelado usa a cor e o ícone do status de destino. A cor nunca é o único
meio acessível de identificar a ação: o fallback por teclado possui nome completo.

### 7.2. Ciclo assíncrono

Ao terminar o drag:

1. Determinar direção, destino válido e alcance do limiar.
2. Animar o item de volta a `x = 0`.
3. Se não houver ação válida, terminar sem mutation ou toast.
4. Se houver, chamar e aguardar `onStatusChange(task, targetStatus)`.
5. Manter novas ações da Task bloqueadas até a mutation/reconciliação terminar.

Não alterar `task.status` em estado local. O item continua refletindo o dado do cache;
após sucesso, `reconcileTasks` invalida as listas e detalhes e a nova resposta passa
a ser a fonte do status. Em falha, a representação anterior já permanece correta,
sem rollback manual.

`useTaskPending(task.id)` deve participar do estado `disabled` do item, juntamente
com a animação de retorno. Isso impede swipe, tap, ação acessível, edição e exclusão
concorrentes enquanto a Task estiver sob lock. O próprio lock da mutation continua
sendo a defesa final contra corridas.

Um drag não pode abrir o sheet ao gerar o click sintético final. A guarda que separa
tap de drag deve permanecer válida até esse click ser descartado. Um tap sem drag
abre o sheet normalmente.

### 7.3. Call HTTP e validação

Todo swipe confirmado usa o mesmo caminho dos outros controles de status:

```text
changeStatus(task, status)
  -> taskStatusFormSchema.safeParse({ status })
  -> useEditTaskStatus().mutateAsync({ taskId: task.id, status })
  -> editTaskStatus(...)
  -> PATCH api/tasks/:taskId/status
```

Request JSON:

```json
{
  "status": "IN_PROGRESS"
}
```

Resposta esperada: `204 No Content`. Não chamar `.json()`, não repetir a requisição
automaticamente e não chamar `editTaskStatus` diretamente do componente.

Status igual ao atual é no-op. Um valor que falhe no schema não chega à API.

### 7.4. Feedback

Cada tentativa efetivamente enviada deve produzir um único feedback:

- sucesso: `“{title}” moved to {statusLabel}`;
- falha: `toast.error(getTaskError(error, 'status'))`.

O status de destino usa `TASK_STATUS_LABEL`. Não mostrar sucesso antes do `204` nem
mostrar simultaneamente toast e Alert para a mesma falha. Como `changeStatus` é o
controller compartilhado, o feedback deve ficar consistente para status iniciado
por mobile, tabela ou board.

`TaskActionBlockedError` não representa uma nova falha HTTP e não gera toast; o item
deve estar desabilitado antes desse caso. Mudança/encerramento de sessão também não
deve produzir feedback atrasado na sessão seguinte.

## 8. Sheet inferior de ações

### 8.1. Estado e seleção

Um tap no item abre `TaskMobileActionsSheet` com a Task selecionada. Essa seleção é
estado efêmero de interface, não uma coleção nem uma cópia editável dos dados. É
permitido guardar um snapshot da Task selecionada para que a animação de fechamento
do sheet sobreviva a refetch ou mudança de página.

O sheet mantém `side="bottom"`, título da Task, descrição curta e três ações nesta
ordem:

1. `Details`;
2. `Edit`;
3. `Delete`.

Não incluir transições de status, Plan ou Log work. O swipe é o atalho mobile de
status e a interface reduzida é uma decisão explícita de escopo.

### 8.2. Reuso dos fluxos existentes

Cada botão apenas fecha o sheet de ações e encaminha a Task para o callback recebido:

| Ação mobile | Callback | Fluxo reutilizado |
| --- | --- | --- |
| Details | `onDetails(task)` | `setDetailedTask` e `TaskDetailsSheet` com query de detalhes |
| Edit | `onEdit(task)` | `setEditingTask` e `TaskDialog` com mutation de edição |
| Delete | `onDelete(task)` | `setDeletingTask` e `DeleteTaskDialog` com confirmação e mutation |

Não reimplementar fetch de detalhes, formulário ou exclusão dentro do sheet. Os
efeitos de sucesso e falha continuam pertencendo aos componentes/controllers reais.

Fechar por gesto, backdrop ou Escape não executa ação. Ao escolher uma ação, fechar
o sheet de ações antes de apresentar o próximo overlay, evitando dois layers ativos.

### 8.3. Pending e semântica

Repetir a semântica do `TaskActionsMenu` desktop:

- `Details` permanece disponível para leitura;
- `Edit` e `Delete` ficam desabilitados enquanto `useTaskPending(task.id)` for true;
- `Delete` mantém variante destrutiva;
- os três controles mantêm altura mínima de 44 px e nome acessível;
- foco inicial, trap de foco, restauração e Escape continuam delegados à primitiva
  `Sheet` existente.

O sheet não mostra sucesso próprio. Excluir, editar e carregar detalhes preservam
suas mensagens e estados já implementados.

## 9. Acessibilidade, movimento e comportamento tátil

- O item acionável deve continuar sendo um `button` dentro de um `li`.
- Expor `aria-haspopup="dialog"` e `aria-expanded` somente para o item selecionado.
- Manter texto acessível do status atual, além do ícone visual.
- Cada destino de swipe disponível deve ter um botão alternativo alcançável por
  teclado, com label no formato `{action.label}: {task.title}`.
- A alternativa de teclado chama exatamente o mesmo callback assíncrono do gesto.
- Estados pending/settling devem usar `disabled` real, não apenas classes visuais.
- O foco visível não pode ser cortado pelo container com `overflow-hidden`.
- `useReducedMotion` reduz a animação de retorno a duração zero, sem remover a ação.
- O gesto horizontal não pode bloquear scroll vertical da página.
- Toasts e overlays devem conservar o comportamento acessível das primitivas atuais.
- Confirmar contraste dos painéis revelados nos temas claro e escuro; ícone e fundo
  não podem depender de um tom de baixo contraste para indicar o destino.

## 10. Arquivos e mudanças permitidas

Mudanças funcionais esperadas:

| Arquivo | Mudança |
| --- | --- |
| `web/src/app/pages/registers/tasks/index.tsx` | Passar resultado, query/página e callbacks reais à lista mobile; fornecer contexto responsivo à query se necessário |
| `web/src/app/pages/registers/tasks/hooks/use-tasks-page.ts` | Montar sort fixo mobile e padronizar feedback de sucesso/falha da mutation de status |
| `web/src/app/pages/registers/tasks/components/list/tasks-mobile-list.tsx` | Remover mock/estado local, consumir props, integrar paginação, empty state, pending e callback assíncrono |
| `web/src/app/pages/registers/tasks/components/list/task-mobile-actions-sheet.tsx` | Receber callbacks reais, encaminhar Details/Edit/Delete e respeitar pending |

Arquivos existentes a reutilizar, sem mudança esperada de contrato:

- `web/src/api/fetch-tasks.ts`;
- `web/src/api/edit-task-status.ts`;
- `web/src/features/tasks/hooks/use-tasks-query.ts`;
- `web/src/features/tasks/hooks/use-task-mutations.ts`;
- `web/src/features/tasks/hooks/use-task-pending.ts`;
- `web/src/features/tasks/model/task-cache.ts`;
- `web/src/features/tasks/model/task-transitions.ts`;
- `web/src/app/pages/registers/tasks/components/list/tasks-empty-state.tsx`;
- `web/src/app/pages/registers/tasks/components/details/task-details-sheet.tsx`;
- `web/src/app/pages/registers/tasks/components/task-dialog.tsx`;
- `web/src/app/pages/registers/tasks/components/delete-task-dialog.tsx`.

Se um ajuste nesses arquivos se mostrar indispensável, ele deve ser mínimo, manter o
contrato já usado pelo desktop e continuar restrito a `web/`. Não alterar primitivas
genéricas para acomodar regra específica do mobile.

## 11. Critérios de aceite

### 11.1. Dados e consulta

- [ ] Em viewport menor que 768 px, a view `list` mostra somente Tasks retornadas
      pela API para a página e filtros aplicados.
- [ ] Não existem `MOBILE_TASKS_MOCK`, `TaskDto`, `toTask` ou `useState<Task[]>` no
      componente mobile.
- [ ] Aplicar/limpar busca, status ou prioridade refaz a query e atualiza a lista.
- [ ] A lista mobile envia `dueDate asc` e não apresenta controle de ordenação.
- [ ] Próxima, anterior, primeira e última página usam metadados reais e atualizam a
      URL; nenhum total demonstrativo permanece.
- [ ] Lista vazia filtrada e base vazia oferecem ações diferentes e funcionais.
- [ ] Loading e falha de leitura não são mascarados por mocks ou empty state.

### 11.2. Swipe e mutation

- [ ] Cada status expõe somente os sentidos e destinos definidos na seção 7.1.
- [ ] Deslocamento menor que 52 px retorna o item sem request ou toast.
- [ ] Sentido sem ação válida não dispara request.
- [ ] Swipe válido envia exatamente um PATCH pelo fluxo `useEditTaskStatus`.
- [ ] Sucesso mostra um toast e o status final vem da reconciliação do React Query.
- [ ] Falha mostra um toast de erro, mantém o status anterior e libera o item.
- [ ] A mesma Task não aceita swipe, edit ou delete concorrente enquanto pending.
- [ ] Arrastar nunca abre acidentalmente o sheet de ações.
- [ ] Scroll vertical continua utilizável ao iniciar um gesto sobre um item.
- [ ] O fallback por teclado oferece as mesmas mudanças de status.
- [ ] Reduced motion elimina a transição, mas preserva o resultado da ação.

### 11.3. Sheet e operações existentes

- [ ] Tap sem drag abre um sheet inferior com título e somente Details, Edit e Delete.
- [ ] Details abre o `TaskDetailsSheet` real e sua query de detalhes.
- [ ] Edit abre o `TaskDialog` real com a Task selecionada.
- [ ] Delete abre o `DeleteTaskDialog` real e exige confirmação.
- [ ] Cancelar ou fechar o sheet de ações não executa operação.
- [ ] Edit e Delete respeitam o pending por Task; Details permanece disponível.
- [ ] O sheet de ações fecha antes do overlay de destino e o foco não fica preso.
- [ ] Edição, exclusão e status bem-sucedidos aparecem na lista mobile após a
      reconciliação, sem recarregar manualmente a página.

### 11.4. Regressão e escopo

- [ ] A tabela desktop mantém sort controlado e todas as ações existentes.
- [ ] Board e timeline continuam funcionais e não passam a depender do layout mobile.
- [ ] Nenhum arquivo fora de `web/` é alterado.
- [ ] Nenhuma dependência nova é adicionada.
- [ ] Não existe chamada HTTP diretamente nos componentes de apresentação.
- [ ] Não existe segunda fonte de verdade para Tasks.
- [ ] `pnpm run typecheck` e `pnpm run build` passam em `web/`.

## 12. Verificação da implementação futura

Executar em `web/`:

```powershell
pnpm run typecheck
pnpm run build
```

Realizar também validação manual com dados reais da API:

1. Testar larguras de 320, 375 e 767 px, além da transição para 768 px.
2. Conferir listas vazia, curta e com mais de uma página.
3. Combinar busca, múltiplos status e múltiplas prioridades.
4. Exercitar os quatro destinos de swipe descritos na matriz.
5. Simular sucesso, erro de rede, `400`, `401`, `404` e erro `5xx` de status.
6. Tentar repetir o gesto rapidamente na mesma Task e agir em outra Task.
7. Abrir Details, Edit e Delete pelo sheet e concluir/cancelar cada fluxo.
8. Navegar somente por teclado e validar foco após fechar cada overlay.
9. Ativar preferência de movimento reduzido.
10. Conferir temas claro e escuro, títulos longos, Task sem due date e todas as
    prioridades/status.

Esta SPEC não autoriza implementação nesta etapa. O plano de execução será criado
separadamente.
