# Registro de Progresso — Cacique Agil

Este documento registra a evolução incremental do projeto **Cacique Agil**, consolidando o que foi entregue, o que permanece pendente no roadmap, as decisões arquiteturais tomadas, os comandos úteis do dia a dia e os problemas conhecidos/resolvidos.

---

## Artefatos das Fases (Salvos no Repositório)

- **Fase 02 — Projetos e Tarefas (Visão Lista)**:
  - [Implementation Plan (`docs/phases/fase-02/implementation_plan.md`)](./phases/fase-02/implementation_plan.md)
  - [Walkthrough & Validação (`docs/phases/fase-02/walkthrough.md`)](./phases/fase-02/walkthrough.md)
  - Screenshots de Validação E2E (`docs/phases/fase-02/screenshots/`):
    - [`phase2-projects-list.png`](./phases/fase-02/screenshots/phase2-projects-list.png)
    - [`phase2-tasks-list-view.png`](./phases/fase-02/screenshots/phase2-tasks-list-view.png)
    - [`phase2-task-detail-drawer.png`](./phases/fase-02/screenshots/phase2-task-detail-drawer.png)
    - [`phase2-filtered-saved-view.png`](./phases/fase-02/screenshots/phase2-filtered-saved-view.png)
- **Fase 03 — Quadro Kanban e Tempo Real**:
  - [Implementation Plan (`docs/phases/fase-03/implementation_plan.md`)](./phases/fase-03/implementation_plan.md)
  - [Walkthrough & Validação (`docs/phases/fase-03/walkthrough.md`)](./phases/fase-03/walkthrough.md)
  - Screenshots de Validação E2E (`docs/phases/fase-03/screenshots/`):
    - [`phase3-kanban-board.png`](./phases/fase-03/screenshots/phase3-kanban-board.png)
    - [`phase3-kanban-drawer.png`](./phases/fase-03/screenshots/phase3-kanban-drawer.png)
    - [`phase3-kanban-swimlanes.png`](./phases/fase-03/screenshots/phase3-kanban-swimlanes.png)
    - [`phase3-realtime-presence.png`](./phases/fase-03/screenshots/phase3-realtime-presence.png)
- **Fase 04 — Cronograma (Gantt), CPM, Dependências e Calendário**:
  - [Implementation Plan (`docs/phases/fase-04/implementation_plan.md`)](./phases/fase-04/implementation_plan.md)
  - [Walkthrough & Validação (`docs/phases/fase-04/walkthrough.md`)](./phases/fase-04/walkthrough.md)
  - Screenshots de Validação E2E (`docs/phases/fase-04/screenshots/`):
    - [`phase4-gantt-cpm.png`](./phases/fase-04/screenshots/phase4-gantt-cpm.png) (Gantt em Modo Claro com Caminho Crítico e Rótulos Nitídos)
    - [`phase4-gantt-dark.png`](./phases/fase-04/screenshots/phase4-gantt-dark.png) (Gantt em Modo Escuro de Alto Contraste)
    - [`phase4-gantt-quarter.png`](./phases/fase-04/screenshots/phase4-gantt-quarter.png) (Gantt na Escala de Trimestre com Divisórias e Meses Nítidos e sem Sobreposição)
    - [`phase4-gantt-table-collapsed.png`](./phases/fase-04/screenshots/phase4-gantt-table-collapsed.png) (Gantt Expandido com Tabela Lateral Oculta e Botão Flutuante de Restauração)
    - [`phase4-gantt-fullscreen.png`](./phases/fase-04/screenshots/phase4-gantt-fullscreen.png) (Gantt em Modo de Tela Cheia / Fullscreen)
    - [`phase4-gantt-exported.png`](./phases/fase-04/screenshots/phase4-gantt-exported.png) (Imagem PNG Exportada com Régua de Meses/Dias, Grade Completa e Setas)
    - [`phase4-home-light.png`](./phases/fase-04/screenshots/phase4-home-light.png) (Home & Cabeçalhos em Modo Claro)
    - [`phase4-home-dark.png`](./phases/fase-04/screenshots/phase4-home-dark.png) (Home & Cabeçalhos em Modo Escuro com Contraste Branco Puro)
    - [`phase4-calendar.png`](./phases/fase-04/screenshots/phase4-calendar.png)
    - [`phase4-workload.png`](./phases/fase-04/screenshots/phase4-workload.png)
    - [`phase4-dependencies-drawer.png`](./phases/fase-04/screenshots/phase4-dependencies-drawer.png)
