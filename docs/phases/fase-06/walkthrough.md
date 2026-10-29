# Walkthrough — Fase 6: Quadros Brancos (Whiteboards), Canvas Infinito, Post-its, Tarefas Vivas, Modelos e Sincronização em Tempo Real

> [!NOTE]
> Este documento detalha a implementação completa, a arquitetura, os testes automatizados e a validação visual da **Fase 6** da plataforma **Cacique Agil**, conforme especificado em [SPEC.md](file:///home/talita/projetos/cacique-agil/SPEC.md) (seção 6.7 e 13) e [AGENTS.md](file:///home/talita/projetos/cacique-agil/AGENTS.md).

---

## 1. Resumo das Entregas da Fase 6

### 1.1 Pacote Compartilhado (`@fluxo/shared`)
- **[schemas/whiteboard.ts](file:///home/talita/projetos/cacique-agil/packages/shared/src/schemas/whiteboard.ts)**:
  - Schemas Zod e DTOs tipados com TypeScript estrito (`strict: true`):
    - `CanvasElementTypeSchema`: `'sticky'`, `'rectangle'`, `'ellipse'`, `'diamond'`, `'arrow'`, `'draw'`, `'frame'`, `'task_card'`.
    - `CanvasElementSchema`, `CanvasElement`: elemento flexível no plano cartesiano infinito com `x`, `y`, `width`, `height`, `rotation`, `color`, `backgroundColor`, `points`, `fromId`, `toId`, e propriedades de cartão de tarefa (`taskId`, `taskKey`, `taskTitle`, `taskStatusName`, `taskPriority`).
    - `WhiteboardDto`, `WhiteboardSummaryDto`, `CreateWhiteboardRequestSchema`, `UpdateWhiteboardRequestSchema`.
    - `ConvertStickyToTaskRequestSchema`: conversão de 1-clique de nota adesiva em tarefa formal no projeto com criação do vínculo `EntityLink`.
    - `ConvertSelectionToTasksRequestSchema`: conversão em lote de múltiplas notas selecionadas.
    - `PredefinedWhiteboardTemplateDto`: modelos estruturados de quadro (Brainstorming, Mapa Mental, Fluxograma, Retrospectiva Ágil).
    - `WhiteboardExportFormat` (`svg`, `png`, `json`).
- **[schemas/entity-link.ts](file:///home/talita/projetos/cacique-agil/packages/shared/src/schemas/entity-link.ts)**:
  - Schemas Zod e DTOs para vínculos polimórficos bidirecionais entre entidades do sistema (`fromType`, `fromId`, `toType`, `toId`).

### 1.2 Banco de Dados & Prisma (`prisma/`)
- **[schema.prisma](file:///home/talita/projetos/cacique-agil/prisma/schema.prisma)**:
  - Campos adicionados no model `Whiteboard`: `description`, `elementsJson` (JSONB com histórico de elementos e posições), `isTemplate`, `templateCategory`, `createdById`, `deletedAt`.
  - Relação configurada com `User.createdWhiteboards`.
  - Migration gerada e aplicada com sucesso: `prisma/migrations/20261028230000_phase6_whiteboards/migration.sql`.
  - **Seed Atualizado ([prisma/seed.ts](file:///home/talita/projetos/cacique-agil/prisma/seed.ts))**:
    - Quadro *"Brainstorming — Lançamento v1"* com notas temáticas, molduras de categorias e card vivo de tarefa vinculado `FLX-1` via `EntityLink`.
    - Quadro *"Fluxograma de Arquitetura & Dados"* com formas geométricas (retângulos, losangos de decisão) e conectores direcionais SVG.
    - Quadro *"Retrospectiva da Sprint 1"* com colunas ágeis (O que correu bem, O que podemos melhorar, Ações).

### 1.3 Backend (`apps/api`)
- **Módulo de Quadros Brancos (`src/modules/whiteboards/`)**:
  - `whiteboards.repository.ts`: consultas Prisma com isolamento estrito multi-tenant por workspace, busca de tarefas vinculadas via `EntityLink`.
  - `whiteboards.templates.ts`: biblioteca com 4 modelos completos (Brainstorming, Mapa Mental, Fluxograma, Retrospectiva).
  - `whiteboards.service.ts`:
    - CRUD com validação de associação ao projeto e isolamento de tenant.
    - Conversão 1-clique de nota adesiva (`convertStickyToTask`) criando tarefa no projeto e atualizando o elemento em `task_card` com `EntityLink`.
    - Conversão em lote (`convertSelectionToTasks`) para ideações em grupo.
    - Exportação multi-formato (`exportWhiteboard`): exportação vetorial nativa em SVG completo e JSON estruturado.
  - `whiteboards.controller.ts` & `whiteboards.routes.ts`: endpoints HTTP RESTful registrados sob `/api/v1/workspaces/:workspaceId/whiteboards`, `/api/v1/whiteboards/:id`, etc.
- **Sincronização em Tempo Real e Presença CRDT Yjs (`src/realtime/`)**:
  - `whiteboard-yjs.service.ts`: gerenciamento de instâncias `Y.Doc` em memória, merge de deltas e salvamento assíncrono com *debounce* de 2 segundos no PostgreSQL.
  - `socket.rooms.ts`: salas `whiteboard:${whiteboardId}` com eventos `join-whiteboard`, `whiteboard-update`, `whiteboard-awareness` (cursores remotos, seleção e cor do usuário) e `leave-whiteboard`.
- **OpenAPI**:
  - Endpoints documentados na especificação OpenAPI em `apps/api/src/openapi/openapi.ts`.

### 1.4 Frontend (`apps/web`)
- **Canvas Infinito SVG/HTML5 Nativo ([WhiteboardCanvas.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/whiteboard/WhiteboardCanvas.tsx))**:
  - Navegação fluida com Pan (arraste com ferramenta ou barra de espaço) e Zoom proporcional (10% a 300% com roda do mouse e botões).
  - Grade milimétrica suave ajustada à escala da câmera.
  - Ferramentas flutuantes: Seleção (`V`), Mover Tela (`H`), Post-it (`sticky`), Retângulo, Elipse, Losango, Seta Conectora, Desenho Livre e Moldura (`frame`).
  - Renderização direta de elementos:
    - `WhiteboardStickyNote.tsx`: Post-it colorido com edição de texto em tempo real, paleta de cores e botão de conversão rápida em tarefa.
    - `WhiteboardShape.tsx`: Formas vetoriais SVG estilizadas (retângulos com cantos arredondados, círculos, losangos de decisão).
    - `WhiteboardConnector.tsx`: Conectores ortogonais/direcionais com setas vetoriais SVG entre nós.
    - `WhiteboardDrawing.tsx`: Traçados livres com suporte a suavização de curvas bezier.
    - `WhiteboardTaskCard.tsx`: Card vivo de tarefa do Cacique Ágil embutido no canvas com chave da tarefa (`FLX-1`), badge de prioridade, status dinâmico e clique duplo para abrir detalhes completos no `TaskDetailDrawer`.
  - Presença de usuários e cursores remotos com nomes e cores personalizadas (`WhiteboardPresenceBar.tsx`).
  - Drawer lateral para inserção rápida de tarefas existentes do projeto no canvas (`WhiteboardTaskDrawer.tsx`).
  - Galeria modal de modelos de quadro pronta (`WhiteboardTemplatesModal.tsx`).
  - Menu de exportação vetorial SVG, imagem PNG e JSON (`WhiteboardExportMenu.tsx`).
- **Páginas e Navegação**:
  - Galeria de quadros brancos do workspace em `/[locale]/whiteboards` com filtros por projeto, busca textual e contadores de elementos/tarefas vinculadas.
  - Editor de quadro infinito em `/[locale]/whiteboards/[whiteboardId]`.
  - Integração com a aba "Quadros" na página do projeto (`/[locale]/projects/[projectId]?view=whiteboards`).
  - Link direto na barra lateral global (`AppSidebar.tsx`).
  - Internacionalização completa em `pt-BR` e `en`.

---

## 2. Testes Automatizados e Cobertura

### 2.1 Testes Unitários e de Integração no Backend (`apps/api`)
- Arquivo: `apps/api/tests/whiteboards.test.ts`
- Total: 4 suítes / testes cobrindo:
  - Listagem de templates pré-configurados do sistema.
  - Criação de quadro branco, persistência de elementos e exportação vetorial SVG.
  - Conversão de nota adesiva em tarefa formal com geração do `EntityLink`.
  - Isolamento estrito multi-tenant entre workspaces distintos.

### 2.2 Testes Unitários de Componentes no Frontend (`apps/web`)
- `WhiteboardTemplatesModal.test.tsx`: renderização da galeria, seleção de modelos e fechamento.
- `WhiteboardToolbar.test.tsx`: seleção de ferramentas, controles de zoom e botão contextual de conversão em lote.
- `WhiteboardStickyNote.test.tsx`: renderização, edição de texto e acionamento de conversão em tarefa.
- `WhiteboardTaskCard.test.tsx`: renderização da chave `FLX-42`, prioridade, status e abertura do drawer lateral.

### 2.3 Resumo dos Testes no Repositório
- **Backend (`apps/api`)**: 11 suítes de teste passando (38 testes).
- **Frontend (`apps/web`)**: 12 suítes de teste passando (38 testes).
- **Total**: 23 arquivos de teste passando (76 testes no total).

---

## 3. Galeria de Screenshots da Fase 6

### 3.1 Galeria de Quadros Brancos do Workspace
Exibe a tela de listagem de quadros brancos com busca textual, filtro por projeto, chips com quantidade de elementos e tarefas vinculadas, além dos modelos pré-carregados.

![Galeria de Quadros](file:///home/talita/projetos/cacique-agil/docs/phases/fase-06/screenshots/phase6-whiteboards-gallery.png)

---

### 3.2 Canvas Infinito Colaborativo com Post-its, Formas e Tarefas Vivas
Exibe a tela do editor de quadro branco ("Brainstorming — Lançamento v1") com pan/zoom infinito, notas adesivas coloridas, formas vetoriais, conector direcional, barra de presença de usuários e barra flutuante de ferramentas.

![Canvas de Whiteboard](file:///home/talita/projetos/cacique-agil/docs/phases/fase-06/screenshots/phase6-whiteboard-canvas.png)

---

### 3.3 Card Vivo de Tarefa do Projeto Embutido no Canvas
Exibe o card nativo de tarefa (`FLX-1`) posicionado no canvas infinito, sincronizado com o projeto, exibindo identificador, título, status dinâmico e botão para abrir detalhes completos no drawer lateral.

![Card Vivo de Tarefa](file:///home/talita/projetos/cacique-agil/docs/phases/fase-06/screenshots/phase6-whiteboard-task-card.png)

---

### 3.4 Modal de Modelos Prontos de Quadro Branco (Templates)
Exibe a galeria modal de templates (Brainstorming Colaborativo, Fluxograma de Processos, Mapa Mental Estruturado e Retrospectiva Ágil 4L) com pré-visualização de elementos pré-configurados.

![Modelos de Quadro Branco](file:///home/talita/projetos/cacique-agil/docs/phases/fase-06/screenshots/phase6-whiteboard-templates.png)

---

### 3.5 Aba de Quadros Brancos Integrada ao Projeto
Exibe a aba "Quadros" na visualização do projeto `FLX`, permitindo alternar rapidamente entre Lista, Kanban, Gantt, Calendário, Docs e Quadros Brancos diretamente no contexto do projeto.

![Aba Quadros no Projeto](file:///home/talita/projetos/cacique-agil/docs/phases/fase-06/screenshots/phase6-project-whiteboards-tab.png)

---

## 4. O que foi feito vs. O que ficou pendente

### ✅ Concluído na Fase 6:
1. **Canvas Infinito SVG/HTML5 Nativo:** Pan/zoom infinito com coordenadas relativas e escala dinâmica, renderizando formas e notas com desempenho suave sem dependência de bibliotecas comerciais fechadas.
2. **Notas Adesivas (Post-its):** Edição livre em tempo real, paleta de cores (amarelo, azul, verde, rosa, roxo, laranja) e conversão 1-clique em tarefa formal.
3. **Conversão em Tarefas & EntityLink:** Conversão individual e em lote criando registros polimórficos bidirecionais em `EntityLink` e transformando os post-its em cards vivos de tarefa.
4. **Cards Vivos de Tarefa:** Exibição da chave (`FLX-1`), título, prioridade e status dinâmico com abertura direta do `TaskDetailDrawer`.
5. **Sincronização em Tempo Real via CRDT Yjs e Socket.IO:** Atualização de deltas binários entre usuários conectados, persistência debounced no PostgreSQL e awareness de presença (cursores coloridos remotos com nomes de usuários).
6. **Formas e Conectores:** Retângulos, elipses, losangos de decisão, setas direcionais SVG e desenho livre.
7. **Modelos Estruturados (Templates):** 4 modelos inclusos (Brainstorming, Mapa Mental, Fluxograma, Retrospectiva) e inicialização de quadros a partir deles.
8. **Exportação Multi-formato:** Exportação vetorial SVG nativa, imagem PNG e exportação JSON completa.
9. **Integração no Projeto:** Aba "Quadros" nos detalhes de projeto e listagem global com busca e filtros por projeto.
10. **Definition of Done Concluído:** `lint` (0 erros), `typecheck` (0 erros), 76 testes unitários/integração passando, E2E Playwright automatizado com 5 screenshots capturados e serviços Docker Compose validados.

### ⏳ Pendente para as Próximas Fases:
- **Fase 07 — Metas (OKRs), Relatórios e Controle de Tempo:**
  - Objetivos (`Goal`) e resultados-chave (`KeyResult`) vinculados a tarefas, dashboards com gráficos, registro de horas (`TimeEntry`) com cronômetro e exportação CSV.
- **Fase 08 — Polimento, Notificações, Busca Global (`Ctrl+K`), Acessibilidade e CI:**
  - Central de notificações no topo (badge + marcar como lida), Command Palette (`Ctrl+K`) unificado, webhooks de saída com assinatura HMAC e revisão final WCAG 2.1 AA.
