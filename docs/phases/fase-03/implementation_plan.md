# Implementation Plan — Fase 3: Kanban e Tempo Real

**Projeto:** Cacique Agil  
**Fase:** 03 — Kanban e Tempo Real  
**Responsável:** Agente da Fase 3  
**Status:** Aguardando Aprovação  

---

## 1. Visão Geral e Objetivos da Fase 3

A Fase 3 tem como objetivo entregar o **Quadro Kanban completo e colaborativo** e a infraestrutura de **Tempo Real via Socket.IO**, conforme especificado nas seções **4**, **6.3**, **8.3** e **13** da `SPEC.md`.

### Principais Entregáveis:
1. **Quadro Kanban Interativo (`@dnd-kit`)**:
   - Visualização em colunas mapeadas dinamicamente para os `WorkflowStatus` do projeto.
   - Arrastar e soltar cards entre colunas e reordenar dentro da mesma coluna com **ordenação fracionária** (`position: Float`).
   - Gestão completa de colunas: adicionar, renomear, alterar cor, reordenar e ajustar limite WIP.
   - **Limite WIP (`wipLimit`)** com indicador visual em tempo real e destaque de advertência ao exceder.
   - **Swimlanes opcionais**: agrupamento horizontal por Prioridade, Responsável ou Etiqueta.
   - Cards ricos: chave sequencial (`FLX-12`), prioridade com chips temáticos, responsáveis (avatares com tooltip), prazo (destaque vermelho quando em atraso), contadores de checklists, comentários e anexos.
   - Clique no card abre o `TaskDetailDrawer` já integrado na Fase 2, sem perder o contexto do board.
   - Acessibilidade por teclado (sensores de teclado `@dnd-kit` e anúncios via `aria-live`).

2. **Infraestrutura de Tempo Real (`Socket.IO`)**:
   - Servidor Socket.IO em `apps/api/src/realtime/` autenticado via JWT.
   - Isolamento por salas: `project:{projectId}` e `workspace:{workspaceId}` com verificação estrita de permissões.
   - Emissão de eventos em mutações da API REST (`task.created`, `task.updated`, `task.moved`, `task.deleted`, `status.created`, `status.updated`, `status.deleted`, `comment.created`).
   - **Presença em Tempo Real**: usuários conectados emitem presença; visualização no topo da tela com avatares sobrepostos de quem está visualizando o projeto simultaneamente.
   - Cliente Web conectado: invalidação e atualização do TanStack Query em tempo real (< 1s) para todos os navegadores conectados.

---

## 2. Estrutura de Pastas e Arquivos

```text
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app.ts                         # Setup Express + health/auth/projects/tasks
│   │   │   ├── server.ts                      # Anexa http.Server ao Socket.IO com graceful shutdown
│   │   │   ├── realtime/                      # [NOVO] Módulo de Tempo Real Socket.IO
│   │   │   │   ├── socket.server.ts           # Inicialização da instância Socket.IO
│   │   │   │   ├── socket.auth.ts             # Middleware de autenticação JWT no handshake
│   │   │   │   ├── socket.rooms.ts            # Gerenciamento de salas (project:{id}) e presença
│   │   │   │   ├── socket.events.ts           # Definição e tipagem estrita de eventos
│   │   │   │   └── socket.emitter.ts          # Singleton de emissão chamado pelos services
│   │   │   └── modules/
│   │   │       ├── projects/
│   │   │       │   ├── projects.controller.ts # Handlers de status e projetos
│   │   │       │   ├── projects.service.ts    # CRUD de status (update, reorder, delete com validação)
│   │   │       │   ├── projects.repository.ts # Operações Prisma para WorkflowStatus
│   │   │       │   └── projects.routes.ts     # Rotas PATCH/DELETE de WorkflowStatus
│   │   │       └── tasks/
│   │   │           ├── tasks.service.ts       # moveTask com ordenação fracionária e emissão socket
│   │   │           └── tasks.routes.ts        # POST /tasks/:id/move
│   │   └── tests/
│   │       ├── kanban-status.test.ts          # [NOVO] Testes de status, WIP e reordenação
│   │       └── socket-realtime.test.ts        # [NOVO] Teste de conexão, presença e eventos socket
│   │
│   └── web/
│       ├── src/
│       │   ├── lib/
│       │   │   └── socket.ts                  # [NOVO] Cliente singleton Socket.IO autenticado
│       │   ├── features/
│       │   │   └── realtime/
│       │   │       ├── use-project-realtime.ts# [NOVO] Hook de sincronização de cache e presença
│       │   │       └── PresenceBar.tsx        # [NOVO] Barra visual de usuários online no projeto
│       │   ├── components/
│       │   │   └── kanban/                    # [NOVO] Componentes modulares do Kanban
│       │   │       ├── TaskKanbanView.tsx     # Board principal com DndContext, swimlanes e filtros
│       │   │       ├── KanbanColumn.tsx       # Coluna droppable, contador de tarefas e alerta WIP
│       │   │       ├── KanbanCard.tsx         # Card draggable com dados completos da tarefa
│       │   │       ├── KanbanSwimlane.tsx     # Agrupamento retrátil por prioridade/membro/label
│       │   │       └── ColumnSettingsDialog.tsx# Modal para criar/editar colunas e limites WIP
│       │   ├── app/
│       │   │   └── [locale]/
│       │   │       └── projects/
│       │   │           └── [projectId]/
│       │   │               └── page.tsx       # Ativação da aba Kanban e alternância de visões
│       │   └── i18n/
│       │       └── messages/
│       │           ├── pt-BR.json             # Dicionário atualizado para Kanban e Realtime
│       │           └── en.json                # Dicionário em inglês
│       ├── tests/
│       │   └── TaskKanbanView.test.tsx        # [NOVO] Teste de renderização do Kanban e limites WIP
│       └── e2e/
│           └── phase3-kanban-realtime.spec.ts # [NOVO] Teste E2E Playwright multi-usuário em tempo real
│
├── packages/
│   └── shared/
│       └── src/
│           ├── schemas/
│           │   ├── project.ts                 # UpdateWorkflowStatusRequestSchema
│           │   ├── task.ts                    # MoveTaskRequestSchema e ordenação fracionária
│           │   └── realtime.ts                # [NOVO] Schemas de eventos e presença Socket.IO
│           └── index.ts
│
└── prisma/
    ├── schema.prisma                          # Schema Prisma mantido e verificado
    └── seed.ts                                # Seed com tarefas distribuídas nas colunas Kanban
```