- **Fase 05 — Documentos Colaborativos, TipTap + Yjs e Hierarquia Wiki**:
  - [Implementation Plan (`docs/phases/fase-05/implementation_plan.md`)](./phases/fase-05/implementation_plan.md)
  - [Walkthrough & Validação (`docs/phases/fase-05/walkthrough.md`)](./phases/fase-05/walkthrough.md)
  - Screenshots de Validação E2E (`docs/phases/fase-05/screenshots/`):
    - [`phase5-docs-tree.png`](./phases/fase-05/screenshots/phase5-docs-tree.png) (Árvore Wiki expansível, subpáginas, favoritos e busca textual)
    - [`phase5-doc-editor.png`](./phases/fase-05/screenshots/phase5-doc-editor.png) (Editor TipTap com toolbar, títulos e bloco vivo de tarefa FLX-1)
    - [`phase5-doc-templates.png`](./phases/fase-05/screenshots/phase5-doc-templates.png) (Galeria de modelos com Ata de Reunião, PRD e Retrospectiva)
    - [`phase5-doc-versions.png`](./phases/fase-05/screenshots/phase5-doc-versions.png) (Histórico de versões imutáveis e restauração 1-clique com backup)
    - [`phase5-doc-comments.png`](./phases/fase-05/screenshots/phase5-doc-comments.png) (Comentários inline com texto citado e badge de resolvido)
    - [`phase5-project-docs.png`](./phases/fase-05/screenshots/phase5-project-docs.png) (Aba Docs na visualização do projeto com documentos vinculados)
- **Architecture Decision Records (`docs/decisions/`)**:
  - [ADR 001 — Tokens de Autenticação e Hashing de Senhas](./decisions/001-auth-tokens-and-password-hashing.md)
  - [ADR 002 — Hierarquia de Subtarefas, Ordenação e Visões Salvas (Fase 2)](./decisions/002-phase2-tasks-hierarchy-and-saved-views.md)
  - [ADR 003 — Posicionamento Fracionário, Alertas WIP e Sincronização em Tempo Real (Fase 3)](./decisions/003-phase3-kanban-and-realtime.md)
  - [ADR 004 — Gráfico Gantt Nativo SVG/CSS, CPM, Detecção de Ciclos em DAG e Visão de Calendário (Fase 4)](./decisions/004-phase4-gantt-cpm-and-calendar.md)
  - [ADR 005 — Editor TipTap, Sincronização CRDT Yjs sobre Socket.IO e Hierarquia Wiki (Fase 5)](./decisions/005-phase5-tiptap-yjs-and-documents-hierarchy.md)

---

## 1. O que foi feito

