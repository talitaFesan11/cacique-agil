# Implementation Plan — Fase 4: Gantt, Cronograma e Calendário

**Projeto:** Cacique Agil  
**Fase:** 04 — Gantt, Cronograma (Timeline) e Calendário  
**Responsável:** Agente da Fase 4  
**Status:** Aguardando Aprovação  

---

## 1. Visão Geral e Objetivos da Fase 4

A Fase 4 expande a plataforma **Cacique Agil** adicionando recursos avançados de planejamento temporal e gestão de capacidade, conforme especificado nas seções **3**, **6.4**, **6.5**, **8.2** e **13** da `SPEC.md`.

### Principais Entregáveis:

1. **Visão Gantt Interativa (SVG/CSS nativo)**:
   - Layout sincronizado com duas áreas: tabela de tarefas e metadados à esquerda; escala de tempo interativa com grid SVG/CSS à direita.
   - Barras de tarefas proporcionais às datas `startDate` e `dueDate`, com suporte a arrastar para mover no tempo e redimensionar para alterar duração.
   - Marcos (`isMilestone: true`) exibidos como losangos de marco temporal.
   - Progresso percentual (`progress: 0-100%`) renderizado visualmente dentro das barras.
   - Zoom temporal ajustável: **Dia**, **Semana**, **Mês** e **Trimestre**.
   - Marcador da data atual ("Linha do Hoje") e sombreamento diferenciado para fins de semana.
   - Exportação do gráfico Gantt em formato de imagem (PNG) via canvas/SVG nativo para compartilhamento executivo.

2. **Gestão de Dependências e Algoritmos de Grafo**:
   - Suporte aos 4 tipos formais de dependência: **FS** (*Finish-to-Start*), **SS** (*Start-to-Start*), **FF** (*Finish-to-Finish*) e **SF** (*Start-to-Finish*), com suporte a dias de deslocamento (`lagDays`).
   - Renderização de setas ortogonais e curvas em SVG conectando as tarefas de acordo com o tipo de relação.
   - **Detecção de Ciclos (DAG - Directed Acyclic Graph)**: algoritmo de ordenação topológica/DFS em `packages/shared` e no backend impedindo dependências circulares (rejeição com `422 Unprocessable Entity`).
   - **Cálculo do Caminho Crítico (CPM - Critical Path Method)**: determinação de Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF) e Total Float (Folga Total). Tarefas com folga zero (caminho crítico determinante da data final) destacadas com badge e cor de alerta no Gantt.
   - **Reagendamento Automático (*Auto-reschedule*)**: recálculo em cascata das datas de início e fim de tarefas dependentes ao alterar uma predecessora, com toggle de ativação/desativação pelo usuário.

3. **Linha de Base (*Baseline*)**:
   - Criação de snapshots de datas planejadas do projeto (`ProjectBaseline` e `TaskBaselineItem`).
   - Modo de comparação visual "Plano vs. Real": exibição da barra de baseline original abaixo da barra atual no Gantt, permitindo identificar desvios e atrasos imediatamente.

4. **Cronograma (*Timeline*) e Carga de Trabalho (*Workload*)**:
   - Visão de planejamento de alto nível agregada por Projeto e por Responsável.
   - Análise de capacidade da equipe: horas estimadas (`estimateMinutes`) vs. capacidade de trabalho diária/semanal por membro, com indicador e alertas visuais de sobrecarga de trabalho.

5. **Visão de Calendário (Mensal e Semanal)**:
   - Visualização das tarefas por prazo (`dueDate`) e intervalos de vigência (`startDate` até `dueDate`).
   - Alternância entre visualização Mensal e Semanal com navegação temporal (Anterior, Próximo, Hoje).
   - Chips coloridos por status e prioridade, com destaque para tarefas em atraso.
   - Arrastar tarefas para outro dia para reagendar a data de entrega.
   - Clique em qualquer tarefa abre o `TaskDetailDrawer` já integrado.

---

## 2. Estrutura de Pastas e Arquivos

