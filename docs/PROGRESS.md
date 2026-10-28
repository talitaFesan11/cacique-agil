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
- **Architecture Decision Records (`docs/decisions/`)**:
  - [ADR 001 — Tokens de Autenticação e Hashing de Senhas](./decisions/001-auth-tokens-and-password-hashing.md)
  - [ADR 002 — Hierarquia de Subtarefas, Ordenação e Visões Salvas (Fase 2)](./decisions/002-phase2-tasks-hierarchy-and-saved-views.md)

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

---

## 2. O que ficou pendente (Próximas Fases do Roadmap)

- **Fase 03 — Quadro Kanban:**
  - Drag-and-drop com `@dnd-kit` entre colunas (`WorkflowStatus`) e reordenação persistente (`PATCH /api/v1/tasks/:id/move`).
  - Limite WIP (`wipLimit`) configurável por coluna com alerta visual ao exceder.
  - Swimlanes opcionais por prioridade ou responsável.
- **Fase 04 — Cronograma (Gantt) e Calendário:**
  - Barras horizontais proporcionais a `startDate`/`dueDate`, marcos (`isMilestone`) e dependências (`BLOCKS`/`BLOCKED_BY`) com detecção de ciclo em grafo dirigido no backend.
  - Visão mensal/semanal de Calendário por `dueDate`.
- **Fase 05 — Documentos Colaborativos (Wiki):**
  - Árvore hierárquica de páginas (`Document`), editor rico Tiptap, histórico de versões (`DocumentVersion`) e vínculo entre trechos e tarefas.
- **Fase 06 — Quadros Brancos (Canvas):**
  - Canvas HTML5/SVG com pan/zoom, formas, post-its, conectores, texto livre e conversão de post-it em tarefa.
- **Fase 07 — Metas (OKRs), Relatórios e Controle de Tempo:**
  - Objetivos (`Goal`) e resultados-chave (`KeyResult`) vinculados a tarefas, dashboards com `@mui/x-charts`, registro de horas (`TimeEntry`) com cronômetro e exportação CSV.
- **Fase 08 — Polimento, Notificações, Busca Global (`Ctrl+K`), Acessibilidade e CI:**
  - Central de notificações no topo (badge + marcar como lida), Command Palette (`Ctrl+K`) unificado, webhooks de saída com assinatura HMAC e revisão final WCAG 2.1 AA.

---

## 3. Decisões Tomadas na Fase 02

1. **Validação estrita de profundidade de subtarefas no servidor (`ADR 002`)**: A regra de até 3 níveis de subtarefas vive exclusivamente no serviço de backend (`tasks.service.ts`), enquanto o frontend reflete a restrição na UX (ocultando o botão de adicionar subtarefa no nível 3).
2. **Soft Delete de tarefas (`deletedAt`)**: Exclusões individuais (`DELETE /api/v1/tasks/:id`) e em lote (`POST /api/v1/tasks/bulk`) preenchem `deletedAt` em vez de remover fisicamente o registro, preservando integridade de auditoria e histórico.
3. **Build prévio de `@fluxo/shared` em `typecheck` e `test`**: Como `@fluxo/shared` exporta tipos compilados em `dist/index.d.ts` (não versionados no Git), os scripts `pnpm typecheck` e `pnpm test` na raiz e o workflow `.github/workflows/ci.yml` executam `pnpm --filter @fluxo/shared build` antes da checagem de tipos e testes.
4. **Roteamento i18n explícito (`localePrefix: 'always'`) com Middleware**: Adicionado `apps/web/src/middleware.ts` e `apps/web/src/app/page.tsx` para redirecionar `/` automaticamente para `/pt-BR` sem quebrar rotas prefixadas (`/${locale}/...`).
5. **Renomeação do projeto para `Cacique Agil`**: Substituído o nome provisório `FluxoPro` por `Cacique Agil` nos dicionários `pt-BR`/`en`, títulos HTML, OpenAPI, templates de e-mail, seed e documentação.

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

## 5. Problemas Conhecidos e Soluções Aplicadas na Fase 02

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
