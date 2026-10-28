# Implementation Plan — Fase 2: Projetos e Tarefas (Visão Lista)

Este plano descreve a arquitetura, estrutura de pastas, dependências, scripts, modelo de dados Prisma, rotas da API e componentes de interface para a **Fase 2 (Projetos e Tarefas — Visão Lista)** do **FluxoPro**, em conformidade com a [`SPEC.md`](file:///home/talita/projetos/cacique-agil/SPEC.md) (seções 4, 5, 6.2, 7, 8, 9, 11 e 13) e as regras do [`AGENTS.md`](file:///home/talita/projetos/cacique-agil/AGENTS.md).

---

## 1. Diagnóstico do Repositório Atual (Fases 0 e 1)

O repositório já possui a fundação da **Fase 0** e toda a camada de **Identidade, Workspaces e RBAC da Fase 1** implementadas e validadas:
- **Monorepo (`pnpm workspaces`)**: `@fluxo/shared`, `@fluxo/api`, `@fluxo/web`, `@fluxo/tsconfig`, `@fluxo/eslint-config`.
- **Banco & ORM ([`prisma/schema.prisma`](file:///home/talita/projetos/cacique-agil/prisma/schema.prisma))**: Todas as tabelas de domínio da especificação já estão modeladas no schema e migradas, incluindo `Project`, `WorkflowStatus`, `Task`, `TaskDependency`, `Label`, `TaskLabel`, `Checklist`, `ChecklistItem`, `Comment`, `Attachment`, `TimeEntry` e `SavedView`.
- **Backend (`@fluxo/api`)**: Express + TypeScript estrito, autenticação JWT + Refresh Token rotativo em cookie `httpOnly`, middleware `requireWorkspaceRole` (RBAC: `OWNER`, `ADMIN`, `MEMBER`, `GUEST`) e documentação OpenAPI 3.0 gerada via Zod em `/api/docs`.
- **Frontend (`@fluxo/web`)**: Next.js 15 (App Router), MUI v6 com tema claro/escuro, `next-intl` (`pt-BR` e `en`), TanStack Query, Zustand e páginas de autenticação e configurações de workspace.

---

## 2. Escopo da Fase 2 (Projetos e Tarefas — Visão Lista)

### 2.1 Backend (`@fluxo/api`) & Schemas Compartilhados (`@fluxo/shared`)

Seguindo estritamente as camadas **`routes → controller → service → repository`** (sem acesso ao Prisma nos controllers) e validação com **Zod + OpenAPI**:

1. **Módulo de Projetos (`apps/api/src/modules/projects`)**:
   - `GET /api/v1/workspaces/:workspaceId/projects` (e `GET /api/v1/projects?workspaceId=`): Lista projetos ativos (`deletedAt: null`) do workspace com contagem de tarefas e status configurados.
   - `POST /api/v1/workspaces/:workspaceId/projects` (e `POST /api/v1/projects`): Cria projeto com chave em maiúsculas (`key`, ex.: `FLX`), valida unicidade `(workspaceId, key)` e cria em transação os 3 `WorkflowStatus` iniciais padrão (`A Fazer` / `TODO`, `Em Andamento` / `IN_PROGRESS`, `Concluído` / `DONE`). Requer papel `OWNER`, `ADMIN` ou `MEMBER`.
   - `GET /api/v1/projects/:id`: Detalhes do projeto, lista de `statuses` ordenados por `position` e métricas resumidas.
   - `PATCH /api/v1/projects/:id`: Atualiza nome, descrição, status (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`), cor e datas.
   - `DELETE /api/v1/projects/:id`: Exclusão lógica (`deletedAt = now()`) do projeto e de suas tarefas.
   - `GET /api/v1/projects/:id/statuses` e `POST /api/v1/projects/:id/statuses`: Listagem e criação de status de fluxo (colunas/etapas) do projeto.

2. **Módulo de Tarefas (`apps/api/src/modules/tasks`)**:
   - `GET /api/v1/projects/:projectId/tasks`: Lista tarefas do projeto (`deletedAt: null`) com suporte a filtros combinados e busca:
     - `search` (busca case-insensitive por título ou número/chave ex.: `FLX-12`),
     - `statusId`, `priority`, `assigneeId`, `labelId`, `parentId`, `isMilestone`,
     - ordenação (`position`, `dueDate`, `priority`, `number`, `createdAt`).
     - Retorna relacionamentos essenciais para a Visão Lista: `status`, `labels`, contagem/progresso de `checklists`, `_count` de `comments`, `attachments` e `subtasks`.
   - `POST /api/v1/projects/:projectId/tasks`: Cria tarefa com numeração sequencial automática por projeto (`number = max(number) + 1`), cálculo de `position` fracionária no final da coluna/status e validação de hierarquia de subtarefas (máximo de **3 níveis** conforme seção 6.2 da spec).
   - `GET /api/v1/tasks/:id`: Retorna detalhes completos da tarefa para o Drawer lateral (descrição rica JSON, `status`, `labels`, `subtasks`, `checklists` com itens ordenados, `comments` com dados do autor, `attachments` e `timeEntries`).
   - `PATCH /api/v1/tasks/:id`: Atualização parcial (inline ou via drawer) de título, descrição rica, `statusId`, `priority`, `assigneeIds`, `startDate`, `dueDate`, `estimateMinutes`, `progress` (`0-100`), `isMilestone`, `parentId` (validando limite de 3 níveis e prevenção de auto-parentesco).
   - `POST /api/v1/tasks/:id/move`: Move tarefa de `statusId` e/ou `position` fracionária.
   - `POST /api/v1/tasks/bulk`: Ações em massa sobre `taskIds[]` pertencentes ao mesmo workspace (`statusId`, `priority`, `assigneeIds`, `delete` lógico).
   - `DELETE /api/v1/tasks/:id`: Exclusão lógica (`deletedAt = now()`).

3. **Sub-recursos de Tarefas, Etiquetas e Visões Salvas**:
   - **Etiquetas (`labels`)**:
     - `GET /api/v1/workspaces/:workspaceId/labels` e `POST /api/v1/workspaces/:workspaceId/labels`
     - `DELETE /api/v1/labels/:labelId`
     - `POST /api/v1/tasks/:id/labels` (vincular etiqueta) e `DELETE /api/v1/tasks/:id/labels/:labelId` (desvincular).
   - **Checklists (`checklists`)**:
     - `POST /api/v1/tasks/:id/checklists` e `DELETE /api/v1/checklists/:checklistId`
     - `POST /api/v1/checklists/:checklistId/items`, `PATCH /api/v1/checklist-items/:itemId` (`text`, `done`, `position`) e `DELETE /api/v1/checklist-items/:itemId`.
   - **Comentários (`comments`)**:
     - `GET /api/v1/tasks/:id/comments`, `POST /api/v1/tasks/:id/comments` (corpo estruturado com texto e menções `@`), `DELETE /api/v1/comments/:commentId`.
   - **Anexos (`attachments`)**:
     - `GET /api/v1/tasks/:id/attachments`, `POST /api/v1/tasks/:id/attachments` (validação de tipos MIME permitidos e limite de tamanho de 25 MB conforme seção 9, gerando `storageKey` seguro), `DELETE /api/v1/attachments/:attachmentId`.
   - **Visões Salvas (`saved-views`)**:
     - `GET /api/v1/projects/:projectId/saved-views`, `POST /api/v1/projects/:projectId/saved-views`, `DELETE /api/v1/saved-views/:viewId`.

> [!IMPORTANT]
> **Segurança e RBAC Multi-Tenant:** Todas as rotas de projetos, tarefas e sub-recursos resolvem o `workspaceId` a partir da entidade no banco (nunca confiando apenas em IDs enviados pelo cliente) e verificam a associação do usuário autenticado ao workspace. Usuários com papel `GUEST` possuem acesso somente leitura (`GET`), sendo bloqueados (`403 INSUFFICIENT_ROLE`) em rotas de criação, edição ou exclusão.

---

### 2.2 Frontend (`@fluxo/web`) — Projetos, Visão Lista e Drawer de Detalhes

1. **Listagem e Criação de Projetos (`/[locale]/projects`)**:
   - Cards de projetos do workspace ativo com chave (`FLX`), badge de status (`PLANNING`, `ACTIVE`, etc.), cor identificadora, progresso/contagem de tarefas, filtro por status/busca e modal de criação/edição de projeto (`CreateProjectDialog`).
2. **Página de Projeto & Visão Lista (`/[locale]/projects/[projectId]`)**:
   - **Cabeçalho do Projeto**: chave, título, status, botão de configurações/edição do projeto e **Abas de Visão** (`Lista` ativa; `Kanban`, `Gantt`, `Cronograma`, `Calendário`, `Docs`, `Quadro` indicadas com badge da respectiva fase).
   - **Barra de Filtros, Busca e Visões Salvas (`TaskFiltersBar`)**:
     - Campo de busca textual rápida (atalho `/`),
     - Filtros por Status, Prioridade, Etiqueta e Responsável,
     - Seletor de Agrupamento (`Status`, `Prioridade` ou `Sem agrupamento`),
     - Seletor de **Visões Salvas** (`SavedView`) com opção de salvar a combinação de filtros atual (pessoal ou compartilhada).
   - **Criação Rápida Inline & Ações em Massa**:
     - Linha de adição rápida de tarefa no topo/grupo e botão principal **Nova Tarefa** (atalho `C`).
     - Checkbox de seleção múltipla com barra contextual para alterar status, alterar prioridade ou excluir tarefas em lote.
   - **Tabela da Visão Lista (`TaskListView`)**:
     - Edição rápida inline de Status, Prioridade e Título diretamente na linha.
     - Exibição rica: chave (`FLX-1`), ícone de marco (`isMilestone`), badge de subtarefas, chips de etiquetas, prioridade com ícone semântico, responsáveis (avatares), prazo (destacado em vermelho quando vencido), indicador de checklist (`concluídos/total`) e contadores de comentários e anexos.
     - Clique na tarefa abre o **Drawer Lateral de Detalhes (`TaskDetailDrawer`)** mantendo o estado e os filtros da lista.
3. **Drawer Lateral de Detalhes (`TaskDetailDrawer`)**:
   - Edição de título, status, prioridade, responsáveis (membros do workspace), datas de início e entrega, estimativa (minutos), barra/slider de progresso (`0–100%`) e flag de Marco (`isMilestone`).
   - Editor de descrição rica estruturada.
   - Gestão de **Etiquetas** da tarefa (adicionar etiqueta existente ou criar nova etiqueta colorida no workspace).
   - Gestão de **Subtarefas** (até 3 níveis) com criação rápida e alternância de status.
   - Gestão de **Checklists** (múltiplas checklists por tarefa, barra de progresso automática por checklist, adicionar/marcar/remover itens).
   - Gestão de **Anexos** (upload/registro de arquivo com validação de tipo/tamanho, listagem e exclusão).
   - Seção de **Comentários** com suporte a menções (`@membro`) com seletor rápido de membros do workspace e histórico cronológico.
4. **Atalhos de Teclado (`KeyboardShortcutsDialog`)**:
   - Listener global na tela de projeto (desativado quando o foco está em inputs/textareas):
     - `C`: abrir criação de tarefa,
     - `/`: focar no campo de busca,
     - `Esc`: fechar drawer/modal aberto,
     - `?`: abrir modal de ajuda com todos os atalhos de teclado.

---

## 3. Estrutura de Pastas da Fase 2

```text
.
├── packages/
│   └── shared/
│       └── src/
│           ├── schemas/
│           │   ├── project.ts                  # [NOVO] Schemas Zod/OpenAPI de Projetos, Status e SavedViews
│           │   └── task.ts                     # [NOVO] Schemas Zod/OpenAPI de Tarefas, Bulk, Labels, Checklists, Comments, Attachments
│           └── index.ts                        # [MOD] Exporta novos schemas e tipos
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── projects/                   # [NOVO] Módulo de Projetos, Status e Visões Salvas
│   │   │   │   │   ├── projects.routes.ts
│   │   │   │   │   ├── projects.controller.ts
│   │   │   │   │   ├── projects.service.ts
│   │   │   │   │   └── projects.repository.ts
│   │   │   │   └── tasks/                      # [NOVO] Módulo de Tarefas, Checklists, Comentários, Etiquetas e Anexos
│   │   │   │       ├── tasks.routes.ts
│   │   │   │       ├── tasks.controller.ts
│   │   │   │       ├── tasks.service.ts
│   │   │   │       └── tasks.repository.ts
│   │   │   ├── openapi/
│   │   │   │   └── openapi.ts                  # [MOD] Registra endpoints de Projects, Tasks, Labels, Checklists, Comments, Attachments, SavedViews
│   │   │   └── app.ts                          # [MOD] Conecta projectsRouter e tasksRouter em /api/v1
│   │   └── tests/
│   │       ├── helpers/
│   │       │   └── in-memory-db.ts             # [MOD] Suporte completo em memória para entidades da Fase 2
│   │       └── projects-tasks.test.ts          # [NOVO] Testes de integração e isolamento multi-tenant de Projetos e Tarefas
│   └── web/
│       ├── src/
│       │   ├── app/[locale]/
│       │   │   ├── page.tsx                    # [MOD] Atalhos diretos para Projetos e Tarefas da Fase 2
│       │   │   └── projects/
│       │   │       ├── page.tsx                # [NOVO] Listagem e criação de Projetos do Workspace
│       │   │       └── [projectId]/
│       │   │           └── page.tsx            # [NOVO] Visão Lista de Tarefas, Filtros, Visões Salvas e Drawer
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   └── AppSidebar.tsx          # [MOD] Links ativos para /projects e projeto padrão
│       │   │   ├── projects/
│       │   │   │   └── CreateProjectDialog.tsx # [NOVO] Modal de criação/edição de projeto
│       │   │   └── tasks/
│       │   │       ├── TaskFiltersBar.tsx      # [NOVO] Busca, filtros, agrupamento e Visões Salvas
│       │   │       ├── TaskListView.tsx        # [NOVO] Tabela agrupada/plana, edição inline e seleção em massa
│       │   │       ├── TaskDetailDrawer.tsx    # [NOVO] Drawer completo (campos, subtarefas, etiquetas, checklists, anexos, comentários com @menção)
│       │   │       ├── CreateTaskDialog.tsx    # [NOVO] Modal de criação de tarefa (acionado por botão ou tecla 'C')
│       │   │       └── KeyboardShortcutsDialog.tsx # [NOVO] Modal de ajuda de atalhos ('?')
│       │   ├── i18n/messages/
│       │   │   ├── pt-BR.json                  # [MOD] Textos completos da Fase 2 em Português
│       │   │   └── en.json                     # [MOD] Textos completos da Fase 2 em Inglês
│       │   └── lib/
│       │       └── api-client.ts               # [MOD] Clientes tipados projectsApi e tasksApi
│       ├── tests/
│       │   └── TaskListView.test.tsx           # [NOVO] Teste de componente da Visão Lista
│       └── e2e/
│           └── phase2-projects-tasks.spec.ts   # [NOVO] Fluxo E2E: criar projeto/tarefa -> editar -> comentar/checklist -> filtrar/visão salva
└── prisma/
    └── seed.ts                                 # [MOD] Enriquece seed com etiquetas, checklists, comentários, anexos e visão salva
```

---

## 4. Versões das Dependências e Scripts

Nenhuma dependência externa nova fora da seção 3 da `SPEC.md` precisa ser adicionada para a Fase 2 — utilizaremos as bibliotecas já aprovadas e instaladas no monorepo:

| Pacote | Dependência | Versão | Uso na Fase 2 |
| :--- | :--- | :--- | :--- |
| `root` | `prisma` / `@prisma/client` | `^6.4.1` | ORM PostgreSQL 16, transações e seed |
| `root` | `typescript` | `^5.7.3` | Typecheck estrito (`strict: true`) |
| `root` | `playwright` | `^1.64.1` | Testes E2E automatizados no navegador |
| `@fluxo/shared` | `zod` | `^3.24.2` | Validação compartilhada front/back |
| `@fluxo/shared` | `@asteasolutions/zod-to-openapi` | `^7.3.0` | Geração automática da spec OpenAPI 3.0 |
| `@fluxo/api` | `express` | `^4.21.2` | Rotas REST `/api/v1` |
| `@fluxo/api` | `vitest` / `supertest` | `^3.0.7` / `^7.0.0` | Testes unitários e de integração HTTP |
| `@fluxo/web` | `next` / `react` | `15.1.7` / `^19.0.0` | App Router e renderização cliente/servidor |
| `@fluxo/web` | `@mui/material` / `@mui/icons-material` | `^6.4.5` | Tabela, Drawer, Chips, Dialogs, Skeletons, Tooltips |
| `@fluxo/web` | `@tanstack/react-query` | `^5.66.7` | Cache, mutações e invalidação reativa de projetos/tarefas |
| `@fluxo/web` | `next-intl` | `^3.26.4` | Internacionalização (`pt-BR` e `en`) |

### Scripts do `package.json` raiz (conforme `AGENTS.md`)

| Script | Comando |
| :--- | :--- |
| `pnpm dev` | `pnpm --filter "@fluxo/*" --parallel dev` |
| `pnpm build` | `pnpm --filter @fluxo/shared build && pnpm --filter @fluxo/api build && pnpm --filter @fluxo/web build` |
| `pnpm lint` | `pnpm -r lint` |
| `pnpm typecheck` | `pnpm -r typecheck` |
| `pnpm test` | `pnpm -r test` |
| `pnpm test:e2e` | `pnpm --filter @fluxo/web test:e2e` |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:seed` | `tsx prisma/seed.ts` |
| `pnpm db:studio` | `prisma studio` |
| `pnpm docker:up` | `docker compose up -d` |

---

## 5. Schema Prisma (Modelos Utilizados na Fase 2)

O arquivo [`prisma/schema.prisma`](file:///home/talita/projetos/cacique-agil/prisma/schema.prisma) já contempla todos os modelos necessários para a Fase 2 com chaves estrangeiras, índices e deleção em cascata/lógica:

```prisma
model Project {
  id          String           @id @default(cuid())
  workspaceId String
  name        String
  key         String
  description String?
  status      ProjectStatus    @default(PLANNING)
  color       String?
  startDate   DateTime?
  dueDate     DateTime?
  ownerId     String
  deletedAt   DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  workspace   Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  statuses    WorkflowStatus[]
  tasks       Task[]
  documents   Document[]
  whiteboards Whiteboard[]
  savedViews  SavedView[]

  @@unique([workspaceId, key])
  @@index([workspaceId])
  @@index([deletedAt])
  @@map("projects")
}

model WorkflowStatus {
  id        String         @id @default(cuid())
  projectId String
  name      String
  category  StatusCategory
  position  Float
  wipLimit  Int?
  color     String?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  project   Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]

  @@index([projectId, position])
  @@map("workflow_statuses")
}

model Task {
  id              String           @id @default(cuid())
  projectId       String
  number          Int
  title           String
  description     Json?
  statusId        String
  priority        TaskPriority     @default(NONE)
  parentId        String?
  assigneeIds     String[]         @default([])
  startDate       DateTime?
  dueDate         DateTime?
  estimateMinutes Int?
  progress        Int              @default(0)
  isMilestone     Boolean          @default(false)
  position        Float
  deletedAt       DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  status          WorkflowStatus   @relation(fields: [statusId], references: [id], onDelete: Restrict)
  parent          Task?            @relation("SubTasks", fields: [parentId], references: [id], onDelete: SetNull)
  subtasks        Task[]           @relation("SubTasks")
  predecessors    TaskDependency[] @relation("TaskSuccessor")
  successors      TaskDependency[] @relation("TaskPredecessor")
  labels          TaskLabel[]
  checklists      Checklist[]
  comments        Comment[]
  attachments     Attachment[]
  timeEntries     TimeEntry[]

  @@unique([projectId, number])
  @@index([projectId, statusId, position])
  @@index([deletedAt])
  @@map("tasks")
}
```

*(Além dos modelos `Label`, `TaskLabel`, `Checklist`, `ChecklistItem`, `Comment`, `Attachment`, `TimeEntry` e `SavedView` já definidos nas linhas 286–546 de [`prisma/schema.prisma`](file:///home/talita/projetos/cacique-agil/prisma/schema.prisma)).*

O arquivo [`prisma/seed.ts`](file:///home/talita/projetos/cacique-agil/prisma/seed.ts) será atualizado para popular também:
- Etiquetas padrão no workspace `FluxoPro Org` (`Backend`, `Frontend`, `Segurança`, `Urgente`),
- Mais tarefas realistas no projeto `Lançamento v1 [FLX]` com responsáveis, prazos, subtarefas, checklists com itens concluídos/pendentes, comentários com menção e anexo de exemplo,
- Uma visão salva compartilhada (`Tarefas Críticas`).

---

## 6. Plano de Verificação e Critérios de Aceite (Definition of Done)

1. **Qualidade de Código**:
   - `pnpm lint` e `pnpm typecheck` passando com zero erros/warnings em todos os pacotes (`strict: true`, sem `any` injustificado).
2. **Testes Automatizados**:
   - **Integração (`apps/api/tests/projects-tasks.test.ts`)**: CRUD de projetos, numeração sequencial `FLX-1`, `FLX-2`, validação de subtarefas (máx. 3 níveis), ações em massa, etiquetas, checklists, comentários, anexos, visões salvas, filtros e **isolamento multi-tenant + RBAC (`GUEST` vs `MEMBER`/`OWNER`)**.
   - **Componentes (`apps/web/tests/TaskListView.test.tsx`)**: renderização da visão Lista, chips de prioridade/status e interação.
   - **E2E Playwright (`apps/web/e2e/phase2-projects-tasks.spec.ts`)**: fluxo completo de aceite da Fase 2 (**criar → editar no drawer → comentar e marcar checklist → filtrar e salvar visão**).
3. **Validação em Docker e Navegador**:
   - Subir containers com Docker, aplicar seed, inspecionar no navegador integrado e capturar screenshots da listagem de projetos, visão Lista de tarefas, Drawer de detalhes (com checklists, etiquetas e comentários) e filtros/visões salvas.

---

Aguardo sua aprovação deste **Implementation Plan** para iniciar a implementação da Fase 2.
