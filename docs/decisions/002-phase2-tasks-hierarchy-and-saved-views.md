# ADR 002: Hierarquia de Subtarefas, Ordenação Lexicográfica e Visões Salvas (Fase 2)

- **Status:** Aceito
- **Data:** 2026-10-27

## Contexto

Na Fase 2 (Projetos e Tarefas — Visão Lista), a especificação (`SPEC.md` Seção 5.2) exige:
1. Subtarefas aninhadas em até 3 níveis de profundidade.
2. Numeração sequencial automática por projeto (`key`, ex.: `FLX-1`, `FLX-2`).
3. Ordenação persistente de tarefas dentro de cada status (`position`) preparatória para o Kanban da Fase 3.
4. Comentários ricos e anexos validados no backend.
5. Visões salvas (`SavedView`) pessoais ou compartilhadas por projeto.

## Decisões

1. **Validação de Profundidade de Subtarefas no Service (`tasks.service.ts`)**:
   - Tarefa raiz = nível 1; subtarefa direta = nível 2; subtarefa de nível 2 = nível 3.
   - Tentativas de criar ou mover uma tarefa para um `parentId` de nível >= 3 retornam `422 Unprocessable Entity` (`VALIDATION_ERROR`), impedindo ciclos e árvores profundas demais.
2. **Geração Transacional de Status Padrão e Chave Sequencial**:
   - Na criação de um `Project`, são gerados em transação 4 `WorkflowStatus` padrão (`A Fazer / TODO`, `Em Andamento / IN_PROGRESS`, `Em Revisão / REVIEW`, `Concluído / DONE`), garantindo que toda tarefa criada sem `statusId` explícito receba o status inicial.
   - A chave `key` (`${project.key}-${nextNumber}`) é calculada a partir do maior `number` do projeto.
3. **Validação Estrita de Anexos**:
   - Restrição por whitelist de `mimeType` (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `text/plain`, `text/csv`, `application/json`, `application/zip`) e tamanho máximo de `10 MB` (`10_485_760` bytes) tanto no schema Zod compartilhado (`@fluxo/shared`) quanto na camada de serviço.
4. **Detecção Cross-Bundle de `ZodError` no Middleware de Erros**:
   - Como os schemas vivem no pacote compilado `@fluxo/shared`, o `errorHandler` verifica `err instanceof ZodError || err?.name === 'ZodError'` para garantir retorno consistente `422 Unprocessable Entity` mesmo quando instâncias do Zod atravessam bundles distintos.
