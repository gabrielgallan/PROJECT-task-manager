# Validação — Enums e filtros de Tasks

Data: 2026-09-03.

## Escopo entregue

- Status internos: `BACKLOG`, `IN_PROGRESS`, `DONE`.
- Prioridades internas: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Labels, cores, ícones e regras de negócio preservados nos consumidores de Tasks.
- Leitura e escrita puras em `src/features/tasks/model/task-query-params.ts`, utilizadas por `useTaskQuery`.
- Filtros multivalorados em parâmetros repetidos e ordenação em `sortBy`/`sortDir`.
- Dados continuam nos mocks e stores locais; nenhuma call HTTP de Tasks foi criada.

## Verificação funcional

Executada com Chromium headless, usando Vite local e scripts temporários fora do repositório, sem novas dependências ou infraestrutura de testes. As respostas de perfil e Categories foram simuladas no navegador para isolar a validação do frontend. Nenhuma escrita foi enviada ao backend.

| Grupo | Resultado observado |
| --- | --- |
| Contrato de URL | Valores uppercase reconhecidos, deduplicados e ordenados pelo domínio; vírgulas, minúsculas e tokens desconhecidos ignorados. |
| Serialização | Uma ocorrência por seleção; parâmetros externos, inclusive repetidos, preservados; objeto original não é mutado; `sort` legado removido na próxima escrita. |
| Ordenação | Dez combinações válidas de campo/direção verificadas; pares incompletos ou inválidos retornam a `dueDate/asc`; padrão omitido da URL. |
| Consulta local | OR dentro das dimensões, AND entre dimensões e busca; pesquisa por título/descrição; ordenação por ciclo de vida e urgência; tarefas sem prazo continuam no final. |
| Filtros na interface | Rascunhos não alteram a URL antes de Search/Enter; aplicar reinicia a página; recarga restaura seleções, ordenação e resultados; leitura não reescreve URLs antigas. |
| Navegação | Paginação limpa tokens antigos; troca de visualização preserva filtros; limpar filtros preserva ordenação e visualização; escritas de Tasks usam substituição do histórico. |
| Transições | Start, Mark as done e Reopen atualizam o store e os indicadores na tabela; permissões de Plan/Log work preservadas. |
| Kanban | Drag de `BACKLOG` para `IN_PROGRESS` refletido na tabela; drag de `DONE` para `BACKLOG` recusado; contagens, ordem e limite da prévia de concluídas preservados. |
| Apresentação | Badges, detalhes, formulário, colunas e legenda do Gantt continuam usando labels legíveis; grupos e barras renderizam; toolbar e opções verificadas em 390 × 844. |
| Consumidores | Dashboard mantém o cálculo de atraso e seus indicadores; Kanban demonstrativo da autenticação renderiza os três status. |
| Rede e execução | Nenhuma requisição a `/api/tasks` e nenhum erro de execução não capturado nos fluxos validados. |

## Checagens estáticas

| Comando | Resultado |
| --- | --- |
| `pnpm --dir web run typecheck` | Passou. |
| `pnpm --dir web run build` | Passou; permanece o aviso de bundle acima de 500 kB. |
| Biome `check` nos 19 arquivos TypeScript alterados/adicionados | Passou. |
| `git diff --check` | Passou. |
| `pnpm --dir web exec tsc --noEmit -p tsconfig.app.json` | Mesmos nove diagnósticos da linha de base; nenhum novo. |

O comando `typecheck` usa o tsconfig raiz com referências e não substitui a checagem direta do projeto React. Os diagnósticos preexistentes continuam fora do escopo:

- `product-showcase.tsx`: seis erros envolvendo os tipos genéricos do Kanban.
- `task-board-card.tsx`: variável `_DueIcon` não utilizada.
- `tasks-board.tsx`: prop `onStatusChange` ausente no `TaskBoardCard`; o menu de transições do card mantém essa limitação preexistente.
- `radial-metric-card.tsx`: prop `description` não utilizada.

A verificação não cobre persistência de Tasks nem integração HTTP, que continuam fora desta refatoração. O formulário conserva o comportamento do protótipo; a validação aqui cobre seus valores e labels, sem ampliar o CRUD.