### Fases Anteriores (Fases 0 e 1 — Concluídas)
- **Fase 0 (Fundação):** Monorepo `pnpm workspaces` (`@fluxo/shared`, `@fluxo/api`, `@fluxo/web`, `@fluxo/tsconfig`, `@fluxo/eslint-config`), Docker Compose de desenvolvimento e produção, schema Prisma inicial para todo o domínio, healthcheck (`/health` e `/ready`), OpenAPI (`/api/docs`) e layout base MUI v6 com tema claro/escuro e i18n (`pt-BR` / `en`).
- **Fase 1 (Autenticação, Workspaces e RBAC):** Registro, login, refresh token rotativo em cookie `httpOnly` com detecção de reuso, recuperação de senha via Mailpit, seletor de workspace ativo, convites por e-mail e controle de acesso por papel (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`) com isolamento multi-tenant.

### Fase 02 — Projetos e Tarefas (Visão Lista) (Concluída)
1. **Schemas Compartilhados (`packages/shared`)**:
   - `packages/shared/src/schemas/project.ts`: Schemas Zod e DTOs para projetos (`ProjectSchema`, `CreateProjectRequestSchema`, `UpdateProjectRequestSchema`), status de fluxo (`WorkflowStatusSchema`, `CreateWorkflowStatusRequestSchema`) e visões salvas (`SavedViewConfigSchema`, `SavedViewSchema`, `CreateSavedViewRequestSchema`).
   - `packages/shared/src/schemas/task.ts`: Schemas Zod e DTOs para tarefas (`TaskSchema`, `CreateTaskRequestSchema`, `UpdateTaskRequestSchema`, `MoveTaskRequestSchema`, `BulkTasksActionSchema`, `TaskFilterQuerySchema`), etiquetas (`LabelSchema`), checklists (`ChecklistSchema`, `ChecklistItemSchema`), comentários (`CommentSchema`, `CommentBodySchema`) e anexos (`AttachmentSchema`).
2. **Backend (`apps/api`)**:
   - **Módulo de Projetos (`src/modules/projects/`)**:
     - CRUD completo de projetos por workspace (`GET/POST /api/v1/workspaces/:workspaceId/projects`, `POST /api/v1/projects`, `GET/PATCH/DELETE /api/v1/projects/:id`).
     - Criação automática em transação dos 4 status padrão (`A Fazer`, `Em Andamento`, `Em Revisão`, `Concluído`) e endpoint de status customizados (`POST /api/v1/projects/:id/statuses`).
     - Gestão de etiquetas do workspace (`GET/POST /api/v1/workspaces/:workspaceId/labels`) e visões salvas do projeto (`GET/POST /api/v1/projects/:id/views`, `DELETE /api/v1/views/:viewId`).
   - **Módulo de Tarefas (`src/modules/tasks/`)**:
     - Listagem filtrada e buscável (`GET /api/v1/projects/:projectId/tasks`) por `statusId`, `priority`, `labelId`, `assigneeId`, `search`, `dueBefore`, `dueAfter` e `parentId`.
     - Criação com chave sequencial automática por projeto (`FLX-1`, `FLX-2`...), cálculo de `position` e atualização automática de `completedAt` ao entrar/sair de status `DONE`.
     - Subtarefas aninhadas com validação de até **3 níveis de profundidade** no backend (`422 Unprocessable Entity` ao exceder).
     - Operações em lote (`POST /api/v1/tasks/bulk`) para alterar status, prioridade ou excluir (*soft delete* via `deletedAt`).
     - Checklists e itens (`POST /api/v1/tasks/:id/checklists`, `DELETE /api/v1/checklists/:checklistId`, `POST /api/v1/checklists/:checklistId/items`, `PATCH/DELETE /api/v1/checklist-items/:itemId`).
     - Comentários com parser de `@menções` (`GET/POST /api/v1/tasks/:id/comments`, `DELETE /api/v1/comments/:commentId`) gerando notificações automáticas (`TASK_MENTIONED`, `TASK_ASSIGNED`).
     - Anexos validados por whitelist de MIME type e tamanho máximo de 10 MB (`POST /api/v1/tasks/:id/attachments`, `DELETE /api/v1/attachments/:attachmentId`).
   - **Documentação OpenAPI**: Todos os endpoints da Fase 02 documentados em `apps/api/src/openapi/openapi.ts` (`/api/docs`).
3. **Seed de Desenvolvimento (`prisma/seed.ts`)**:
   - Etiquetas (`Backend`, `Frontend`, `Segurança`, `UX & Design`), projetos `FLX — Lançamento v1` e `DSYS — Design System & Acessibilidade`, 4 tarefas (`FLX-1` a `FLX-4`) com subtarefa, checklist, comentário com `@carlos`, anexo PDF e visão salva compartilhada (`Tarefas Urgentes`).
4. **Frontend (`apps/web`)**:
   - Portfólio de Projetos (`/[locale]/projects`) com busca, filtro por status, progresso de conclusão e modal de criação/edição (`CreateProjectDialog.tsx`).
   - Visão Lista de Tarefas (`/[locale]/projects/[projectId]`) com agrupamento por Status ou Prioridade (`TaskListView.tsx`), criação rápida inline (`Enter`), edição inline de status/prioridade, seleção em lote e barra de ações em massa.
   - Barra de filtros combináveis (`TaskFiltersBar.tsx`) e chips de Visões Salvas (criar, aplicar e excluir).
   - Drawer lateral de detalhes (`TaskDetailDrawer.tsx`) com edição de título/descrição, metadados, etiquetas, árvore de subtarefas até 3 níveis, checklists com barra de progresso, anexos e comentários com `@menções`.
   - Atalhos globais de teclado (`C` nova tarefa, `/` focar busca, `Esc` fechar drawer/modal, `?` ajuda de atalhos em `KeyboardShortcutsDialog.tsx`).
   - Middleware de roteamento i18n (`apps/web/src/middleware.ts`) e redirecionamento raiz (`apps/web/src/app/page.tsx`) de `/` para `/pt-BR`.
5. **Testes Automatizados**:
   - Testes de integração da API (`apps/api/tests/projects-tasks.test.ts`).
   - Teste de componente React (`apps/web/tests/TaskListView.test.tsx`).
   - Teste E2E Playwright (`apps/web/e2e/phase2-projects-tasks.spec.ts`) cobrindo o fluxo completo `criar → editar → comentar → filtrar`.

### Fase 03 — Quadro Kanban e Tempo Real (Concluída)
1. **Schemas Compartilhados (`packages/shared`)**:
   - `packages/shared/src/schemas/project.ts`: Schemas Zod para atualização de status (`UpdateWorkflowStatusRequestSchema`) com limite WIP opcional e reordenação de colunas (`ReorderWorkflowStatusesRequestSchema`).
   - `packages/shared/src/schemas/realtime.ts`: Tipagem e validação dos eventos de Socket.IO (`task.created`, `task.updated`, `task.moved`, `task.deleted`, `status.created`, `status.updated`, `status.deleted`, `comment.created`, `presence.update`).
2. **Backend (`apps/api`)**:
   - **Servidor WebSocket (`apps/api/src/realtime/`)**:
     - Servidor Socket.IO acoplado ao HTTP nativo em `server.ts` (`socket.server.ts`).
     - Handshake autenticado via JWT de cookie ou header (`socket.auth.ts`).
     - Isolamento multi-tenant de salas por projeto (`project:{projectId}`) com verificação de membro do workspace e controle de presença online (`socket.rooms.ts`).
     - Singleton emissor tipado (`socket.emitter.ts`) disparando eventos no ciclo de vida das tarefas em `tasks.service.ts`.
   - **Endpoints de Status e WIP**:
     - `PATCH /api/v1/projects/:id/statuses/:statusId` para edição de nome, cor, categoria e `wipLimit`.
     - `DELETE /api/v1/projects/:id/statuses/:statusId` com bloqueio seguro se houver tarefas ativas na coluna.
     - `POST /api/v1/projects/:id/statuses/reorder` para reordenar colunas do Kanban.
     - OpenAPI devidamente atualizado.
3. **Frontend (`apps/web`)**:
   - **Quadro Kanban com `@dnd-kit` (`apps/web/src/components/kanban/`)**:
     - `TaskKanbanView.tsx`: Quadro interativo com drag overlay, sensores de ponteiro e teclado, e posicionamento fracionário (`position: Float`).
     - `KanbanColumn.tsx`: Coluna droppable mapeada para `WorkflowStatus`, contadores, badge e banner de aviso quando o limite WIP é ultrapassado, e criação rápida inline no rodapé.
     - `KanbanCard.tsx`: Cartão arrastável completo com chave, prioridade, etiquetas, progresso de checklist, contadores de anexos/comentários e avatares.
     - `ColumnSettingsDialog.tsx`: Diálogo para editar atributos e definir limites WIP da coluna.
     - **Swimlanes**: Raias horizontais dobráveis por Prioridade (`URGENT`, `HIGH`, `MEDIUM`, `LOW`) e por Responsável.
   - **Tempo Real e Presença**:
     - `lib/socket.ts` e hook `useProjectRealtime` com reconexão automática e invalidação cirúrgica de queries React Query.
     - `PresenceBar.tsx`: Barra de presença online com indicador de conexão verde e stack de avatares com tooltips.
     - Aba Kanban habilitada na página do projeto com sincronização por URL `?view=kanban`.
4. **Seed de Demonstração (`prisma/seed.ts`)**:
   - Status `Em Revisão` configurado com `wipLimit: 2` e 8 tarefas distribuídas para demonstrar o alerta visual de WIP excedido (3/2) e swimlanes.
5. **Testes Automatizados**:
   - `apps/api/tests/kanban-status.test.ts` (CRUD de status, reordenação e WIP).
   - `apps/api/tests/socket-realtime.test.ts` (Handshake JWT, entrada em salas de projeto e presença).
   - `apps/web/tests/TaskKanbanView.test.tsx` (Renderização de colunas, alerta WIP e diálogo de configurações).
   - `apps/web/e2e/phase3-kanban-realtime.spec.ts` (E2E multi-contexto validando Kanban, abertura do drawer, swimlanes e sincronização de presença em tempo real).

---


### Fase 04 — Cronograma (Gantt), CPM, Dependências e Calendário (Concluída)
1. **Schemas Compartilhados (`packages/shared`)**:
   - `schemas/dependency.ts`: Enum `DependencyType` (`FS`, `SS`, `FF`, `SF`) e schemas Zod para criação, listagem e remoção de vínculos com `lagDays`.
   - `schemas/baseline.ts`: Schemas Zod para linhas de base imutáveis (`ProjectBaselineDto`, `TaskBaselineItemDto`, `CreateBaselineRequest`).
   - `schemas/gantt.ts`: Schemas Zod para dados completos do Gantt (`GanttProjectDataDto`, `GanttTaskItemDto`, `GanttZoomLevel`) e motor de reagendamento automático (`AutoRescheduleRequest`, `AutoRescheduleResult`).
   - `schemas/workload.ts`: Schemas Zod para sumário de carga de trabalho e capacidade da equipe (`ProjectWorkloadSummaryDto`, `MemberWorkloadSummaryDto`).
   - **Algoritmos Puros**:
     - `utils/cycle-detector.ts`: Algoritmo DFS com coloração de vértices para detecção estrita de ciclos no DAG de dependências com cadeia descritiva.
     - `utils/cpm.ts`: Algoritmo determinístico de CPM (Critical Path Method) com Passe Direto, Passe Reverso, cálculo de folga total/livre e identificação do caminho crítico.
     - `utils/date-math.ts`: Matemática de datas em TypeScript estrito (`addDays`, `diffDays`, `startOfDay`, `parseDate`, `toIsoDate`, `isWeekend`).
2. **Banco de Dados & Prisma**:
   - Modelos `ProjectBaseline` e `TaskBaselineItem` adicionados em `prisma/schema.prisma` e vinculados a `Project` e `Task`.
   - Migration aplicada: `prisma/migrations/20261028140100_phase4_baselines/migration.sql`.
   - Seed `prisma/seed.ts` atualizado com tarefas `FLX-1` até `FLX-9`, dependências sequenciais com folgas, marcos (`FLX-9`) e snapshot de baseline inicial.
3. **Backend (`apps/api`)**:
   - **Módulo de Tarefas & Dependências (`apps/api/src/modules/tasks/`)**:
     - `POST /api/v1/projects/:id/dependencies`: Cria dependência com validação de ciclo (HTTP 422 Unprocessable Entity com cadeia de nós em caso de ciclo).
     - `DELETE /api/v1/projects/:id/dependencies/:dependencyId`: Remove vínculo de dependência.
     - `GET /api/v1/projects/:id/dependencies`: Lista todas as dependências com metadados de predecessor e sucessor.
   - **Módulo de Linhas de Base (`apps/api/src/modules/tasks/`)**:
     - `GET /api/v1/projects/:id/baselines`: Lista snapshots de linha de base.
     - `POST /api/v1/projects/:id/baselines`: Cria snapshot imutável das tarefas do projeto.
     - `GET /api/v1/projects/:id/baselines/:baselineId`: Detalhes e itens do snapshot.
   - **Módulo de Projetos (`apps/api/src/modules/projects/`)**:
     - `GET /api/v1/projects/:id/gantt`: Dados de tarefas, dependências, cálculo de CPM em tempo de execução e comparação com baseline (`varianceDays`).
     - `POST /api/v1/projects/:id/auto-reschedule`: Reagendamento em cascata topológico respeitando tipos de precedência e `lagDays`.
     - `GET /api/v1/projects/:id/workload`: Sumário de horas estimadas vs. capacidade diária dos membros com detecção de sobrealocação.
   - **Documentação OpenAPI**: Todos os novos endpoints devidamente documentados em `apps/api/src/openapi/openapi.ts`.
4. **Frontend (`apps/web`)**:
   - **Gráfico Gantt Nativo SVG/CSS (`apps/web/src/components/gantt/`)**:
     - Sem bibliotecas externas comerciais pagas.
     - Painéis sincronizados de tabela e linha do tempo com zoom (Dia, Semana, Mês, Trimestre).
     - **Escala de Tempo e Calendário Inteligentes (Sem Sobreposição)**:
       - No modo **Trimestre**, a régua superior agrupa os Trimestres (`T1`, `T2`, `T3`, `T4` com ano) e a inferior exibe os Meses completos (`Janeiro`, `Fevereiro`...) com divisórias limpas no início de cada mês e linhas sutis para semanas, sem sobreposição de dias diários ou caracteres colados.
       - No modo **Mês**, a régua superior exibe o Mês e a inferior agrupa as Semanas (`01 - 07 Out`, `08 - 14 Out`...), espaçando a grade uniformemente.
       - Nos modos **Dia** e **Semana**, a régua e a grade diária mantêm divisórias confortáveis de 24px a 40px com destaque para fins de semana.
     - **Tabela Lateral Flexível, Colapsável e Modo Tela Cheia**:
       - Opção para **ocultar a tabela lateral esquerda** pelo botão "Ocultar Tabela" / "Exibir Tabela" na barra de ferramentas ou pelo botão recolher (`ChevronLeftIcon`) no cabeçalho da tabela, liberando 100% da largura útil da tela para a linha do tempo do Gantt.
       - Alça flutuante com botão (`ChevronRightIcon`) na margem esquerda da linha do tempo quando a tabela estiver recolhida para rápida restauração.
       - **Modo Tela Cheia (Fullscreen)** com alternador na barra de ferramentas e suporte a saída rápida pela tecla `Escape`.
       - Tabela de tarefas com colunas flexíveis (`ID`: 75px, `Tarefa`: `flex: 1` dinâmico, `Duração`: 60px, `%`: 50px).
     - Conectores de dependência com curvas ortogonais SVG e marcadores de seta.
     - Alternância de Caminho Crítico (CPM) em vermelho com duração total calculada.
     - Projeção comparativa de linhas de base com variância em dias.
     - Botão para reagendamento automático em cascata.
     - **Aprimoramento de Contraste e Tipografia**: Rótulos com cores sólidas (`#ffffff` e drop shadow) sobre barras coloridas no Modo Claro e Escuro, e projeção de rótulo lateral em `text.primary` para barras estreitas (`< 120px`) e marcos (`isMilestone`), garantindo 100% de legibilidade em ambos os modos de tema.
   - **Tema Claro / Escuro Unificado & Tipografia**:
     - Configuração estrita de `MuiTypography: { defaultProps: { color: 'text.primary' } }` e `MuiCssBaseline` para evitar herança de fontes pretas ou apagadas no Modo Escuro.
     - Cabeçalho de boas-vindas ("Bem-vindo"), títulos de cartões e itens do menu com contraste branco puro (`#F8FAFC`) no modo escuro e preto grafite (`#0F172A`) no modo claro.
   - **Visão de Calendário (`apps/web/src/components/calendar/TaskCalendarView.tsx`)**:
     - Modos Mês e Semana com chips coloridos por status e ícones de marco.
     - Abertura de detalhes da tarefa ao clicar no chip.
   - **Carga de Trabalho da Equipe (`apps/web/src/components/timeline/WorkloadView.tsx`)**:
     - Medidores de capacidade e alertas de sobrealocação por membro da equipe.
   - **Drawer de Detalhes da Tarefa (`apps/web/src/components/tasks/TaskDetailDrawer.tsx`)**:
     - Seção de dependências com listagem de predecessores/sucessores e exclusão de vínculos.
   - **Página do Projeto (`apps/web/src/app/[locale]/projects/[projectId]/page.tsx`)**:
     - Abas Gantt, Calendário e Carga de Trabalho integradas com persistência via query string `?view=`.
5. **Testes Automatizados**:
   - Backend: `dependencies-cycle.test.ts` (5 testes), `cpm-calculation.test.ts` (3 testes), `baselines.test.ts` (1 teste).
   - Frontend: `TaskGanttView.test.tsx` (5 testes), `TaskCalendarView.test.tsx` (4 testes).
   - E2E Playwright: `phase4-gantt-calendar.spec.ts` (Gantt, CPM, Zoom, Dependências, Linha de Base, Calendário Mês/Semana, Carga de Trabalho e Drawer).

### Fase 05 — Documentos Colaborativos, TipTap + Yjs e Hierarquia Wiki (Concluída)
1. **Schemas Compartilhados (`packages/shared`)**:
   - `schemas/document.ts`: Schemas Zod e DTOs para `Document`, `DocumentTreeNode`, `DocumentVersion`, `DocumentComment`, `PredefinedTemplate` e `DocumentExportFormat`.
2. **Banco de Dados & Prisma**:
   - Model `Document` estendido com `isTemplate`, `templateCategory`, `createdById`.
   - Novos models: `DocumentVersion` (snapshots imutáveis e restauráveis) e `DocumentFavorite` (favoritos por usuário).
   - Model `Comment` com relação direta com `Document` (`docId`), suporte a `selectedText`, `resolvedAt` e `resolvedById`.
   - Migration `20261028193000_phase5_documents` gerada e aplicada com sucesso.
   - Seed `prisma/seed.ts` com PRD raiz, subpágina de Design, Ata de Reunião, favorito, snapshot de versão, comentário inline e 3 modelos estruturados.
3. **Backend (`apps/api`)**:
   - **Módulo de Documentos (`src/modules/documents/`)**:
     - Árvore Wiki recursiva com ordenação, prevenção estrita de ciclos e busca.
     - Alternância de favoritos por usuário (`POST /api/v1/documents/:id/favorite`).
     - Snapshots de versão manuais e restauração 1-clique com backup de segurança (`POST /api/v1/documents/:id/versions/:versionId/restore`).
     - Comentários inline em documentos com citação de texto e marcação de resolvido/reaberto.
     - Exportação nativa em Markdown (`.md`), HTML e JSON.
   - **Sincronização em Tempo Real CRDT (`src/realtime/`)**:
     - `yjs.service.ts` gerenciando `Y.Doc` sobre canais Socket.IO com autenticação JWT e persistência debounced no Postgres (2s).
   - **Documentação OpenAPI**: Todos os endpoints documentados e validados.
4. **Frontend (`apps/web`)**:
   - **Editor TipTap Rico e Colaborativo (`apps/web/src/components/docs/`)**:
     - Barra de ferramentas (`DocToolbar`), menu flutuante (`DocBubbleMenu`), barra de presença e sincronização (`DocCollaborationBar`).
     - Extensão customizada `CalloutExtension` (info, success, warning, danger).
     - Extensão customizada `EmbeddedTaskExtension` renderizando chips vivos de tarefas (`FLX-1`) com status interativo.
     - Provedor Socket.IO `YjsSocketProvider` com awareness de cursores e presença.
   - **Árvore Hierárquica Wiki (`DocTreeSidebar` & `DocTreeNode`)**:
     - Subpáginas em múltiplos níveis, favoritos no topo e filtro em tempo real.
   - **Gavetas & Modais**:
     - `DocVersionHistoryDrawer`: histórico e restauração.
     - `DocInlineCommentsPane`: comentários com trecho selecionado.
     - `DocTemplatesDialog`: galeria de templates prontos (PRD, Ata, Retrospectiva).
     - `DocExportDialog`: exportação Markdown, JSON e PDF via regras `@media print`.
   - **Integração no Projeto**:
     - Aba "Docs" em `projects/[projectId]/page.tsx` permitindo gerenciar documentos associados.
5. **Testes Automatizados & E2E**:
   - Backend: `apps/api/tests/documents.test.ts` (4 testes de criação, árvore, favoritos e exportação).
   - Frontend: `DocTreeSidebar.test.tsx` (6 testes) e `DocTemplatesDialog.test.tsx` (3 testes).
   - E2E Playwright: `phase5-documents.spec.ts` (Fluxo completo: Wiki tree -> TipTap -> Bloco de Tarefa -> Templates -> Versões -> Comentários -> Aba Docs no Projeto) passando com 6 screenshots gerados.

---

## 2. O que ficou pendente (Próximas Fases do Roadmap)

- **Fase 06 — Quadros Brancos (Canvas):**
  - Canvas HTML5/SVG com pan/zoom, formas, post-its, conectores, texto livre e conversão de post-it em tarefa.
- **Fase 07 — Metas (OKRs), Relatórios e Controle de Tempo:**
  - Objetivos (`Goal`) e resultados-chave (`KeyResult`) vinculados a tarefas, dashboards com `@mui/x-charts`, registro de horas (`TimeEntry`) com cronômetro e exportação CSV.
- **Fase 08 — Polimento, Notificações, Busca Global (`Ctrl+K`), Acessibilidade e CI:**
  - Central de notificações no topo (badge + marcar como lida), Command Palette (`Ctrl+K`) unificado, webhooks de saída com assinatura HMAC e revisão final WCAG 2.1 AA.

---

## 3. Decisões Tomadas nas Fases

1. **Validação estrita de profundidade de subtarefas no servidor (`ADR 002`)**: A regra de até 3 níveis de subtarefas vive exclusivamente no serviço de backend (`tasks.service.ts`), enquanto o frontend reflete a restrição na UX (ocultando o botão de adicionar subtarefa no nível 3).
2. **Soft Delete de tarefas (`deletedAt`)**: Exclusões individuais (`DELETE /api/v1/tasks/:id`) e em lote (`POST /api/v1/tasks/bulk`) preenchem `deletedAt` em vez de remover fisicamente o registro, preservando integridade de auditoria e histórico.
3. **Build prévio de `@fluxo/shared` em `typecheck` e `test`**: Como `@fluxo/shared` exporta tipos compilados em `dist/index.d.ts` (não versionados no Git), os scripts `pnpm typecheck` e `pnpm test` na raiz e o workflow `.github/workflows/ci.yml` executam `pnpm --filter @fluxo/shared build` antes da checagem de tipos e testes.
4. **Roteamento i18n explícito (`localePrefix: 'always'`) com Middleware**: Adicionado `apps/web/src/middleware.ts` e `apps/web/src/app/page.tsx` para redirecionar `/` automaticamente para `/pt-BR` sem quebrar rotas prefixadas (`/${locale}/...`).
5. **Renomeação do projeto para `Cacique Agil`**: Substituído o nome provisório `FluxoPro` por `Cacique Agil` nos dicionários `pt-BR`/`en`, títulos HTML, OpenAPI, templates de e-mail, seed e documentação.

6. **Gráfico Gantt Nativo sem Bibliotecas Pagas (`ADR 004`)**: Arquitetura em SVG + CSS com conectores de arestas ortogonais Bézier e marcadores de seta nativos, sem bibliotecas pagas de terceiros.
7. **Detecção de Ciclos no DAG com HTTP 422 (`ADR 004`)**: Validação DFS de arestas no backend que bloqueia qualquer ciclo em grafo direcionado e retorna a rota cíclica detalhada para a UX.
8. **Motor de Reagendamento em Cascata e CPM Determinístico (`ADR 004`)**: Implementação em `@fluxo/shared` com ordenação topológica e passes direto/reverso para recalcular datas e destacar o caminho crítico.

9. **Sincronização Yjs sobre Socket.IO com JWT (`ADR 005`)**: Aproveitamento da infraestrutura Socket.IO já existente para transmitir deltas binários Yjs e Awareness sem dependência de servidores proprietários adicionais.
10. **Prevenção de Ciclos em Árvore Wiki (`ADR 005`)**: Verificação hierárquica no backend para impedir que uma página seja movida para si mesma ou para qualquer um de seus descendentes.
11. **Restauração Segura de Versões com Backup Automático (`ADR 005`)**: Toda restauração salva automaticamente uma versão de segurança do estado atual antes de aplicar o snapshot anterior.

---

## 4. Comandos Úteis

```bash
# Subir toda a stack em background com Docker Compose (Postgres, Mailpit, API, Web)
pnpm docker:up

# Aplicar migrations e popular o banco com dados de demonstração (Seed Fase 1 + Fase 2)
pnpm db:migrate
pnpm db:seed

# Rodar seed diretamente dentro do container da API (quando o banco roda no Docker)
docker exec fluxopro-api-dev npx tsx prisma/seed.ts

# Executar lint em todos os pacotes do monorepo
pnpm lint

# Compilar @fluxo/shared e validar TypeScript estrito (strict: true) em todos os pacotes
pnpm typecheck

# Executar testes unitários, de integração (API) e de componentes (Web)
pnpm test

# Executar suíte E2E Playwright (requer stack rodando em localhost:3000 e localhost:4000)
pnpm test:e2e

# Compilar todos os pacotes e aplicações para produção
pnpm build
```

### URLs e Credenciais Locais
- **Web App:** `http://localhost:3000` (redireciona para `http://localhost:3000/pt-BR`)
- **API REST:** `http://localhost:4000/api/v1`
- **Swagger / OpenAPI:** `http://localhost:4000/api/docs`
- **Mailpit (E-mails):** `http://localhost:8025`
- **Owner (Seed):** `admin@fluxopro.local` / `Senha@123`
- **Member (Seed):** `membro@fluxopro.local` / `Senha@123`
- **Guest (Seed):** `convidado@fluxopro.local` / `Senha@123`

---

## 5. Problemas Conhecidos e Soluções Aplicadas

### Fase 02
1. **Falha de `Typecheck` no GitHub Actions (`TS2307: Cannot find module '@fluxo/shared'`)**:
   - *Causa:* No runner limpo do CI, `packages/shared/dist` ainda não existia no momento do `pnpm typecheck`, e `apps/web/tsconfig.tsbuildinfo` estava versionado com cache local.
   - *Solução:* Adicionado `pnpm --filter @fluxo/shared build` no script `typecheck`/`test` do `package.json` raiz e em `.github/workflows/ci.yml`, além de adicionar `*.tsbuildinfo` ao `.gitignore`.
2. **Instâncias de `ZodError` entre pacotes do monorepo**:
   - *Causa:* Schemas compilados em `@fluxo/shared` podiam lançar `ZodError` de instância distinta da importada em `apps/api/src/middleware/error-handler.ts`.
   - *Solução:* O middleware `errorHandler` passou a validar `err instanceof ZodError || (err && err.name === 'ZodError')`, garantindo status `422` consistente.
3. **Erro `404` ao acessar `http://localhost:3000/` sem prefixo de idioma**:
   - *Causa:* Ausência de `src/middleware.ts` do `next-intl` para redirecionar `/` para `/pt-BR`.
   - *Solução:* Criados `apps/web/src/middleware.ts` e `apps/web/src/app/page.tsx` com `localePrefix: 'always'`.
4. **Aviso de Hydration no `<body>` causado por extensões do navegador (`cz-shortcut-listen="true"`)**:
   - *Causa:* Extensões como ColorZilla injetam atributos diretamente na tag `<body>` antes da hidratação do React 19.
   - *Solução:* Adicionado `suppressHydrationWarning` também na tag `<body suppressHydrationWarning>` em `apps/web/src/app/[locale]/layout.tsx`.
5. **Bibliotecas compartilhadas ausentes para o Chromium Headless do Playwright no host Linux**:
   - *Observação:* Em sistemas Linux sem `libnspr4.so`, `libnss3.so` e `libasound.so.2` instaladas globalmente, o `playwright.config.ts` inclui `/tmp/pw-libs` no `LD_LIBRARY_PATH` para permitir execução local do Chromium sem exigir `sudo apt-get`.

### Fase 03
1. **Bloqueio de purge de `node_modules` no pnpm sem TTY (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`)**:
   - *Causa:* Ao adicionar novas dependências via pnpm em ambientes não interativos (como containers Docker com volumes montados ou shells automatizados), o pnpm solicitava confirmação para purgar diretórios de módulos.
   - *Solução:* Adicionada a instrução `confirmModulesPurge=false` no arquivo `.npmrc` da raiz e `CI: 'true'` nos ambientes de execução.
2. **Geração do cliente Prisma no Dockerfile de produção/desenvolvimento (`docker/api.Dockerfile`)**:
   - *Causa:* O comando `pnpm prisma generate` tentava resolver dependências na raiz do monorepo e falhava quando executado sem a flag de schema explícita no container da API.
   - *Solução:* Ajustado para `RUN npx prisma generate --schema=prisma/schema.prisma`.
3. **Colisão de localizadores no modo estrito do Playwright (`strict mode violation`)**:
   - *Causa:* O seletor `getByText(/Em Revisão/)` capturava tanto o cabeçalho da coluna quanto os títulos e status das tarefas na coluna.
   - *Solução:* Refinado para `getByRole('heading', { name: 'Em Revisão' })` e texto exato `getByText('Limite WIP excedido (3/2)')`.
