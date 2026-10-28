# ADR 004: Gráfico Gantt Nativo SVG/CSS, CPM, Detecção de Ciclos em DAG e Visão de Calendário (Fase 4)

- **Status:** Aceito
- **Data:** 2026-10-28

## Contexto

Na Fase 4 do FluxoPro (`SPEC.md` Seções 4.4, 5.4 e `AGENTS.md` regra 8):
1. O cronograma do projeto deve suportar visão Gantt interativa sem dependências externas pagas (ex.: dhtmlx, bryntum, syncfusion).
2. O sistema deve gerenciar dependências entre tarefas dos tipos `FS` (Término-Início), `SS` (Início-Início), `FF` (Término-Término) e `SF` (Início-Término), com suporte a `lagDays` positivo (latência) ou negativo (antecipação).
3. Deve ser impossível criar ciclos de dependência (ex.: A -> B -> C -> A), retornando `422 Unprocessable Entity` com o caminho cíclico completo.
4. O Caminho Crítico (CPM - Critical Path Method) deve ser computado com passes direto e reverso para calcular Early/Late Start e Finish, folga total e folga livre, destacando tarefas críticas.
5. Um motor de reagendamento em cascata (Auto-reschedule) deve recalcular datas de sucessores mantendo as restrições de precedência e dias de latência.
6. Linhas de base (Baselines) devem capturar snapshots imutáveis do projeto e permitir comparação visual ("planejado vs. real") exibindo a variância em dias.
7. O sistema deve calcular a carga de trabalho diária da equipe (Workload) baseada na capacidade padrão (480 minutos/dia = 8h), alertando sobrealocação.
8. Visão de Calendário mensal e semanal integrando chips de tarefas, prazos e marcos.

## Decisões

1. **Arquitetura Gantt Nativa em SVG e CSS (Zero Bibliotecas Pagas)**:
   - Layout dividido em dois painéis sincronizados via `scrollLeft` e `scrollTop`:
     - Painel esquerdo: tabela de tarefas com numeração, chave, título, status e folga.
     - Painel direito: grade temporal por zoom (Dia, Semana, Mês, Trimestre), barras de tarefas em CSS com barra de progresso interna, losangos SVG para marcos (`isMilestone`) e camada SVG absoluta contendo conectores Bézier ortogonais com marcadores de seta (`<marker id="arrowhead">`).
   - Drag and drop nativo para movimentação e redimensionamento de datas de início e fim com persistência imediata.
2. **Detecção de Ciclos no Grafo Direcionado de Tarefas (DAG)**:
   - Implementado algoritmo de Busca em Profundidade (DFS) com coloração de vértices (Branco/Cinza/Preto) em `packages/shared/src/utils/cycle-detector.ts`.
   - Antes de persistir qualquer dependência no banco, o serviço valida a inclusão da aresta candidata. Caso forme ciclo, interrompe com código `422 Unprocessable Entity`, retornando a cadeia explicativa de IDs/chaves (ex.: `FLX-1 -> FLX-2 -> FLX-3 -> FLX-1`).
3. **Cálculo Determinístico de CPM (`calculateCPM`)**:
   - Algoritmo puro implementado em `packages/shared/src/utils/cpm.ts`:
     - **Passe Direto (Forward Pass)**: calcula `Early Start (ES)` e `Early Finish (EF)` a partir das dependências e durações.
     - **Passe Reverso (Backward Pass)**: calcula `Late Finish (LF)` e `Late Start (LS)` a partir da data máxima de término do projeto.
     - **Folgas**: `Total Float = LS - ES = LF - EF`.
     - **Caminho Crítico**: tarefas onde `totalFloat <= 0` compõem a rota crítica e recebem destaque vermelho na interface.
4. **Motor de Reagendamento em Cascata (`autoReschedule`)**:
   - Ordenação topológica das tarefas para propagar o ajuste sequencialmente.
   - Para cada tipo de dependência (`FS`, `SS`, `FF`, `SF`), calcula a nova data mínima permitida considerando `lagDays` e ajusta as datas `startDate` e `dueDate` dos sucessores afetados.
5. **Linhas de Base Imutáveis (`ProjectBaseline` e `TaskBaselineItem`)**:
   - Modelo Prisma relacional registrando nome, descrição e a foto instantânea de todas as tarefas (`startDate`, `dueDate`, `progress`, `statusCategory`) no momento da criação.
   - No Gantt, a seleção de uma linha de base projeta barras secundárias tracejadas em cinza abaixo da barra atual, calculando a variância `varianceDays = dueDateReal - dueDateBaseline`.
6. **Carga de Trabalho da Equipe (Workload)**:
   - Computação agregada no backend dividindo os minutos estimados (`estimateMinutes`) pelo total de dias úteis da tarefa.
   - Comparação contra capacidade diária padrão de 480 min/dia. Indicador visual alerta membros com utilização > 100%.
7. **Visão de Calendário**:
   - Modos Mês e Semana com navegação contínua, realce do dia de hoje (`today`), chips com cores de status e suporte a marcos com ícone de diamante.