```text
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── app.ts                                 # Registro das novas rotas de dependências e baselines
│   │   │   ├── openapi/
│   │   │   │   └── openapi.ts                         # Documentação dos endpoints de dependências, baselines e CPM
│   │   │   └── modules/
│   │   │       ├── tasks/
│   │   │       │   ├── dependencies.controller.ts     # [NOVO] Handlers para CRUD de dependências
│   │   │       │   ├── dependencies.service.ts        # [NOVO] Regras de negócio, validação de ciclos e auto-reschedule
│   │   │       │   ├── dependencies.repository.ts     # [NOVO] Operações Prisma para TaskDependency
│   │   │       │   ├── dependencies.routes.ts         # [NOVO] Rotas /api/v1/projects/:id/dependencies
│   │   │       │   ├── baselines.controller.ts        # [NOVO] Handlers para criar/listar/deletar baselines
│   │   │       │   ├── baselines.service.ts           # [NOVO] Snapshot de tarefas e comparação plano vs real
│   │   │       │   ├── baselines.repository.ts        # [NOVO] Operações Prisma para ProjectBaseline e TaskBaselineItem
│   │   │       │   ├── baselines.routes.ts            # [NOVO] Rotas /api/v1/projects/:id/baselines
│   │   │       │   └── tasks.service.ts               # Integração com auto-reschedule e cálculo de CPM
│   │   │       └── projects/
│   │   │           └── workload.service.ts            # [NOVO] Agregação de carga de trabalho e horas estimadas
│   │   └── tests/
│   │       ├── dependencies-cycle.test.ts             # [NOVO] Teste de detecção de ciclos e integridade de dependências
│   │       ├── cpm-calculation.test.ts                # [NOVO] Teste unitário e de integração do algoritmo CPM
│   │       └── baselines.test.ts                      # [NOVO] Teste de snapshot de baseline e comparação
│   │
│   └── web/
│       ├── src/
│       │   ├── lib/
│       │   │   └── api-client.ts                      # Métodos para dependências, baselines, auto-reschedule e workload
│       │   ├── components/
│       │   │   ├── gantt/                             # [NOVO] Módulo completo de Gantt
│       │   │   │   ├── TaskGanttView.tsx              # Componente principal do Gantt (Split view + toolbar)
│       │   │   │   ├── GanttToolbar.tsx               # Controles de zoom, filtro crítico, toggle baseline, exportação
│       │   │   │   ├── GanttTaskTable.tsx             # Tabela de tarefas à esquerda (nome, datas, duração, status)
│       │   │   │   ├── GanttTimelineHeader.tsx        # Régua de tempo (dias, semanas, meses)
│       │   │   │   ├── GanttGrid.tsx                  # Grade de fundo com finais de semana sombreados e linha do Hoje
│       │   │   │   ├── GanttTaskBar.tsx               # Barra de tarefa SVG/CSS, progresso, redimensionamento e marco
│       │   │   │   ├── GanttDependencyArrows.tsx      # Desenho vetorial SVG de conectores de dependência
│       │   │   │   ├── GanttDependencyDialog.tsx      # Modal para conectar tarefas e definir tipo (FS, SS, FF, SF, lag)
│       │   │   │   ├── GanttBaselineDialog.tsx        # Modal para salvar snapshot e selecionar baseline ativa
│       │   │   │   └── gantt.module.css               # Estilos otimizados de rolagem e sobreposição
│       │   │   ├── timeline/                          # [NOVO] Módulo de Cronograma e Carga de Trabalho
│       │   │   │   ├── TaskTimelineView.tsx           # Visão de alto nível agrupada por responsável/projeto
│       │   │   │   └── WorkloadView.tsx               # Painel de carga de trabalho com alertas de sobrecarga
│       │   │   ├── calendar/                          # [NOVO] Módulo de Calendário
│       │   │   │   ├── TaskCalendarView.tsx           # Calendário mensal e semanal
│       │   │   │   ├── CalendarMonthView.tsx          # Grid mensal com tarefas posicionadas por data
│       │   │   │   ├── CalendarWeekView.tsx           # Grid semanal com horários/dias
│       │   │   │   └── CalendarTaskChip.tsx           # Chip de tarefa interativo (clique abre drawer)
│       │   │   └── tasks/
│       │   │       └── TaskDetailDrawer.tsx           # Aba/seção de dependências vinculadas no drawer de tarefa
│       │   ├── app/
│       │   │   └── [locale]/
│       │   │       └── projects/
│       │   │           └── [projectId]/
│       │   │               └── page.tsx               # Habilitação das abas 'gantt' e 'calendar' e sync via URL
│       │   └── i18n/
│       │       └── messages/
│       │           ├── pt-BR.json                     # Traduções completas de Gantt, Dependências, CPM, Calendário
│       │           └── en.json                        # Traduções em inglês
│       ├── tests/
│       │   ├── TaskGanttView.test.tsx                 # [NOVO] Teste de renderização do Gantt, zoom e caminho crítico
│       │   └── TaskCalendarView.test.tsx              # [NOVO] Teste de navegação mensal/semanal do Calendário
│       └── e2e/
│           └── phase4-gantt-calendar.spec.ts          # [NOVO] Teste E2E Playwright de Gantt, dependências e calendário
│
├── packages/
│   └── shared/
│       └── src/
│           ├── schemas/
│           │   ├── dependency.ts                      # [NOVO] Schemas Zod para TaskDependency e CreateDependency
│           │   ├── baseline.ts                        # [NOVO] Schemas Zod para ProjectBaseline e TaskBaselineItem
│           │   ├── gantt.ts                           # [NOVO] Tipos e DTOs de CPM, zoom e reagendamento
│           │   └── workload.ts                        # [NOVO] DTOs de cálculo de capacidade e sobrecarga
│           ├── utils/
│           │   ├── cpm.ts                             # [NOVO] Algoritmo CPM e cálculo de folga total
│           │   ├── cycle-detector.ts                  # [NOVO] Detector de ciclos em grafos dirigidos (DAG)
│           │   └── date-math.ts                       # [NOVO] Utilitários puros de cálculo de dias úteis e datas
│           └── index.ts                               # Exportação pública de tipos e utilitários
│
└── prisma/
    ├── migrations/
    │   └── 20261028000000_phase4_baselines/           # [NOVO] Migration para tabelas de baseline
    ├── schema.prisma                                  # Adição dos modelos ProjectBaseline e TaskBaselineItem
    └── seed.ts                                        # Dados de seed com dependências, caminho crítico e datas no calendário
```

