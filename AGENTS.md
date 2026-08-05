# Contexto do projeto

Este projeto é uma aplicação de produtividade pessoal. Nesta fase, o foco está em compreender as necessidades dos usuários, definir as páginas e estruturar a experiência visual do frontend antes da implementação efetiva da API e da persistência em banco de dados.

O frontend é desenvolvido em React com dados estáticos e mocks. As decisões atuais devem favorecer a exploração e a validação dos fluxos, sem antecipar regras de negócio que ainda não foram definidas.

## Conceitos centrais

A aplicação coordena três recursos relacionados, mas independentes:

- **Tasks (tarefas):** objetivos ou demandas isoladas que precisam ser concluídos. Podem representar desde uma atividade curta até um trabalho com duração de várias semanas e geralmente possuem uma data de entrega ou validade. Mesmo quando extensa, uma Task continua sendo uma unidade de trabalho; não presumir uma estrutura de projeto ou subtarefas sem uma decisão futura.
- **Plans (planos):** blocos de tempo que representam a intenção de trabalhar em algo, ajudando a planejar o dia, a semana ou o mês. A principal referência visual é a experiência de calendário do Microsoft Teams. Um Plan pode existir sozinho ou apontar opcionalmente para uma Task.
- **Work Logs (registros de trabalho):** registros do que realmente foi realizado em determinado período. Servem como histórico consultável e, futuramente, como fonte para relatórios e planilhas de horas. Um Work Log pode existir sozinho ou apontar opcionalmente para uma Task.

A distinção de domínio deve permanecer explícita:

- Task define **o que precisa ser alcançado**.
- Plan define **quando se pretende trabalhar**.
- Work Log registra **o que de fato foi feito**.

Nenhum dos três módulos deve depender dos outros para ser útil. As integrações são opcionais e devem enriquecer a experiência sem tornar um fluxo isolado incompleto.

## Áreas da aplicação

- **Operacional:** escopo atual, com cadastros, edições, exclusões, consultas e visualizações de Tasks, Plans e Work Logs.
- **Administrativa:** escopo futuro, destinado a dashboards, relatórios e exportações. Não é prioridade nesta fase.

## Estado atual

- O frontend fica em `web/` e usa React, TypeScript, Vite, Tailwind CSS e componentes shadcn/ui.
- A navegação operacional já apresenta Tasks, Plans e Work Logs.
- A página de Plans é a área mais desenvolvida: possui calendário com visualizações de dia, semana, mês e agenda, dados mockados e operações locais de criação, edição e exclusão.
- A relação opcional entre Plan e Task já aparece no modelo visual por meio de `taskId` anulável.
- A página de Tasks ainda é um placeholder, e Work Logs ainda não possui uma rota/tela implementada.
- A API e o domínio de backend ainda estão em estágio inicial e não devem conduzir prematuramente o design do frontend.

## Diretrizes para a evolução

- Priorizar clareza operacional e leitura rápida, especialmente nas visualizações de tempo.
- Manter visualmente clara a diferença entre planejamento e trabalho realizado.
- Projetar primeiro os fluxos e estados das páginas com dados estáticos; integrar API e banco quando os conceitos estiverem mais maduros.
- Preservar a possibilidade de usar somente Tasks, somente Plans ou somente Work Logs.
- Evitar adicionar dashboards, relatórios complexos ou regras rígidas de integração antes que entrem explicitamente no escopo.
- Tratar este documento como contexto inicial, não como uma especificação fechada. Atualizá-lo à medida que o domínio e o produto ganharem definições reais.
