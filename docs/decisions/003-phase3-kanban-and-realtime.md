# ADR 003: Posicionamento Fracionário, Alertas WIP e Sincronização em Tempo Real (Fase 3)

- **Status:** Aceito
- **Data:** 2026-10-28

## Contexto

Na Fase 3 (Quadro Kanban e Tempo Real), a especificação (`SPEC.md` Seções 4.3 e 5.3) exige:
1. Quadro interativo com drag-and-drop entre colunas mapeadas para `WorkflowStatus`.
2. Ordenação persistente entre e dentro de colunas sem reescrever todas as posições do banco.
3. Limite de Trabalho em Progresso (WIP limit) configurável por coluna, com alerta visual claro quando excedido.
4. Swimlanes configuráveis (por Prioridade, Responsável ou Sem Agrupamento).
5. Sincronização em tempo real via WebSockets (Socket.IO) com autenticação JWT, salas por projeto e stack de avatares com presença ativa.

## Decisões

1. **Posicionamento Fracionário (`Float`) para Movimentação de Tarefas**:
   - A coluna `position` (tipo `Float`) permite inserções intermediárias calculando a média aritmética entre as posições dos vizinhos superior e inferior: `(prevPosition + nextPosition) / 2`.
   - Inserção no topo calcula `firstPosition / 2` (ou `1000` se vazia); inserção no final calcula `lastPosition + 1000`.
   - Essa abordagem evita reescrever índices de todas as tarefas da coluna (`O(1)` em vez de `O(n)` writes no banco), mantendo a persistência imediata e compatível com a API `PATCH /api/v1/tasks/:id/move`.
2. **Alertas Visuais de Limite WIP**:
   - O limite WIP é persistido na entidade `WorkflowStatus` (`wipLimit: Int?`).
   - Quando a contagem de tarefas ativas na coluna ultrapassa o limite (`taskCount > wipLimit`), a interface exibe um badge de status de alerta no cabeçalho da coluna (`warning.main` ou `error.main`) e um banner explicativo contextual indicando a quantidade excedente.
3. **Arquitetura de Tempo Real com Socket.IO (`apps/api/src/realtime/`)**:
   - **Autenticação Handshake**: Validação de JWT via `socket.handshake.auth.token` ou cookie `accessToken` antes de aceitar a conexão.
   - **Isolamento Multi-tenant e Autorização de Sala**: Clientes entram em salas dedicadas `project:{projectId}` apenas após validação de que o usuário pertence ao workspace do projeto (`socket.rooms.ts`).
   - **Broadcasting de Mutações de Tarefas**: O serviço de tarefas (`tasks.service.ts`) emite eventos tipados (`task.created`, `task.updated`, `task.moved`, `task.deleted`, `comment.created`) via `socketEmitter` para a sala do projeto correspondente.
   - **Rastreamento de Presença**: Mantido registro em memória dos usuários ativos em cada sala (`presence.update`), propagando a lista de usuários online para renderização do stack de avatares no frontend (`PresenceBar.tsx`).
4. **Resiliência a Ambientes Sem Terminal Interativo no pnpm**:
   - Adicionada configuração `confirmModulesPurge=false` no `.npmrc` da raiz para evitar o bloqueio `[ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY]` durante atualizações de pacotes em containers e ambientes de CI sem TTY.