---

## 3. Versões das Dependências

As seguintes bibliotecas serão adicionadas respeitando a compatibilidade do monorepo:

### Backend (`apps/api`):
| Dependência | Versão | Justificativa |
| :--- | :--- | :--- |
| `socket.io` | `^4.8.1` | Padrão do projeto para eventos em tempo real, salas e WebSockets (seção 3 da Spec). |

### Frontend (`apps/web`):
| Dependência | Versão | Justificativa |
| :--- | :--- | :--- |
| `socket.io-client` | `^4.8.1` | Cliente WebSocket oficial compatível com a versão do servidor. |
| `@dnd-kit/core` | `^6.3.1` | Biblioteca de Drag & Drop moderna, flexível, performática e com acessibilidade nativa (seção 3 da Spec). |
| `@dnd-kit/sortable` | `^10.0.0` | Utilidades de ordenação de listas e colunas. |
| `@dnd-kit/utilities` | `^3.2.2` | Funções auxiliares de transformação e estilos CSS para dnd-kit. |

### Dependências Já Instaladas e Utilizadas:
- `@prisma/client`: `^6.4.1`
- `express`: `^4.21.2`
- `zod`: `^3.24.2`
- `next`: `15.1.7` / `react`: `^19.0.0`
- `@mui/material`: `^6.4.5` / `@mui/icons-material`: `^6.4.5`
- `@tanstack/react-query`: `^5.66.7`
- `vitest`: `^3.0.7` / `@testing-library/react`: `^16.2.0` / `playwright`: `^1.64.1`

---

## 4. Scripts do Monorepo

Os scripts raiz continuam padronizados e garantem a execução do Definition of Done:

```bash
# Executar todos os testes de tipos e código
pnpm lint
pnpm typecheck
pnpm test

# Testes E2E (incluindo o novo teste multi-contexto de Kanban e Tempo Real)
pnpm test:e2e

# Subir a stack local com Docker Compose
pnpm docker:up
pnpm db:migrate
pnpm db:seed
```

---

## 5. Schema Prisma Inicial e Validação

O modelo de dados já possui as entidades necessárias concebidas na Fase 0:

```prisma
model WorkflowStatus {
  id        String         @id @default(cuid())
  projectId String
  name      String
  category  StatusCategory // TODO, IN_PROGRESS, DONE
  position  Float          // Ordenação fracionária das colunas
  wipLimit  Int?           // Limite de trabalho em progresso (WIP)
  color     String?        // Cor da coluna (ex.: #3B82F6)
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
  number          Int              // Número sequencial (ex.: FLX-12)
  title           String
  description     Json?
  statusId        String
  priority        TaskPriority     @default(NONE)
  position        Float            // Posição fracionária no Kanban
  progress        Int              @default(0)
  dueDate         DateTime?
  startDate       DateTime?
  estimateMinutes Int?
  assigneeIds     String[]         @default([])
  deletedAt       DateTime?
  // Relações com labels, checklists, comments, attachments
  // ...
  @@unique([projectId, number])
  @@index([projectId, statusId, position])
  @@map("tasks")
}
```