---

## 3. Schema Prisma Atualizado

O modelo de dados já possui `TaskDependency` com enums `DependencyType` (`FS`, `SS`, `FF`, `SF`). Para cumprir o requisito de Linha de Base (*Baseline* — Seção 6.4 e 6.36), criaremos uma nova migration Prisma adicionando os modelos `ProjectBaseline` e `TaskBaselineItem`:

```prisma
// -------------------------------------------------------------
// Linha de Base do Projeto (Baseline - Seção 6.4)
// -------------------------------------------------------------

model ProjectBaseline {
  id          String             @id @default(cuid())
  projectId   String
  name        String
  description String?
  createdAt   DateTime           @default(now())

  project     Project            @relation(fields: [projectId], references: [id], onDelete: Cascade)
  items       TaskBaselineItem[]

  @@index([projectId])
  @@map("project_baselines")
}

model TaskBaselineItem {
  id         String          @id @default(cuid())
  baselineId String
  taskId     String
  startDate  DateTime?
  dueDate    DateTime?
  createdAt  DateTime        @default(now())

  baseline   ProjectBaseline @relation(fields: [baselineId], references: [id], onDelete: Cascade)

  @@unique([baselineId, taskId])
  @@index([baselineId])
  @@index([taskId])
  @@map("task_baseline_items")
}
```

E no modelo `Project`:
```prisma
model Project {
  // ... campos existentes
  baselines   ProjectBaseline[]
}
```

---

## 4. Versões das Dependências e Conformidade

Conforme regra 8 do `AGENTS.md` e Seção 3 da `SPEC.md`, **não adicionaremos bibliotecas pesadas ou pagas para o Gantt**. Toda a renderização do Gantt, setas de dependência e grade temporal será implementada em **React + SVG nativo + CSS Modules** integrado ao tema MUI.

| Pacote | Versão | Justificativa |
|---|---|---|
| `@fluxo/shared` | `workspace:*` | Schemas Zod, algoritmos CPM, detecção de ciclos e utilitários de data |
| `@prisma/client` | `^6.4.1` | Acesso ao banco com novos modelos de baseline |
| `@mui/material` & `@mui/icons-material` | `^6.4.5` | Componentes visuais, botões, modais e ícones |
| `@tanstack/react-query` | `^5.66.7` | Cache e sincronização de dados de Gantt e Calendário |
| `next-intl` | `^3.26.4` | Internacionalização de todas as novas mensagens e datas |
| `vitest` | `^3.0.7` | Testes unitários do CPM, detector de ciclo e componentes |
| `playwright` | `^1.64.1` | Teste E2E da Fase 4 |

---

## 5. Algoritmos Principais (`packages/shared/src/utils/`)

### 5.1 Detecção de Ciclos no Grafo de Tarefas (`cycle-detector.ts`)
Antes de persistir uma nova dependência predecessor → sucessor no banco:
1. Monta o grafo direcionado existente com as dependências do projeto.
2. Adiciona temporariamente a aresta candidata `(predecessorId -> successorId)`.
3. Executa busca em profundidade (DFS) com detecção de nós em cinza (*visiting*) e preto (*visited*).
4. Se um nó em cinza for revisitado, um ciclo foi detectado: aborta a operação e retorna erro descritivo identificando o caminho do ciclo (ex.: `FLX-1 -> FLX-2 -> FLX-3 -> FLX-1`).

