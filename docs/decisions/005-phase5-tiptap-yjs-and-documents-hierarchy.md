# ADR 005 — Editor TipTap, Sincronização CRDT Yjs sobre Socket.IO e Hierarquia de Documentos (Fase 5)

**Status:** Proposto (Aguardando Aprovação do Plano)  
**Data:** 28 de Outubro de 2026  
**Contexto:** Fase 5 — Documentos Colaborativos  

---

## 1. Contexto e Problema

O módulo de Documentos da Seção 6.6 da `SPEC.md` requer um editor rico em blocos (TipTap), colaboração em tempo real resiliente e sem perda de dados (Yjs com convergência matemática), navegação em árvore hierárquica, modelos estruturados (templates), histórico de versões, comentários inline em trechos selecionados e blocos vivos de tarefas.

Foram identificadas três decisões de arquitetura fundamentais:
1. **Transporte de sincronização do Yjs:** adotar um servidor dedicado (como Hocuspocus / processo WebSocket avulso em porta extra) versus utilizar o servidor Socket.IO já existente com autenticação JWT e isolamento de salas.
2. **Estratégia de persistência no PostgreSQL:** persistir apenas o estado binário CRDT (`yjsState: Bytes`) ou adotar persistência híbrida incluindo também o espelho estruturado (`contentJson: Json`).
3. **Representação da hierarquia de páginas e favoritos:** modelagem de árvore com Adjacency List (`parentId`) e favoritos por usuário (`DocumentFavorite`).

---

## 2. Decisão

### 2.1 Sincronização Yjs sobre Socket.IO Integrado
Decidimos utilizar o servidor Socket.IO já existente (`socket.rooms.ts` e `socket.server.ts`) para o transporte das mensagens de sincronização do Yjs e presença/cursores (`Awareness`).
- **Motivo:** evita processos e portas adicionais no Docker Compose e no Nginx de produção, reutiliza as rotinas de verificação de JWT e isolamento multi-tenant de workspace, e mantém a arquitetura unificada.
- **Protocolo:** eventos `join-doc`, `doc-update` (transmissão de Uint8Array de deltas CRDT) e `doc-awareness` (cursores e seleções em tempo real).

### 2.2 Persistência Híbrida no PostgreSQL (`yjsState` + `contentJson`)
Decidimos persistir tanto o snapshot binário do Y.Doc (`yjsState Bytes?`) quanto a árvore JSON ProseMirror/TipTap (`contentJson Json?`):
- O `yjsState` garante restauração CRDT sem perda de histórico vetorial e convergência imediata com novos clientes.
- O `contentJson` viabiliza exportação veloz (Markdown/HTML), indexação para busca full-text no PostgreSQL e geração de sumários/previews sem necessidade de instanciar o runtime do Yjs a cada leitura.
- A persistência no banco é feita de forma debounced (2 segundos de inatividade após digitação) e ao desconectar o último usuário da sala.

### 2.3 Modelagem da Hierarquia e Favoritos
- **Hierarquia:** padrão Adjacency List com chave `parentId` auto-referenciada em `Document`, permitindo aninhamento ilimitado de subpáginas com `onDelete: SetNull` para preservar filhos em caso de exclusão acidental.
- **Favoritos:** tabela `DocumentFavorite` com chave composta única `(userId, docId)`, garantindo que cada usuário do workspace tenha sua própria lista de páginas favoritas sem interferir nos colegas.
- **Versões:** tabela `DocumentVersion` registrando `docId`, `versionNumber`, `name`, `contentJson`, `yjsState` e `createdById`, permitindo restauração atômica.

### 2.4 Blocos de Tarefas Embutidos (`EmbeddedTaskExtension`)
- Criamos uma extensão customizada do TipTap que registra um nó inline/bloco ProseMirror associado ao `taskId`.
- O nó renderiza um componente React (`NodeViewRenderer`) exibindo a chave da tarefa (ex: `FLX-1`), título, prioridade e um dropdown interativo de status, permitindo alterar o estado da tarefa em tempo real sem sair da leitura do documento.

---

## 3. Consequências

- **Positivas:**
  - Zero dependências de servidores ou serviços em nuvem pagos.
  - 100% compatível com a stack existente (Node.js, Express, Socket.IO, PostgreSQL e Next.js).
  - Experiência de colaboração fluida com cursores coloridos e sem conflitos de merge.
  - Conformidade estrita com o Definition of Done da `SPEC.md`.

- **Mitigações:**
  - Para evitar consumo excessivo de memória na API, os `Y.Doc` mantidos em cache na memória do servidor são desalocados graciosamente após 5 minutos sem nenhum usuário ativo na sala `doc:{docId}`.
