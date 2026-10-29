# Implementation Plan — Fase 6: Quadros Brancos (Whiteboards)

Este plano de implementação detalha o design técnico, a modelagem de dados, a sincronização em tempo real e os componentes de interface para a **Fase 6: Quadros Brancos** da plataforma **Cacique Agil**, em estrita conformidade com a [SPEC.md](../../../SPEC.md) e as regras do [AGENTS.md](../../../AGENTS.md).

---

## 1. Visão Geral da Fase 6

A **Fase 6** implementa a experiência visual e colaborativa de **Quadros Brancos (Whiteboards)**:
1. **Canvas Infinito em Tempo Real:** Navegação suave com Pan (arrastar tela) e Zoom (scroll/controles), grade de fundo adaptativa e renderização vetorial SVG de alto desempenho.
2. **Ferramentas de Criação:**
   - **Notas adesivas (post-its):** Múltiplas cores pastel, texto editável em tempo real e visual realista com sombras.
   - **Formas geométricas:** Retângulos, elipses, losangos (decisão) e molduras (frames) com rótulos de texto centralizados.
   - **Setas e conectores dinâmicos:** Conexão magnética ortogonal e direta entre elementos com marcadores de seta.
   - **Desenho livre:** Caneta/marcador com suavização de traço em curvas SVG.
   - **Texto livre:** Blocos de tipografia redimensionáveis.
3. **Integração Profunda com Tarefas (`EntityLink`):**
   - **Cards de tarefa no quadro:** Arrastar tarefas existentes para o canvas cria cartões vivos com chave (ex: `FLX-1`), título, prioridade e status editável inline, sincronizados bidirecionalmente via `EntityLink`.
   - **Conversão de nota adesiva em tarefa:** Ação de 1 clique para transformar um post-it em tarefa real no projeto, preservando o conteúdo e vinculando ao canvas.
   - **Conversão em lote:** Seleção múltipla de notas adesivas com conversão automática em lista sequencial de tarefas no projeto.
4. **Modelos Prontos (Templates):**
   - **Brainstorming:** Colunas estruturadas de post-its (Ideias, Desafios, Soluções, Próximos Passos).
   - **Mapa Mental:** Nó central conectado a tópicos e subtópicos.
   - **Fluxograma:** Início -> Decisão -> Processo -> Fim com conectores direcionais.
   - **Retrospectiva Ágil:** O que correu bem, O que podemos melhorar, Ações a tomar.
5. **Colaboração em Tempo Real (Yjs + Socket.IO):**
   - Cursors remotos com nomes e cores dos usuários ativos.
   - Seleção compartilhada e movimentação fluida de elementos sem conflitos (CRDT).
   - Persistência assíncrona debounced (2s) no PostgreSQL (`yjsState: Bytes` e `elementsJson: Json`).
6. **Exportação & Miniaturas:**
   - Exportação em imagem PNG em alta resolução e SVG vetorial limpo.
   - Geração automática de miniatura SVG para a listagem do workspace e do projeto.

---

## 2. Decisão Arquitetural: Canvas Nativo SVG/React vs. tldraw/Excalidraw

Conforme registrado na Seção 15 da `SPEC.md` (*"tldraw vs. Excalidraw: Licenciamento do tldraw para uso comercial - Validar licença antes da Fase 6; Excalidraw (MIT) como alternativa"*):
- O **tldraw v2** adota uma licença comercial proprietária restritiva que impede uso em SaaS comercial sem taxa de licenciamento, além de graves incompatibilidades de peer dependencies com React 19 (`"react": "^19.0.0"` no Next.js 15).
- O **Excalidraw** renderiza em `<canvas>` rasterizado opaco, o que impossibilita a inserção nativa de componentes React ricos (como dropdowns interativos de status de tarefas, drawers de detalhes e botões de conversão direta).
- **Decisão (ADR 006):** Desenvolver um motor de Canvas Infinito nativo em **React + SVG/HTML5** com sincronização **CRDT Yjs** sobre Socket.IO (seguindo a mesma arquitetura de sucesso do Gantt na Fase 4 e dos Documentos na Fase 5).
  - Sem custos de licença e sem dependências comerciais externas.
  - Compatibilidade total com React 19 e Material UI v6.
  - Permite renderizar cartões de tarefas como componentes React vivos com acessibilidade completa, foco de teclado e atualização em tempo real.

---

## 3. Schema Prisma Atualizado

Criaremos uma nova migration `20261028230000_phase6_whiteboards` estendendo o modelo `Whiteboard` existente e integrando-o ao `User`, `Project` e `Workspace`:

```prisma
model Whiteboard {
  id               String       @id @default(cuid())
  workspaceId      String
  projectId        String?
  title            String
  description      String?
  yjsState         Bytes?       // Snapshot binário do Y.Doc para convergência CRDT
  elementsJson     Json?        // Espelho estruturado para exportação e renderização rápida
  thumbnailUrl     String?      // Snapshot SVG codificado para preview na listagem
  isTemplate       Boolean      @default(false)
  templateCategory String?      // 'brainstorming' | 'mindmap' | 'flowchart' | 'retrospective'
  createdById      String?
  deletedAt        DateTime?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  workspace        Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  project          Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)
  createdBy        User?        @relation("WhiteboardAuthor", fields: [createdById], references: [id], onDelete: SetNull)

  @@index([workspaceId])
  @@index([projectId])
  @@index([isTemplate])
  @@index([deletedAt])
  @@map("whiteboards")
}
```

---

## 4. Estrutura de Pastas e Arquivos

```text
packages/shared/src/schemas/whiteboard.ts
packages/shared/src/schemas/entity-link.ts
apps/api/src/modules/whiteboards/
  ├── whiteboards.routes.ts
  ├── whiteboards.controller.ts
  ├── whiteboards.service.ts
  ├── whiteboards.repository.ts
  └── whiteboards.schemas.ts
apps/api/src/realtime/whiteboard-yjs.service.ts
apps/web/src/components/whiteboard/
  ├── WhiteboardCanvas.tsx
  ├── WhiteboardToolbar.tsx
  ├── WhiteboardStickyNote.tsx
  ├── WhiteboardShape.tsx
  ├── WhiteboardConnector.tsx
  ├── WhiteboardDrawing.tsx
  ├── WhiteboardTaskCard.tsx
  ├── WhiteboardTaskDrawer.tsx
  ├── WhiteboardTemplatesModal.tsx
  ├── WhiteboardExportMenu.tsx
  ├── WhiteboardPresenceBar.tsx
  └── whiteboard.module.css
apps/web/src/app/[locale]/whiteboards/page.tsx
apps/web/src/app/[locale]/whiteboards/[whiteboardId]/page.tsx
```

---

## 5. Endpoints da API REST (`/api/v1`)

- `GET /api/v1/workspaces/:workspaceId/whiteboards`
- `POST /api/v1/workspaces/:workspaceId/whiteboards`
- `GET /api/v1/whiteboards/:id`
- `PATCH /api/v1/whiteboards/:id`
- `DELETE /api/v1/whiteboards/:id`
- `GET /api/v1/whiteboards/templates`
- `POST /api/v1/whiteboards/:id/convert-sticky`
- `POST /api/v1/whiteboards/:id/convert-selection`
- `GET /api/v1/whiteboards/:id/export`
