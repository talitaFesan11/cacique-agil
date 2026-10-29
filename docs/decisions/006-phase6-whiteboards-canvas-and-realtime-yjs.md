# ADR 006 — Motor de Canvas Infinito SVG/React, Vínculo de Tarefas (EntityLink) e Sincronização CRDT Yjs sobre Socket.IO (Fase 6)

**Status:** Proposto (Aguardando Aprovação do Plano)  
**Data:** 28 de Outubro de 2026  
**Contexto:** Fase 6 — Quadros Brancos (Whiteboards) Colaborativos  

---

## 1. Contexto e Problema

A Seção 6.7 da `SPEC.md` define os requisitos para o módulo de Quadros Brancos:
- Canvas infinito com navegação por Pan e Zoom.
- Ferramentas visuais: formas geométricas, setas/conectores magnéticos, texto livre, notas adesivas (post-its), desenho livre e molduras (frames).
- Colaboração em tempo real com presença, cursores remotos e seleção de outros usuários.
- **Cards de tarefa no quadro:** arrastar tarefas para o canvas cria um card vinculado (`EntityLink`), onde alterações de status e dados da tarefa se refletem no card em tempo real.
- **Conversão de notas em tarefas:** converter uma nota adesiva individual em tarefa real no projeto, e converter uma seleção múltipla de notas em uma lista estruturada de tarefas.
- Modelos pré-definidos (Brainstorming, Mapa Mental, Fluxograma, Retrospectiva).
- Exportação em imagem (PNG) e vetor (SVG).

Na Seção 15 da `SPEC.md`, a seguinte decisão arquitetural foi deixada em aberto:
> *"tldraw vs. Excalidraw: Licenciamento do tldraw para uso comercial. Validar licença antes da Fase 6; Excalidraw (MIT) como alternativa."*

---

## 2. Decisão

### 2.1 Análise das Opções de Engine de Canvas
1. **tldraw v2:** Adotou licença comercial proprietária restritiva que proíbe o uso em sistemas SaaS comerciais sem a contratação de licença paga. Adicionalmente, possui conflitos rígidos de *peer dependencies* com o React 19 (`"react": "^19.0.0"` no Next.js 15).
2. **Excalidraw:** Embora seja licença MIT, renderiza todo o conteúdo em um elemento `<canvas>` rasterizado opaco. Isso inviabiliza a renderização direta de nós React vivos para cartões de tarefas (com dropdown de status, botões interativos e gavetas de detalhes) e complica o arraste nativo de tarefas vindas de outros componentes.
3. **Canvas Nativo em SVG/React + CRDT Yjs:** Seguindo a mesma abordagem implementada no Gantt nativo da Fase 4 e nos Documentos colaborativos da Fase 5:
   - Zero dependências proprietárias ou custos de licenciamento.
   - 100% de compatibilidade com React 19 e Material UI v6.
   - Renderização vetorial limpa em SVG/HTML5 de alta performance com suporte nativo a drag & drop, foco de acessibilidade e tema claro/escuro unificado.
   - Cartões de tarefas são componentes React reais (`WhiteboardTaskCard`) vinculados bidirecionalmente a tarefas do projeto via `EntityLink`.

Decidimos adotar a **opção 3: Motor Nativo em SVG/React com CRDT Yjs sobre Socket.IO**.

### 2.2 Sincronização CRDT Yjs sobre Socket.IO
Reutilizamos o servidor Socket.IO já configurado em `apps/api/src/realtime/`:
- **Salas:** `whiteboard:{id}` com autenticação JWT e validação de membro do workspace.
- **Deltas CRDT:** Os eventos `whiteboard-update` propagam deltas binários (`Uint8Array`) entre clientes.
- **Awareness:** O canal `whiteboard-awareness` sincroniza cursores em tempo real (coordenadas x, y no canvas virtual com nome e cor do usuário) e bordas de seleção.
- **Persistência:** O servidor mantém o `Y.Doc` em memória e persiste no PostgreSQL com debounce de 2 segundos nos campos `yjsState` (binário) e `elementsJson` (JSON para leitura e preview rápidos).

### 2.3 Integração com Tarefas (`EntityLink`) e Conversão
- A tabela `EntityLink` (`fromType: 'whiteboard'`, `fromId: whiteboardId`, `toType: 'task'`, `toId: taskId`) gerencia os relacionamentos entre os elementos do quadro e as tarefas do workspace.
- A rota `/api/v1/whiteboards/:id/convert-sticky` recebe o identificador da nota adesiva, cria uma tarefa no projeto associado (`FLX-N`) e transforma o elemento no canvas em um card de tarefa conectado.

---

## 3. Consequências

- **Positivas:**
  - Independência total de fornecedores terceiros e ausência de custos de licença.
  - Fidelidade visual absoluta com o Design System MUI do Cacique Agil.
  - Facilidade de teste automatizado com Vitest e Playwright.
  - Desempenho excelente com renderização vetorial e zoom/pan matematicamente calculados.
