# Walkthrough — Fase 4: Cronograma, Gantt Nativo, CPM e Calendário

> [!NOTE]
> Este documento detalha a implementação completa, os testes e as validações visuais da **Fase 4** da plataforma **FluxoPro**, conforme especificado em [SPEC.md](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/SPEC.md) e [AGENTS.md](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/AGENTS.md).

---

## 1. Resumo das Entregas da Fase 4

### Pacote Compartilhado (`@fluxo/shared`)
- **[schemas/dependency.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/packages/shared/src/schemas/dependency.ts)**:
  - Definição do enum `DependencyType` (`FS`, `SS`, `FF`, `SF`).
  - Schemas Zod para criação, exclusão e listagem de dependências com `lagDays`.
- **[schemas/baseline.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/packages/shared/src/schemas/baseline.ts)**:
  - Schemas para linhas de base imutáveis (`ProjectBaselineDto`, `TaskBaselineItemDto`, `CreateBaselineRequest`).
- **[schemas/gantt.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/packages/shared/src/schemas/gantt.ts)**:
  - `GanttTaskItemSchema`, `GanttProjectDataSchema`, `GanttZoomLevel` (`DAY`, `WEEK`, `MONTH`, `QUARTER`), e schemas de reagendamento automático (`AutoRescheduleRequest`, `AutoRescheduleResult`).
- **[schemas/workload.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/packages/shared/src/schemas/workload.ts)**:
  - `MemberWorkloadSummaryDto`, `ProjectWorkloadSummaryDto` com limites de capacidade padrão (480 min/dia) e alertas de sobrealocação.
- **[utils/cycle-detector.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/packages/shared/src/utils/cycle-detector.ts)**:
  - Algoritmo DFS com coloração de nós em três estados para detecção estrita de ciclos no DAG de dependências, gerando a cadeia explicativa de nós no ciclo.
- **[utils/cpm.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/packages/shared/src/utils/cpm.ts)**:
  - Cálculo determinístico de CPM (Critical Path Method) com Passe Direto (Early Start/Finish), Passe Reverso (Late Start/Finish), Folga Total, Folga Livre e identificação de tarefas no Caminho Crítico (`totalFloat <= 0`).
- **[utils/date-math.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/packages/shared/src/utils/date-math.ts)**:
  - Funções de cálculo de datas puras: `addDays`, `diffDays`, `startOfDay`, `parseDate`, `toIsoDate`, `isWeekend`.

### Banco de Dados & Prisma
- **[prisma/schema.prisma](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/prisma/schema.prisma)**:
  - Modelos `ProjectBaseline` e `TaskBaselineItem` adicionados e relacionados com `Project` e `Task`.
  - Migration aplicada: `prisma/migrations/20261028140100_phase4_baselines/migration.sql`.
  - **Seed Atualizado ([prisma/seed.ts](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/prisma/seed.ts))**:
    - Tarefas `FLX-1` até `FLX-9` com datas sequenciais, durações e marcos (`FLX-9` marco final).
    - Cadeia de dependências sequenciais demonstrando caminho crítico (`FLX-1 -> FLX-2 -> FLX-3 -> FLX-5 -> FLX-6 -> FLX-7 -> FLX-9`).
    - Linha de base inicial persistida com sucesso.

### Backend (`apps/api`)
- **Dependências de Tarefas & Ciclos**:
  - `POST /api/v1/projects/:id/dependencies`: Cria dependência com validação de ciclo (HTTP 422 em caso de dependência cíclica).
  - `DELETE /api/v1/projects/:id/dependencies/:dependencyId`: Remove dependência.
  - `GET /api/v1/projects/:id/dependencies`: Lista todas as dependências com detalhes dos predecessores e sucessores.
- **Linhas de Base (Baselines)**:
  - `GET /api/v1/projects/:id/baselines`: Lista snapshots de linha de base.
  - `POST /api/v1/projects/:id/baselines`: Cria nova linha de base imutável capturando o estado de todas as tarefas.
  - `GET /api/v1/projects/:id/baselines/:baselineId`: Recupera detalhes e itens da baseline.
- **Gráfico Gantt & CPM**:
  - `GET /api/v1/projects/:id/gantt`: Retorna tarefas ordenadas, dependências, cálculo de CPM em tempo de execução, caminho crítico e comparação opcional contra baseline (`varianceDays`).
  - `POST /api/v1/projects/:id/auto-reschedule`: Motor de reagendamento topológico que cascateia deslocamentos de datas para sucessores.