> **Nota:** Não há necessidade de alteração estrutural destrutiva no schema. Garantiremos apenas novos schemas Zod em `packages/shared` para atualização de colunas (`UpdateWorkflowStatusRequestSchema`, `ReorderWorkflowStatusesSchema`) e tipagem de eventos em tempo real.

---

## 6. Arquitetura do Kanban e Algoritmo de Ordenação Fracionária

### 6.1 Cálculo de `position` (Ordenação Fracionária)
Para evitar reindexação em massa de todos os cards ao mover um item:
1. **Mover para topo da coluna**: `newPosition = firstCard.position / 2` (ou `1000` se coluna vazia).
2. **Mover para o fim da coluna**: `newPosition = lastCard.position + 1000`.
3. **Mover entre card A e card B**: `newPosition = (A.position + B.position) / 2`.
4. **Rebalanceamento automático**: Caso a diferença entre cards adjacentes fique menor que `0.0001`, o serviço rebalanceia as posições da coluna em incrementos de `1000`.

### 6.2 Alerta de Limite WIP (Work in Progress)
- Quando `wipLimit` estiver configurado na coluna (ex.: `3`) e o número de cards ativos for maior que o limite (ex.: `4`):
  - Badge de contagem fica destacado em vermelho com ícone de alerta: `4 / 3 (Limite Excedido)`.
  - Coluna ganha uma borda superior de aviso (`warning.main` ou `error.main`).
  - Leitores de tela recebem notificação via aria-label.

### 6.3 Swimlanes
- Agrupamentos suportados na visão Kanban:
  - **Nenhuma (Padrão)**: Mostra as colunas normais de status.
  - **Por Prioridade**: Linhas para `URGENT`, `HIGH`, `MEDIUM`, `LOW`, `NONE`.
  - **Por Responsável**: Linha para cada membro do workspace atribuído + linha "Não atribuído".
  - **Por Etiqueta**: Linha para cada etiqueta aplicada + "Sem etiqueta".
- Cada raia horizontal pode ser expandida/recolhida individualmente.

---

## 7. Arquitetura de Tempo Real (Socket.IO)

```
[ Cliente Web 1 (Navegador) ]                  [ Cliente Web 2 (Navegador) ]
          │                                              │
          │ 1. Conecta com JWT                           │ 1. Conecta com JWT
          │ 2. join-project (project:123)                │ 2. join-project (project:123)
          │ 3. presence.join                             │ 3. presence.join
          ▼                                              ▼
   ┌─────────────────────────────────────────────────────────────┐
   │            Cacique Agil API (Socket.IO Server)              │
   │  - Auth Handshake: valida token JWT e Membership            │
   │  - Gerenciador de Presença em Memória (usuários por sala)   │
   │  - Emitter de Eventos: disparado pelas mutações REST        │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
    Quando Cliente 1 arrasta card: POST /api/v1/tasks/:id/move
                                  │
                                  ▼
      tasksService.moveTask() salva no PostgreSQL
                                  │
                                  ▼
      socketEmitter.toProject('123', 'task.moved', payload)
                                  │
        ┌─────────────────────────┴─────────────────────────┐
        ▼                                                   ▼
   [ Evento recebido em < 1s ]                         [ Evento recebido em < 1s ]
   TanStack Query invalida cache                       TanStack Query atualiza card
   Card move suavemente na tela                        Card move suavemente na tela
```

---

## 8. Estratégia de Testes e Definition of Done

1. **Testes Unitários e de Integração da API**:
   - Mover tarefa entre colunas e posições fracionárias (`POST /api/v1/tasks/:id/move`).
   - CRUD de colunas: atualização de nome/cor/wipLimit e exclusão impedida quando houver tarefas associadas.
   - Conexão Socket.IO: autenticação válida vs token inválido, join na sala do projeto, emissão e recebimento de `task.moved` e `presence.update`.
2. **Testes de Componentes Web**:
   - `TaskKanbanView.test.tsx`: Renderização das colunas, cards, cálculo do indicador WIP e acionamento de modal de edição de coluna.
3. **Teste E2E Playwright Multi-Sessão**:
   - Criação de 2 contextos de navegador independentes (`contextA` e `contextB`).
   - Usuário A abre o Kanban e arrasta uma tarefa para a coluna "Em Andamento".
   - Usuário B vê a tarefa mudar de coluna em menos de 1 segundo sem recarregar a página.
   - Ambos os usuários veem o avatar um do outro na barra de presença ativa.
4. **Validação Visual e Screenshots**:
   - Captura de telas do Quadro Kanban (colunas, cartões ricos, alerta de limite WIP excedido, swimlanes e usuários online).

---

Aguardando sua aprovação para prosseguir com a implementação!
