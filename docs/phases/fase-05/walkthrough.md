# Walkthrough — Fase 5: Documentos Colaborativos, TipTap + Yjs e Hierarquia Wiki

> [!NOTE]
> Este documento detalha a implementação completa, a arquitetura, os testes automatizados e a validação visual da **Fase 5** da plataforma **Cacique Agil**, conforme especificado em [SPEC.md](file:///home/talita/projetos/cacique-agil/SPEC.md) (seção 6.6 e 13) e [AGENTS.md](file:///home/talita/projetos/cacique-agil/AGENTS.md).

---

## 1. Resumo das Entregas da Fase 5

### 1.1 Pacote Compartilhado (`@fluxo/shared`)
- **[schemas/document.ts](file:///home/talita/projetos/cacique-agil/packages/shared/src/schemas/document.ts)**:
  - Schemas Zod e DTOs tipados com TypeScript estrito (`strict: true`):
    - `DocumentSchema`, `DocumentDto`, `CreateDocumentRequestSchema`, `UpdateDocumentRequestSchema`, `MoveDocumentRequestSchema`.
    - `DocumentTreeNodeSchema`, `DocumentTreeNodeDto`: estrutura hierárquica recursiva com ciclo detectado e campos `children`, `isFavorite`, `icon`.
    - `DocumentVersionSchema`, `DocumentVersionDto`, `CreateDocumentVersionRequestSchema`: snapshots imutáveis para auditoria e restauração 1-clique.
    - `DocumentCommentSchema`, `DocumentCommentDto`, `CreateDocumentCommentRequestSchema`, `UpdateDocumentCommentRequestSchema`: comentários com trecho selecionado (`selectedText`) e status de resolução (`resolvedAt`, `resolvedById`).
    - `PredefinedTemplateDto`, `DocTemplateCategoryEnum` (`MEETING`, `PRD`, `RETROSPECTIVE`, `GENERAL`).
    - `DocumentExportFormat` (`markdown`, `html`, `json`).

### 1.2 Banco de Dados & Prisma (`prisma/`)
- **[schema.prisma](file:///home/talita/projetos/cacique-agil/prisma/schema.prisma)**:
  - Campos adicionados no model `Document`: `isTemplate`, `templateCategory`, `createdById`.
  - Novos models criados:
    - `DocumentVersion`: snapshots numerados sequencialmente por documento com cópia integral de `contentJson` e `yjsState`.
    - `DocumentFavorite`: tabela associativa chaveada por `(userId, docId)` para controle de favoritos por usuário.
  - Model `Comment` estendido: relação direta com `Document` via `docId`, suporte a `selectedText`, `resolvedAt` e `resolvedById`.
  - Migration gerada e aplicada: `prisma/migrations/20261028193000_phase5_documents/migration.sql`.
  - **Seed Atualizado ([prisma/seed.ts](file:///home/talita/projetos/cacique-agil/prisma/seed.ts))**:
    - Documento raiz *"Especificação e Arquitetura do Produto (PRD)"* (`icon: '🚀'`).
    - Subpágina hierárquica *"Diretrizes de Design e UX"* (`icon: '🎨'`).
    - Documento *"Ata da Reunião de Kickoff da Sprint"* (`icon: '📝'`).
    - Favorito ativo para o usuário administrador.
    - Versão salva `v1 — Versão Inicial Aprovada`.
    - Comentário inline com trecho selecionado *"arquitetura do produto"*.
    - 3 modelos pré-definidos de sistema (Ata de Reunião, PRD e Retrospectiva de Sprint).

### 1.3 Backend (`apps/api`)
- **Módulo de Documentos (`src/modules/documents/`)**:
  - `documents.repository.ts`: consultas Prisma estruturadas, contagens recursivas e montagem otimizada da árvore Wiki.
  - `documents.service.ts`:
    - Validação de isolamento por workspace (`checkWorkspaceAccess`).
    - Detecção e prevenção de ciclos na hierarquia de subpáginas.
    - Exportação multi-formato: Markdown nativo estruturado, HTML puro pronto para impressão/PDF e JSON bruto.
    - Reordenação e movimentação de páginas (`moveDocument`).
    - Alternância atômica de favoritos por usuário (`toggleFavorite`).
    - Galeria de modelos pré-definidos e customizados por workspace.
  - `documents.controller.ts`: camada HTTP Express com tratamento rigoroso de status (`200`, `201`, `400`, `403`, `404`, `422`).
  - `versions.service.ts` & `versions.controller.ts`: criação de versões manuais, listagem com autor e restauração com backup automático do estado anterior.
  - `comments.service.ts` & `comments.controller.ts`: comentários em documentos, citação de trecho selecionado, resolução e reabertura com controle RBAC.
  - `documents.routes.ts`: rotas registradas sob `/api/v1/workspaces/:workspaceId/documents`, `/api/v1/documents/:id`, etc.
- **Sincronização em Tempo Real via CRDT Yjs (`src/realtime/`)**:
  - `yjs.service.ts`: gestão em memória de instâncias `Y.Doc`, aplicação de deltas binários, merge determinístico sem conflitos e persistência assíncrona no PostgreSQL com *debounce* de 2 segundos.
  - `socket.rooms.ts`: canais Socket.IO com autenticação JWT (`join-doc`, `leave-doc`, `doc-sync-init`, `doc-update`, `doc-awareness`).
- **OpenAPI / Swagger**:
  - Todos os endpoints documentados e tipados em `apps/api/src/openapi/openapi.ts`.

### 1.4 Frontend (`apps/web`)
- **Editor Rico TipTap com CRDT Yjs ([DocEditor.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocEditor.tsx))**:
  - Extensões TipTap: `StarterKit`, `Collaboration` (integrado com `YjsSocketProvider`), `CollaborationCursor`, `TaskList`, `TaskItem`, `Table`, `TableHeader`, `TableRow`, `TableCell`, `Highlight`, `Placeholder`.
  - Extensão nativa Callouts ([CalloutExtension.ts](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/extensions/CalloutExtension.ts)) com variantes `info`, `success`, `warning` e `danger`.
  - Extensão nativa Bloco de Tarefa Viva ([EmbeddedTaskExtension.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/extensions/EmbeddedTaskExtension.tsx)) renderizando chips de tarefa (`FLX-1`), título, indicador de conclusão e seletor inline de status.
  - Menu Flutuante de Seleção ([DocBubbleMenu.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocBubbleMenu.tsx)).
  - Barra de Ferramentas de Formatação ([DocToolbar.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocToolbar.tsx)).
  - Barra de Colaboração e Presença ([DocCollaborationBar.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocCollaborationBar.tsx)): avatares com cores de presença, chip de status de sincronização em tempo real e atalhos rápidos.
- **Árvore Hierárquica Wiki ([DocTreeSidebar.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocTreeSidebar.tsx) & [DocTreeNode.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocTreeNode.tsx))**:
  - Navegação expansível em múltiplos níveis com chevron animado.
  - Seção dedicada de Páginas Favoritas no topo.
  - Filtro de busca textual em tempo real preservando nós ancestrais correspondentes.
  - Criação rápida de subpáginas através de ação hover no item.
  - Menu contextual de ações: renomear, alternar favorito e excluir.
- **Gaveta de Histórico de Versões ([DocVersionHistoryDrawer.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocVersionHistoryDrawer.tsx))**:
  - Criação de snapshots com rótulo descritivo.
  - Lista com data/hora, autor e restauração com 1 clique.
- **Painel de Comentários Inline ([DocInlineCommentsPane.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocInlineCommentsPane.tsx))**:
  - Destaque do trecho de texto citado.
  - Alternância de status Resolvido / Reabrir com badge visual.
- **Galeria de Modelos ([DocTemplatesDialog.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocTemplatesDialog.tsx))**:
  - Cards com ícone, categoria, descrição e criação imediata a partir de templates estruturados.
- **Diálogo de Exportação ([DocExportDialog.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/components/docs/DocExportDialog.tsx))**:
  - Download de arquivo Markdown (`.md`), exportação JSON e impressão formatada para PDF com remoção de barras de navegação via regras `@media print`.
- **Aba de Documentos no Projeto**:
  - Integrada na página de detalhes do projeto ([projects/[projectId]/page.tsx](file:///home/talita/projetos/cacique-agil/apps/web/src/app/[locale]/projects/[projectId]/page.tsx)) permitindo visualizar e criar documentos associados ao projeto.

---

## 2. Evidências de Testes e Validação Visual

### 2.1 Testes Automatizados Unitários e de Componente (100% Green)
- **Monorepo Typecheck (`pnpm typecheck`)**:
  - `@fluxo/shared`: 0 erros (compilação CJS + ESM + DTS).
  - `@fluxo/api`: 0 erros (`strict: true`).
  - `@fluxo/web`: 0 erros (`strict: true`).
- **Monorepo Lint (`pnpm lint`)**:
  - Todos os pacotes em conformidade estrita com o ESLint monorepo, sem qualquer uso injustificado de `any`.
- **Testes Unitários & de Integração (`pnpm test` — 18 arquivos, 60 testes)**:
  - Backend API: 10 suítes, 34 testes (incluindo testes de criação, árvore hierárquica, favoritos, ciclos e exportação de documentos).
  - Frontend Web: 8 suítes, 26 testes (incluindo `DocTreeSidebar.test.tsx` e `DocTemplatesDialog.test.tsx`).

### 2.2 Teste E2E Playwright (`pnpm --filter @fluxo/web test:e2e e2e/phase5-documents.spec.ts`)
- Execução completa no Chromium Headless Shell: **Passou com sucesso (10.0s)**.

---

## 3. Galeria de Screenshots da Fase 5

### 3.1 Árvore de Documentos Wiki (Wiki Tree & Favoritos)
Exibe a barra lateral com a árvore hierárquica expansível, subpáginas aninhadas, seção de favoritos no topo e campo de busca filtrada.

![Árvore de Documentos Wiki](file:///home/talita/.gemini/antigravity/brain/b3da75f0-7f06-43d8-817f-1e96309318c9/screenshots/phase5-docs-tree.png)

---

### 3.2 Editor Rico TipTap com Bloco de Tarefa Viva
Exibe o editor TipTap com a barra de ferramentas de formatação, título com emoji seletor, cabeçalhos, listas e o bloco de tarefa embutida viva (`#FLX-1`) com status interativo.

![Editor TipTap e Bloco de Tarefa](file:///home/talita/.gemini/antigravity/brain/b3da75f0-7f06-43d8-817f-1e96309318c9/screenshots/phase5-doc-editor.png)

---

### 3.3 Galeria de Modelos de Documento (Templates)
Exibe o modal com templates pré-definidos estruturados (Ata de Reunião, Especificação de Produto - PRD, Retrospectiva de Sprint e Documento em Branco).

![Galeria de Modelos](file:///home/talita/.gemini/antigravity/brain/b3da75f0-7f06-43d8-817f-1e96309318c9/screenshots/phase5-doc-templates.png)

---

### 3.4 Histórico de Versões e Restauração
Exibe a gaveta lateral direita de histórico com snapshots versionados (`v1 — Versão Inicial Aprovada`), data, autor, botão para criar versão manual e ação de restauração 1-clique com salvamento de backup de segurança.

![Histórico de Versões](file:///home/talita/.gemini/antigravity/brain/b3da75f0-7f06-43d8-817f-1e96309318c9/screenshots/phase5-doc-versions.png)

---

### 3.5 Painel de Comentários Inline no Documento
Exibe a gaveta de comentários inline vinculados a trechos de texto específicos citados (`“arquitetura do produto”`), autor, data e badge visual de comentário resolvido.

![Comentários Inline](file:///home/talita/.gemini/antigravity/brain/b3da75f0-7f06-43d8-817f-1e96309318c9/screenshots/phase5-doc-comments.png)

---

### 3.6 Aba de Documentos Integrada na Visão do Projeto
Exibe a aba "Docs" na página de detalhes do projeto `FLX`, permitindo que os membros acessem diretamente a documentação técnica e especificações vinculadas ao projeto.

![Documentos no Projeto](file:///home/talita/.gemini/antigravity/brain/b3da75f0-7f06-43d8-817f-1e96309318c9/screenshots/phase5-project-docs.png)

---

## 4. O que foi feito vs. O que ficou pendente

### ✅ Concluído na Fase 5:
1. **Editor TipTap Rico e Colaborativo:** Suporte a cabeçalhos (H1, H2, H3), listas, checklists, tabelas com redimensionamento, blocos de código com highlight, citações, callouts coloridos, menu flutuante (bubble menu) e atalhos de barra de ferramentas.
2. **Sincronização CRDT em Tempo Real:** Comunicação via Socket.IO com Yjs e awareness de presença (cursores coloridos remotos e status sincronizado/conectando/offline) com persistência debounced no PostgreSQL sem necessidade de servidor proprietário externo.
3. **Blocos Vivos de Tarefa (`EmbeddedTaskExtension`):** Extensão NodeView React customizada para renderizar tarefas vinculadas (`FLX-1`) com alteração imediata de status refletida na API.
4. **Árvore de Páginas Wiki & Hierarquia:** Árvore recursiva com subpáginas, reordenação, busca em tempo real, prevenção rigorosa de ciclos e páginas favoritas por usuário.
5. **Histórico de Versões:** Criação de snapshots com rótulo personalizado e restauração com backup automático do estado corrente.
6. **Comentários Inline:** Inclusão de comentários com citação do texto selecionado e fluxo de resolução / reabertura.
7. **Modelos Estruturados (Templates):** Galeria com modelos prontos (PRD, Reunião, Retrospectiva) e documentos customizados como modelo (`isTemplate: true`).
8. **Exportação:** Exportação em Markdown (`.md`), HTML e impressão formatada para PDF com regras `@media print`.
9. **Integração no Projeto:** Aba "Docs" dedicada em cada projeto listando seus documentos vinculados.
10. **Definition of Done:** `lint` (0 erros), `typecheck` (0 erros), testes unitários e de integração (60 testes passando), E2E Playwright automatizado com 6 screenshots capturados e serviços Docker validados.

### ⏳ Pendente para as Próximas Fases:
- **Fase 6 — Quadros Brancos (Whiteboards):** Canvas infinito (tldraw / Fabric.js), formas vetoriais, notas adesivas, conexão de nós e sincronização em tempo real de posições.
- **Fase 7 — Metas, OKRs e Alinhamento Estratégico:** Objetivos anuais/trimestrais, Key Results com progresso automático vinculado a tarefas concluídas.
- **Fase 8 — Relatórios, Dashboards e Métricas:** Velocity, Burnup/Burndown, Cumulative Flow Diagram (CFD) e Lead/Cycle Time com gráficos Recharts.
- **Fase 9 — Busca Global (`Ctrl+K`), Notificações e Webhooks:** Command palette unificado, notificações in-app e webhooks de saída.