- **Carga de Trabalho (Workload)**:
  - `GET /api/v1/projects/:id/workload`: Sumário de horas estimadas vs. capacidade diária dos membros do projeto, indicando sobrealocação.
- **OpenAPI**: Registro de todos os novos endpoints documentados em `apps/api/src/openapi/openapi.ts`.

### Frontend (`apps/web`)
- **Gráfico Gantt Nativo SVG/CSS ([TaskGanttView.tsx](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/apps/web/src/components/gantt/TaskGanttView.tsx))**:
  - Implementação nativa sem qualquer biblioteca externa comercial (conforme regra 8 do `AGENTS.md`).
  - Layout dividido com sincronização de scroll: tabela de tarefas à esquerda e grade temporal com cabeçalhos por dia/mês/semana à direita.
  - Camada SVG para renderização de setas de dependência curvas ortogonais entre os conectores das tarefas.
  - Alternância do destaque do Caminho Crítico (CPM) em vermelho com badge informativo de duração total.
  - Comparação com Linhas de Base projetando barras de planejamento sob as tarefas atuais e indicando variância em dias.
  - Controles de zoom: Dia, Semana, Mês e Trimestre.
  - Reagendamento automático em cascata com um clique.
- **Visão de Calendário ([TaskCalendarView.tsx](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/apps/web/src/components/calendar/TaskCalendarView.tsx))**:
  - Alternância entre visão mensal (grade 7x5/6) e semanal (colunas por dia).
  - Chips coloridos por status e ícone de diamante para marcos.
  - Destaque para o dia atual e indicação de tarefas atrasadas.
  - Clique direto no chip abre o drawer de detalhes da tarefa.
- **Carga de Trabalho da Equipe ([WorkloadView.tsx](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/apps/web/src/components/timeline/WorkloadView.tsx))**:
  - Cards de membros com foto/avatar, horas alocadas, capacidade no período, barras de progresso lineares com cores de advertência e lista de tarefas atribuídas.
  - Alerta de tarefas sem responsável atribuído.
- **Drawer de Detalhes da Tarefa ([TaskDetailDrawer.tsx](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/apps/web/src/components/tasks/TaskDetailDrawer.tsx))**:
  - Nova seção "Dependências de Tarefas" exibindo predecessores e sucessores com tipo de vínculo (`FS`, `SS`, `FF`, `SF`), `lagDays` e botão para desvincular.
- **Integração na Página do Projeto ([page.tsx](file:///home/talita/projetos-talita/gerencimamento_fluxo_projetos/apps/web/src/app/%5Blocale%5D/projects/%5BprojectId%5D/page.tsx))**:
  - Abas `Gantt`, `Calendário` e `Carga de Trabalho` totalmente ativas com sincronização no URL (`?view=gantt`, etc.).

---

## 2. Evidências de Testes e Validação Visual

### Testes Automatizados Unitários e de Componente
- Backend:
  - `apps/api/tests/dependencies-cycle.test.ts` (testes de criação, exclusão, bloqueio de ciclo 422 com caminho do ciclo)
  - `apps/api/tests/cpm-calculation.test.ts` (testes de forward/backward pass, total float e caminho crítico)
  - `apps/api/tests/baselines.test.ts` (testes de snapshot e comparação de variância)
- Frontend:
  - `apps/web/tests/TaskGanttView.test.tsx` (zoom, CPM toggle, baseline comparison, seleção de tarefa)
  - `apps/web/tests/TaskCalendarView.test.tsx` (alternância mês/semana, navegação de datas, abertura de detalhes)

### Screenshots Capturados

1. **Gráfico Gantt com Destaque de Caminho Crítico (CPM) e Linhas de Dependência SVG**:
   `docs/phases/fase-04/screenshots/phase4-gantt-cpm.png`

2. **Visão de Calendário (Mês e Semana)**:
   `docs/phases/fase-04/screenshots/phase4-calendar.png`

3. **Visão de Carga de Trabalho da Equipe (Workload)**:
   `docs/phases/fase-04/screenshots/phase4-workload.png`

4. **Drawer de Detalhes com Seção de Dependências Predecessoras e Sucessoras**:
   `docs/phases/fase-04/screenshots/phase4-dependencies-drawer.png`