### 5.2 Critical Path Method (`cpm.ts`)
1. **Forward Pass**:
   - Calcula para cada tarefa seu *Early Start* (ES) e *Early Finish* (EF).
   - $EF = ES + \text{duração em dias}$.
   - Para sucessores com dependência FS: $ES_{\text{sucessor}} = \max(EF_{\text{predecessor}} + \text{lagDays})$.
2. **Backward Pass**:
   - Identifica a data máxima de término do projeto ($T_{\text{max}}$).
   - Calcula *Late Finish* (LF) e *Late Start* (LS).
   - $LS = LF - \text{duração em dias}$.
   - Para predecessores com dependência FS: $LF_{\text{predecessor}} = \min(LS_{\text{sucessor}} - \text{lagDays})$.
3. **Total Float & Critical Path**:
   - $\text{Float} = LS - ES = LF - EF$.
   - Tarefas com $\text{Float} \le 0$ pertencem ao **Caminho Crítico** (`isCritical: true`).

### 5.3 Auto-Reschedule (`dependencies.service.ts`)
- Quando uma tarefa tem sua data `startDate` ou `dueDate` alterada e o projeto tem auto-reschedule ativo:
  - Reprograma em cascata os sucessores respeitando os tipos de dependência (`FS`, `SS`, `FF`, `SF`) e `lagDays`, evitando que sucessores fiquem inconsistentes temporalmente em relação a seus predecessores.

---

## 6. Scripts Operacionais

Todos os scripts mantêm conformidade com os scripts existentes na raiz:
- `pnpm dev`: Sobe API e Web em paralelo.
- `pnpm typecheck`: Compila `@fluxo/shared` e valida TypeScript estrito (`strict: true`).
- `pnpm lint`: Executa ESLint em todo o monorepo.
- `pnpm test`: Executa suíte de testes unitários e de integração (Vitest).
- `pnpm test:e2e`: Executa testes de ponta a ponta com Playwright.
- `pnpm db:migrate`: Aplica as migrations do Prisma.
- `pnpm db:seed`: Popula banco com dados demonstrativos com dependências, marcos e datas.
- `pnpm docker:up`: Sobe toda a stack Docker localmente.

---

## 7. Estratégia de Testes e Critérios de Aceite

1. **Testes Unitários (`apps/api/tests/` e `packages/shared`)**:
   - Detecção de ciclo simples ($A \to B \to A$) e ciclo composto ($A \to B \to C \to A$).
   - Rejeição de auto-dependência ($A \to A$).
   - Cálculo de ES, EF, LS, LF e identificação precisa do caminho crítico pelo algoritmo CPM.
   - Cálculo de auto-reschedule com tipos de dependência `FS`, `SS`, `FF`, `SF` e `lagDays`.
   - Snapshot de Baseline e cálculo de desvio temporal (dias adiantados/atrasados).

2. **Testes de Componente (`apps/web/tests/`)**:
   - `TaskGanttView.test.tsx`: Renderização das barras, alternância de zoom (dia, semana, mês) e realce do caminho crítico.
   - `TaskCalendarView.test.tsx`: Renderização do calendário mensal e semanal, navegação entre meses e chips de tarefas.

3. **Teste E2E Playwright (`apps/web/e2e/phase4-gantt-calendar.spec.ts`)**:
   - Login no sistema e navegação para a aba **Gantt**.
   - Verificação das tarefas renderizadas com barra de tempo e marcos em formato de losango.
   - Verificação do destaque visual do caminho crítico.
   - Criação de uma dependência entre tarefas e validação da rejeição de dependência cíclica com mensagem amigável.
   - Salvamento e visualização de uma **Linha de Base**.
   - Navegação para a aba **Calendário** e verificação da distribuição mensal/semanal das tarefas por prazo.

---

## 8. Próximos Passos (Aguardando Aprovação)

Assim que este plano for aprovado:
1. Criar schemas no `packages/shared` (`dependency.ts`, `baseline.ts`, `gantt.ts`, `workload.ts`) e utilitários (`cpm.ts`, `cycle-detector.ts`).
2. Criar a migration Prisma para as tabelas `project_baselines` e `task_baseline_items`.
3. Implementar controllers, services e rotas na API para dependências, baselines e workload.
4. Atualizar o `prisma/seed.ts` com tarefas encadeadas, datas completas, marcos e estimativas de horas.
5. Implementar os componentes de interface no Web (`apps/web/src/components/gantt/`, `timeline/`, `calendar/`).
6. Atualizar a página `[projectId]/page.tsx` com as abas `gantt` e `calendar`.
7. Adicionar testes unitários, testes de integração e teste E2E Playwright.
8. Validar com `lint`, `typecheck`, `test`, subir containers Docker e capturar screenshots do navegador.
