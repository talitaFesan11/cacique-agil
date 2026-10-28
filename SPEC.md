# Spec: Plataforma de Gerenciamento e Fluxo de Projetos

_Especificação técnica e funcional para desenvolvimento agêntico no Google Antigravity. Versão 1.0._

---

## 0. Como usar esta spec no Antigravity

1. Salve este documento na raiz do repositório como `SPEC.md` (exporte como Markdown).
2. Crie também um `AGENTS.md` (ou regras do workspace) contendo a seção **12. Regras para os agentes**.
3. Abra o Agent Manager e inicie **um agente por fase** (seção 13), nunca o projeto inteiro de uma vez. Peça sempre: _"Leia SPEC.md, gere um Implementation Plan como artifact e aguarde minha aprovação antes de codar."_
4. Ao fim de cada fase, exija que o agente rode lint, typecheck, testes e valide a UI no navegador integrado, anexando screenshots como artifacts.
5. Agentes paralelos só devem trabalhar em pacotes/pastas distintos (ex.: um em `apps/api`, outro em `apps/web`) para evitar conflitos.

---

## 1. Visão geral

**Nome do projeto:** Cacique Agil.

**Resumo:** plataforma única de produtividade que une tarefas, documentos, quadros brancos, metas, gráficos, Gantt, cronograma e Kanban sobre os mesmos dados. O diferencial é a **integração entre módulos**: uma tarefa pode ser vista como card no Kanban, barra no Gantt, item na linha do tempo, ser citada em um documento, estar ligada a um objeto no quadro branco e contribuir para o progresso de uma meta.

**Problema que resolve:** equipes usam 5 a 8 ferramentas separadas (planilha, board, docs, whiteboard, OKRs) e perdem contexto entre elas.

**Princípios de produto**

- Uma entidade, várias visões (single source of truth).
- Colaboração em tempo real como padrão.
- Velocidade percebida: atualizações otimistas e navegação instantânea.
- Acessível (WCAG 2.1 AA) e responsivo.
- Português (pt-BR) como idioma padrão, com i18n preparado desde o início.

### 1.1 Personas

| Persona             | Necessidade principal                                         |
| ------------------- | ------------------------------------------------------------- |
| Gerente de projetos | Planejar cronograma, dependências, acompanhar riscos e prazos |
| Membro da equipe    | Ver suas tarefas, atualizar status, registrar tempo           |
| Líder / diretoria   | Acompanhar metas e dashboards consolidados                    |
| Cliente / convidado | Ver e comentar partes específicas, sem editar                 |

---

## 2. Escopo

### 2.1 Dentro do escopo (MVP + evolução)

- Autenticação, organizações (workspaces), times e permissões.
- Projetos, listas e tarefas (subtarefas, responsáveis, prazos, prioridade, etiquetas, anexos, comentários, checklists, dependências).
- Visões: Lista, Kanban, Gantt, Cronograma (timeline), Calendário.
- Documentos colaborativos com editor rico.
- Quadros brancos colaborativos.
- Metas (OKRs) com resultados-chave vinculados a tarefas e métricas.
- Dashboards e gráficos (burndown, velocidade, carga de trabalho, status).
- Notificações, busca global, atividade/auditoria.
- Colaboração em tempo real (presença, edição simultânea, atualização ao vivo).

### 2.2 Fora do escopo da v1

- App mobile nativo (a v1 é web responsiva/PWA).
- Faturamento e planos pagos.
- Integrações de terceiros (Slack, GitHub, Google Calendar): apenas deixar ganchos (webhooks) previstos.
- IA generativa embutida (planejado para v2).

---

## 3. Stack tecnológica (obrigatória)

| Camada                  | Tecnologia                                                            | Observações                                                                    |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Frontend                | **Next.js** (App Router) + **React** + **TypeScript**                 | Server Components onde fizer sentido; Client Components para áreas interativas |
| UI                      | **Material UI (MUI v6+)** + **MUI X** (DataGrid, Charts, DatePickers) | Tema customizado com tokens; modo claro/escuro                                 |
| Estilos                 | **CSS Modules** + tema MUI (`sx`/`styled` com moderação)              | CSS puro para layouts complexos (Gantt, quadro)                                |
| Backend                 | **Node.js + Express** + **TypeScript**                                | API REST versionada (`/api/v1`) + WebSocket                                    |
| ORM                     | **Prisma**                                                            | Migrations versionadas, seed de desenvolvimento                                |
| Banco                   | **PostgreSQL 16**                                                     | Índices, constraints e `jsonb` onde adequado                                   |
| Validação               | **Zod**                                                               | Schemas compartilhados entre front e back                                      |
| Estado/dados no cliente | **TanStack Query** + Zustand (UI local)                               | Cache, otimismo, invalidação                                                   |
| Tempo real              | **Socket.IO** (eventos) + **Yjs** (docs e whiteboard)                 | Persistência dos estados Yjs no Postgres                                       |
| Editor de docs          | **TipTap** (ProseMirror) com extensão de colaboração Yjs              | Menções, blocos de tarefa embutidos                                            |
| Quadro branco           | **tldraw** (ou Excalidraw) com sync Yjs                               | Formas, notas adesivas, conectores, cards de tarefa                            |
| Drag & drop             | **dnd-kit**                                                           | Kanban e reordenação                                                           |
| Gantt                   | Componente próprio em SVG/CSS (ver 6.4)                               | Sem dependência paga                                                           |
| Testes                  | **Vitest**, **Testing Library**, **Supertest**, **Playwright**        | Unitário, integração e E2E                                                     |
| Qualidade               | ESLint, Prettier, Husky, lint-staged, commitlint                      | Conventional Commits                                                           |
| Infra dev               | **Docker** + Docker Compose (perfis de dev e de produção, ver 4.1)    | Um comando sobe tudo                                                           |
| CI                      | GitHub Actions                                                        | lint, typecheck, test, build                                                   |

**Decisões de arquitetura**

- Next.js cuida **somente da interface** (SSR/RSC e rotas de página). Regras de negócio ficam na API Express, para manter o backend independente e testável.
- Monorepo com **pnpm workspaces** (ou npm workspaces) para compartilhar tipos e schemas Zod.
- Redis é opcional no MVP (usado para adapter do Socket.IO e filas quando houver mais de uma instância).

---

## 4. Arquitetura e estrutura do repositório

```text
.
├── SPEC.md
├── AGENTS.md
├── docker-compose.yml  # dev; produção: docker-compose.prod.yml (ver 4.1)
├── package.json            # workspaces
├── apps/
│   ├── web/                # Next.js (App Router)
│   │   ├── src/app/        # rotas: (auth), (app)/[workspace]/...
│   │   ├── src/components/ # ui/, kanban/, gantt/, docs/, whiteboard/, goals/
│   │   ├── src/features/   # hooks, queries e lógica por domínio
│   │   ├── src/lib/        # api client, socket, auth, i18n
│   │   └── src/theme/      # tema MUI, tokens, CSS globais
│   └── api/                # Express
│       ├── src/modules/    # auth, workspaces, projects, tasks, docs, boards, goals, reports...
│       │   └── <modulo>/   # routes.ts, controller.ts, service.ts, repository.ts, schemas.ts
│       ├── src/realtime/   # Socket.IO + servidor Yjs
│       ├── src/middleware/ # auth, rbac, validate, error, rate-limit
│       └── src/config/
├── packages/
│   ├── shared/             # schemas Zod, tipos, enums, utilitários de data
│   └── tsconfig/ eslint-config/
└── prisma/
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

**Camadas no backend:** `routes → controller (HTTP) → service (regra de negócio) → repository (Prisma)`. Controllers não acessam Prisma diretamente. Toda entrada é validada com Zod; todo erro passa pelo middleware central e retorna o formato padrão (seção 8.1).

**Fluxo de tempo real:** cliente conecta ao Socket.IO autenticado por JWT, entra em salas (`workspace:{id}`, `project:{id}`, `doc:{id}`, `board:{id}`). Mutações via REST emitem eventos (`task.updated`, `comment.created`...) que o cliente usa para invalidar/atualizar o cache do TanStack Query. Docs e quadros usam provider Yjs sobre WebSocket com persistência periódica do snapshot binário.

### 4.1 Docker: desenvolvimento e produção

O projeto roda em contêineres nos dois ambientes, com **os mesmos Dockerfiles multi-stage** (alvos `dev`, `build`, `migrate` e `prod`) e **dois arquivos Compose distintos**. O ambiente de desenvolvimento prioriza hot reload e ferramentas de apoio; o de produção prioriza imagens enxutas, seguras e imutáveis.

```text
├── docker-compose.yml          # desenvolvimento
├── docker-compose.prod.yml     # produção / self-host
├── .dockerignore
├── .env.example                # variáveis de desenvolvimento
├── .env.production.example     # variáveis de produção (sem segredos reais)
└── docker/
    ├── api.Dockerfile
    ├── web.Dockerfile
    └── nginx/nginx.conf
```

#### Docker de desenvolvimento (`docker-compose.yml`)

**Requisitos**

- Um comando (`pnpm docker:dev`) sobe toda a stack: Postgres, Mailpit, MinIO, API e Web, com dados de seed aplicados na primeira execução.
- **Hot reload** em `apps/web` (Next.js dev server) e `apps/api` (`tsx watch`), com o código montado por _bind mount_.
- `node_modules` em **volumes nomeados** (não montar do host), evitando conflito de binários entre sistemas operacionais e lentidão em macOS/Windows.
- Serviços de apoio com _healthcheck_; a API só inicia depois que o Postgres estiver saudável.
- Redis e Prisma Studio ficam em _profiles_ opcionais (`--profile redis`, `--profile tools`).
- Portas expostas ao host: Web 3000, API 4000, Postgres 5432, Mailpit 8025 (UI) e 1025 (SMTP), MinIO 9000 e 9001 (console).
- Credenciais de desenvolvimento ficam no `.env.example`; nunca reutilizadas em produção.

```yaml
name: fluxopro-dev

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: fluxo
      POSTGRES_PASSWORD: fluxo
      POSTGRES_DB: fluxo
    ports: ['5432:5432']
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U fluxo -d fluxo']
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7-alpine
    profiles: [redis]
    ports: ['6379:6379']

  mailpit:
    image: axllent/mailpit
    ports: ['8025:8025', '1025:1025']

  minio:
    image: minio/minio
    command: server /data --console-address ':9001'
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ['9000:9000', '9001:9001']
    volumes: [miniodata:/data]

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
      target: dev
    env_file: .env
    environment:
      DATABASE_URL: postgresql://fluxo:fluxo@postgres:5432/fluxo
    ports: ['4000:4000']
    volumes:
      - .:/workspace
      - api_node_modules:/workspace/apps/api/node_modules
      - root_node_modules:/workspace/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c 'pnpm prisma migrate deploy && pnpm --filter @fluxo/api dev'

  web:
    build:
      context: .
      dockerfile: docker/web.Dockerfile
      target: dev
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api/v1
      WATCHPACK_POLLING: 'true'
    ports: ['3000:3000']
    volumes:
      - .:/workspace
      - web_node_modules:/workspace/apps/web/node_modules
      - root_node_modules:/workspace/node_modules
    depends_on: [api]

  prisma-studio:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
      target: dev
    profiles: [tools]
    command: pnpm prisma studio --port 5555 --browser none
    ports: ['5555:5555']

volumes:
  pgdata:
  miniodata:
  api_node_modules:
  web_node_modules:
  root_node_modules:
```

> O YAML acima é um ponto de partida. O agente deve ajustá-lo à estrutura real do monorepo (nomes de pacotes, gerenciador de pacotes) e validar com `docker compose config`.

#### Docker de produção (`docker-compose.prod.yml` + imagens)

**Requisitos das imagens (`api.Dockerfile` e `web.Dockerfile`)**

- **Multi-stage**: `deps` → `build` → `prod`. A imagem final contém apenas o necessário para executar (sem código-fonte, sem devDependencies, sem ferramentas de build).
- Base `node:22-alpine` com versão fixada (tag, idealmente também digest); `tini` como processo init para encerramento gracioso (`SIGTERM`).
- Execução como **usuário não root** (`USER node`), sistema de arquivos de leitura apenas sempre que possível, `HEALTHCHECK` em `/health` (API) e `/` (Web).
- Cache de dependências com BuildKit (`--mount=type=cache`) e `.dockerignore` completo (`node_modules`, `.git`, `.next`, `dist`, `.env*`, testes).
- **API**: `pnpm --filter @fluxo/api deploy --prod` para gerar um pacote enxuto; o Prisma Client gerado e os binários de engine devem estar na imagem final (o agente valida subindo a imagem).
- **Web**: Next.js com `output: 'standalone'` (e `outputFileTracingRoot` apontando para a raiz do monorepo), copiando só `.next/standalone`, `.next/static` e `public`.
- **Imagem agnóstica de ambiente**: o front chama a API por caminho relativo (`/api/v1`) atrás do proxy, evitando variáveis `NEXT_PUBLIC_*` fixadas em tempo de build. Segredos nunca entram na imagem (nem como `ARG`).
- **Migrations** em um alvo separado (`migrate`), executado como serviço _one-shot_ antes da API (`prisma migrate deploy`). A API nunca roda migrations ao iniciar.
- Imagens com tags `:<git-sha>` e `:<versão>`; produção nunca usa `latest`.

```dockerfile
# docker/api.Dockerfile (esboço)
# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && apk add --no-cache libc6-compat openssl
WORKDIR /workspace

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY prisma prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
RUN pnpm prisma generate
CMD ["pnpm", "--filter", "@fluxo/api", "dev"]

FROM dev AS build
RUN pnpm --filter @fluxo/shared build && pnpm --filter @fluxo/api build
RUN pnpm --filter @fluxo/api deploy --prod /out

FROM build AS migrate
CMD ["pnpm", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS prod
RUN apk add --no-cache openssl tini wget
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:4000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
```

**Requisitos do Compose de produção**

- Usa **imagens publicadas** (`image:`), não `build:` nem _bind mounts_.
- Serviços: `proxy` (Nginx), `web`, `api`, `migrate` (one-shot), `postgres` e `redis` (opcional, _profile_).
- Apenas o `proxy` publica portas (80/443). `web`, `api` e `postgres` ficam em rede interna (`backend`), sem exposição ao host.
- `restart: unless-stopped`, _healthchecks_, limites de CPU/memória e rotação de logs (`json-file` com `max-size`).
- Configuração via `.env.production` (arquivo fora do Git) ou **Docker secrets**; `DATABASE_URL`, `JWT_SECRET` e chaves de storage jamais no repositório.
- Postgres em contêiner com volume persistente é aceitável para _self-host_; em nuvem, **recomenda-se banco gerenciado** (e remover o serviço `postgres` do Compose).
- O Nginx faz TLS (certificados montados ou Let's Encrypt via Caddy/Traefik, conforme a hospedagem), compressão, cabeçalhos de segurança e **upgrade de WebSocket** para `/socket.io` e para o provider Yjs.
- **Backups**: rotina documentada de `pg_dump` agendado e teste de restauração.

```yaml
# docker-compose.prod.yml (esboço)
name: fluxopro

services:
  proxy:
    image: nginx:1.27-alpine
    ports: ['80:80', '443:443']
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [web, api]
    networks: [frontend, backend]
    restart: unless-stopped

  web:
    image: ghcr.io/ORG/fluxopro-web:${TAG}
    env_file: .env.production
    expose: ['3000']
    networks: [backend]
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost:3000/']
      interval: 15s

  api:
    image: ghcr.io/ORG/fluxopro-api:${TAG}
    env_file: .env.production
    expose: ['4000']
    networks: [backend]
    restart: unless-stopped
    depends_on:
      migrate:
        condition: service_completed_successfully
    deploy:
      resources:
        limits: { cpus: '1.0', memory: 768M }

  migrate:
    image: ghcr.io/ORG/fluxopro-migrate:${TAG}
    env_file: .env.production
    networks: [backend]
    restart: 'no'
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    env_file: .env.production
    volumes: [pgdata:/var/lib/postgresql/data]
    networks: [backend]
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
      interval: 10s

networks:
  frontend:
  backend:
    internal: true

volumes:
  pgdata:
```

```nginx
# docker/nginx/nginx.conf (esboço)
upstream web { server web:3000; }
upstream api { server api:4000; }

server {
  listen 80;
  client_max_body_size 25m;

  location /api/ {
    proxy_pass http://api;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /socket.io/ {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_read_timeout 3600s;
  }

  location / {
    proxy_pass http://web;
    proxy_set_header Host $host;
  }
}
```

> `trust proxy` deve estar habilitado no Express para que IP, protocolo e _rate limiting_ funcionem atrás do Nginx.

#### Scripts e comandos

| Script (raiz)            | O que faz                                                             |
| ------------------------ | --------------------------------------------------------------------- |
| `pnpm docker:dev`        | `docker compose up --build` do ambiente de desenvolvimento            |
| `pnpm docker:dev:down`   | Derruba o ambiente (`-v` apaga volumes de dados)                      |
| `pnpm docker:prod:build` | Constrói as imagens `web`, `api` e `migrate` com `docker buildx bake` |
| `pnpm docker:prod:up`    | `docker compose -f docker-compose.prod.yml up -d`                     |
| `pnpm docker:prod:logs`  | Acompanha logs dos serviços de produção                               |

#### CI/CD e verificação de imagens

- Pipeline (GitHub Actions) com `docker buildx`, cache de camadas e publicação no **GitHub Container Registry**, com tag por `git sha` e por versão.
- Varredura de vulnerabilidades (**Trivy**) com falha em severidade `HIGH`/`CRITICAL`, e **Hadolint** nos Dockerfiles.
- Job de _smoke test_: sobe o Compose de produção no CI, aguarda _healthchecks_ e executa um teste E2E mínimo (login e criação de tarefa) contra o proxy.
- Deploy com _rollback_ simples: reimplantar a tag anterior (`TAG=<sha-anterior>`); migrations devem ser **compatíveis com a versão anterior** (estratégia _expand/contract_).

**Critérios de aceite do Docker**

- `pnpm docker:dev` em máquina limpa deixa a aplicação acessível em `localhost:3000` em até 5 minutos, com hot reload funcionando.
- A imagem de produção da API tem menos de 300 MB e a do Web menos de 250 MB; ambas rodam sem root e passam nos _healthchecks_.
- `docker compose -f docker-compose.prod.yml up -d` sobe a stack completa, executa as migrations uma vez e responde em `/` e `/api/v1/health` pelo proxy.
- Nenhum segredo presente nas imagens (`docker history` e varredura limpos).

---

## 5. Modelo de dados (Prisma)

Convenções: ids `cuid()`, `createdAt`/`updatedAt` em tudo, exclusão lógica (`deletedAt`) em tarefas, docs e projetos, `workspaceId` em toda tabela de domínio (isolamento multi-tenant), índices em chaves estrangeiras e campos de filtro.

```prisma
enum WorkspaceRole { OWNER ADMIN MEMBER GUEST }
enum ProjectStatus { PLANNING ACTIVE ON_HOLD COMPLETED ARCHIVED }
enum TaskPriority { NONE LOW MEDIUM HIGH URGENT }
enum StatusCategory { TODO IN_PROGRESS DONE }
enum DependencyType { FS SS FF SF }  // finish-start, start-start...
enum GoalStatus { ON_TRACK AT_RISK OFF_TRACK ACHIEVED }
enum KeyResultType { NUMBER PERCENT CURRENCY BOOLEAN TASKS }

model User {
  id String @id @default(cuid())
  email String @unique
  name String
  avatarUrl String?
  passwordHash String
  locale String @default("pt-BR")
  createdAt DateTime @default(now())
  memberships Membership[]
}

model Workspace {
  id String @id @default(cuid())
  name String
  slug String @unique
  memberships Membership[]
  projects Project[]
}

model Membership {
  id String @id @default(cuid())
  userId String
  workspaceId String
  role WorkspaceRole @default(MEMBER)
  @@unique([userId, workspaceId])
}

model Project {
  id String @id @default(cuid())
  workspaceId String
  name String
  key String                    // prefixo, ex.: "FLX" -> FLX-12
  description String?
  status ProjectStatus @default(PLANNING)
  color String?
  startDate DateTime?
  dueDate DateTime?
  ownerId String
  deletedAt DateTime?
  statuses WorkflowStatus[]
  tasks Task[]
  @@unique([workspaceId, key])
}

model WorkflowStatus {           // colunas do Kanban, configuráveis por projeto
  id String @id @default(cuid())
  projectId String
  name String
  category StatusCategory
  position Float                 // ordenação fracionária
  wipLimit Int?
}

model Task {
  id String @id @default(cuid())
  projectId String
  number Int                     // sequencial por projeto
  title String
  description Json?              // conteúdo rico (TipTap JSON)
  statusId String
  priority TaskPriority @default(NONE)
  parentId String?               // subtarefas
  assigneeIds String[]           // ou tabela TaskAssignee
  startDate DateTime?
  dueDate DateTime?
  estimateMinutes Int?
  progress Int @default(0)       // 0-100
  isMilestone Boolean @default(false)
  position Float                 // ordem dentro da coluna/lista
  deletedAt DateTime?
  @@unique([projectId, number])
  @@index([projectId, statusId, position])
}

model TaskDependency {
  id String @id @default(cuid())
  predecessorId String
  successorId String
  type DependencyType @default(FS)
  lagDays Int @default(0)
  @@unique([predecessorId, successorId])
}

model Label { id String @id @default(cuid()) workspaceId String name String color String }
model TaskLabel { taskId String labelId String @@id([taskId, labelId]) }
model Checklist { id String @id @default(cuid()) taskId String title String items ChecklistItem[] }
model ChecklistItem { id String @id @default(cuid()) checklistId String text String done Boolean @default(false) position Float }
model Comment { id String @id @default(cuid()) taskId String? docId String? authorId String body Json createdAt DateTime @default(now()) }
model Attachment { id String @id @default(cuid()) taskId String fileName String mimeType String size Int storageKey String }
model TimeEntry { id String @id @default(cuid()) taskId String userId String startedAt DateTime minutes Int note String? }

model Document {
  id String @id @default(cuid())
  workspaceId String
  projectId String?
  parentId String?               // hierarquia de páginas
  title String
  icon String?
  yjsState Bytes?                // snapshot Yjs
  contentJson Json?              // espelho para busca e exportação
  deletedAt DateTime?
}

model Whiteboard {
  id String @id @default(cuid())
  workspaceId String
  projectId String?
  title String
  yjsState Bytes?
  thumbnailUrl String?
}

model Goal {
  id String @id @default(cuid())
  workspaceId String
  title String
  description String?
  ownerId String
  periodStart DateTime
  periodEnd DateTime
  status GoalStatus @default(ON_TRACK)
  parentGoalId String?           // metas em cascata
  keyResults KeyResult[]
}

model KeyResult {
  id String @id @default(cuid())
  goalId String
  title String
  type KeyResultType
  startValue Float @default(0)
  targetValue Float
  currentValue Float @default(0)
  linkedTaskIds String[]         // quando type = TASKS, progresso = tarefas concluídas / total
  checkIns KeyResultCheckIn[]
}

model KeyResultCheckIn { id String @id @default(cuid()) keyResultId String value Float note String? createdAt DateTime @default(now()) }

model Notification { id String @id @default(cuid()) userId String type String payload Json readAt DateTime? createdAt DateTime @default(now()) }
model ActivityLog { id String @id @default(cuid()) workspaceId String actorId String entity String entityId String action String diff Json? createdAt DateTime @default(now()) }
model SavedView { id String @id @default(cuid()) projectId String ownerId String type String name String config Json shared Boolean @default(false) }

// Vínculos genéricos entre entidades (tarefa <-> doc <-> quadro <-> meta)
model EntityLink { id String @id @default(cuid()) workspaceId String fromType String fromId String toType String toId String @@index([fromType, fromId]) @@index([toType, toId]) }
```

> O agente deve expandir este esboço em um `schema.prisma` completo, com relações, `onDelete`, índices e `@@map` conforme necessário. Pode propor ajustes justificados no Implementation Plan.

---

## 6. Requisitos funcionais por módulo

### 6.1 Autenticação e workspaces

- Cadastro, login, logout, refresh token (access JWT curto + refresh em cookie `httpOnly`), recuperação de senha por e-mail.
- Criar/entrar em workspace; convites por e-mail com papel definido.
- Papéis: **Owner, Admin, Member, Guest**. Guest só acessa itens compartilhados explicitamente.
- **Critério de aceite:** usuário de um workspace nunca consegue ler ou escrever dados de outro (testes automatizados obrigatórios).

### 6.2 Projetos e tarefas

- CRUD de projetos, com chave (`FLX`) e numeração sequencial de tarefas (`FLX-12`).
- Tarefa: título, descrição rica, status, prioridade, responsáveis, datas de início e entrega, estimativa, progresso, etiquetas, subtarefas (até 3 níveis), checklists, anexos, comentários com menções (`@`), dependências, marco (milestone), registro de tempo.
- Edição rápida inline e painel lateral de detalhes (drawer) sem perder o contexto da visão atual.
- Filtros, ordenação, agrupamento e busca; **visões salvas** por usuário ou compartilhadas.
- Ações em massa (mudar status, responsável, mover de projeto).
- Atalhos de teclado (`C` criar, `/` buscar, `Esc` fechar, `?` ajuda).
- **Critério de aceite:** alterar uma tarefa em qualquer visão reflete nas demais em menos de 1 s para todos os usuários conectados.

### 6.3 Kanban

- Colunas = `WorkflowStatus` configuráveis (criar, renomear, reordenar, limite WIP, cor).
- Cards arrastáveis entre colunas e dentro delas (dnd-kit), com ordenação fracionária (`position` Float) para evitar reindexação em massa.
- Swimlanes por responsável, prioridade ou etiqueta.
- Card mostra: chave, título, avatares, prazo (com destaque de atraso), prioridade, progresso de checklist, contagem de comentários/anexos.
- Atualização otimista com rollback em caso de erro; teclado acessível (mover card via teclado com anúncio para leitores de tela).
- **Critério de aceite:** board com 500 cards mantém 60 fps no arrasto (virtualização por coluna).

### 6.4 Gantt

- Barras por tarefa com data de início/fim, **arrastar para mover** e **redimensionar** para alterar duração.
- Dependências (FS, SS, FF, SF) com setas; ao mover um predecessor, sucessores são reprogramados automaticamente (opção ligar/desligar).
- Marcos (losango), barra de progresso, hierarquia expansível (tarefa → subtarefas, agrupamento por resumo).
- Zoom: dia, semana, mês, trimestre. Linha do "hoje". Fins de semana e feriados configuráveis (calendário de trabalho).
- **Caminho crítico** destacado (algoritmo CPM no backend ou em `packages/shared`).
- Detecção de ciclos de dependência (rejeitar com mensagem clara).
- **Linha de base (baseline):** salvar e comparar plano vs. real.
- Exportação para PNG/PDF.
- Implementação: layout em duas áreas sincronizadas (tabela de tarefas à esquerda, escala de tempo à direita), render em SVG/CSS com virtualização de linhas e colunas.
- **Critério de aceite:** 1.000 tarefas renderizam e rolam suavemente; testes unitários cobrem CPM, reagendamento e detecção de ciclos.

### 6.5 Cronograma (Timeline)

- Visão mais leve que o Gantt, orientada a **planejamento de alto nível**: faixas por projeto, equipe ou responsável, mostrando épicos, marcos e entregas.
- Visão de **carga de trabalho** por pessoa (horas estimadas vs. capacidade), com alerta de sobrealocação.
- Arrastar para replanejar; agrupar por projeto, pessoa ou etiqueta.
- **Calendário** mensal/semanal como visão complementar (tarefas por prazo).

### 6.6 Documentos

- Editor rico em blocos (TipTap): títulos, listas, tabelas, checklists, código, citações, imagens, divisores, callouts.
- Comando `/` para inserir blocos; **menção a pessoas, tarefas, metas e outros documentos** (`@`, `#FLX-12`).
- **Bloco de tarefa embutido** (mostra status e permite alterar) e bloco de visão (mini Kanban/lista filtrada).
- Edição colaborativa em tempo real (Yjs) com cursores e presença.
- Hierarquia de páginas (árvore lateral), favoritos, histórico de versões e restauração.
- Comentários em trechos selecionados.
- Exportar para Markdown e PDF; modelos (templates) de documento: ata de reunião, PRD, retrospectiva.
- **Critério de aceite:** dois usuários editando o mesmo parágrafo convergem sem perda de dados; reconexão após queda de rede sincroniza o estado.

### 6.7 Quadros brancos

- Canvas infinito com zoom/pan; formas, setas/conectores, texto, notas adesivas, desenho livre, imagens, frames.
- Colaboração em tempo real com cursores e seleção de outros usuários.
- **Cards de tarefa no quadro:** arrastar uma tarefa para o canvas cria um card vinculado (`EntityLink`); alterações na tarefa refletem no card.
- Converter nota adesiva em tarefa; converter seleção de notas em lista de tarefas.
- Modelos: brainstorming, mapa mental, fluxograma, retrospectiva.
- Miniatura gerada para a listagem; exportar PNG/SVG.

### 6.8 Metas (OKRs)

- Meta (Objective) com período, responsável, status e meta-pai (alinhamento em cascata).
- Resultados-chave dos tipos: número, percentual, moeda, booleano e **baseado em tarefas** (progresso calculado automaticamente a partir das tarefas vinculadas).
- Check-ins periódicos com valor e comentário; histórico em gráfico de linha.
- Progresso da meta = média ponderada dos KRs; status sugerido automaticamente (no ritmo / em risco / fora do ritmo) com base no tempo decorrido vs. progresso.
- Visão em árvore (alinhamento) e visão em lista por período.

### 6.9 Dashboards e gráficos

- Dashboards configuráveis por workspace ou projeto, com widgets reposicionáveis (grid).
- Widgets mínimos: status das tarefas (pizza/rosca), tarefas por responsável (barras), **burndown/burnup**, **velocidade**, tarefas atrasadas, linha do tempo de marcos, progresso de metas, carga de trabalho, tempo registrado.
- Filtros globais (período, projeto, responsável) aplicados a todos os widgets.
- Biblioteca: **MUI X Charts**. Exportar widget em CSV/PNG.
- Agregações calculadas no backend com SQL eficiente (`groupBy`/`$queryRaw`) e cache curto.

### 6.10 Transversais

- **Busca global** (Ctrl/Cmd+K): tarefas, docs, quadros, metas, pessoas (Postgres full-text com `tsvector` + `pg_trgm`).
- **Notificações:** in-app (tempo real) e e-mail; preferências por tipo (menção, atribuição, prazo próximo, comentário).
- **Atividade/auditoria** por entidade e por workspace.
- **Importar/exportar** CSV de tarefas.
- **Lixeira** com restauração por 30 dias.

---

## 7. UI/UX e design system

- **Layout:** barra lateral recolhível (workspace, projetos, docs, quadros, metas, dashboards) + barra superior (busca, notificações, perfil) + área de conteúdo com abas de visão (Lista | Kanban | Gantt | Cronograma | Calendário | Docs | Quadro).
- **Tema MUI** centralizado em `apps/web/src/theme`: paleta, tipografia, espaçamento (grid de 8 px), raios, sombras, `components` overrides. Suporte a claro/escuro com persistência e respeito a `prefers-color-scheme`.
- **CSS Modules** para componentes com layout próprio (Gantt, canvas, Kanban); variáveis CSS (`--color-*`, `--space-*`) derivadas do tema para evitar duplicação.
- **Estados obrigatórios** em toda tela: carregando (skeleton), vazio (ilustração + CTA), erro (mensagem + tentar novamente), offline.
- **Responsividade:** breakpoints MUI; em mobile, drawer de navegação e visões simplificadas (Kanban com scroll horizontal, Gantt em modo leitura).
- **Acessibilidade:** navegação por teclado, foco visível, `aria-*`, contraste AA, `prefers-reduced-motion`.
- **Internacionalização:** `next-intl` com `pt-BR` e `en`; datas e números via `Intl`.

---

## 8. API

- Base: `/api/v1`. REST + JSON. Autenticação `Authorization: Bearer <JWT>`.
- Documentação OpenAPI gerada a partir dos schemas Zod (`zod-to-openapi`), servida em `/api/docs`.
- Paginação por cursor (`?cursor=&limit=`), filtros e ordenação por query string.
- Idempotência em criação via header `Idempotency-Key` (opcional).

### 8.1 Formato de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [{ "path": "title", "message": "Obrigatório" }],
    "requestId": "..."
  }
}
```

### 8.2 Endpoints principais (resumo)

| Recurso                  | Rotas                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Auth                     | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`    |
| Workspaces               | `GET/POST /workspaces`, `GET/PATCH/DELETE /workspaces/:id`, `POST /workspaces/:id/invites`, `GET /workspaces/:id/members` |
| Projetos                 | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `GET/POST /projects/:id/statuses`                                 |
| Tarefas                  | `GET/POST /projects/:id/tasks`, `GET/PATCH/DELETE /tasks/:id`, `POST /tasks/:id/move`, `POST /tasks/bulk`                 |
| Dependências             | `POST /tasks/:id/dependencies`, `DELETE /dependencies/:id`, `GET /projects/:id/schedule` (Gantt + caminho crítico)        |
| Comentários/Anexos/Tempo | `/tasks/:id/comments`, `/tasks/:id/attachments`, `/tasks/:id/time-entries`                                                |
| Documentos               | `GET/POST /documents`, `GET/PATCH/DELETE /documents/:id`, `GET /documents/:id/versions`                                   |
| Quadros                  | `GET/POST /whiteboards`, `GET/PATCH/DELETE /whiteboards/:id`                                                              |
| Metas                    | `GET/POST /goals`, `GET/PATCH/DELETE /goals/:id`, `POST /key-results/:id/check-ins`                                       |
| Relatórios               | `GET /reports/burndown`, `/reports/velocity`, `/reports/workload`, `/reports/status-distribution`                         |
| Busca                    | `GET /search?q=`                                                                                                          |
| Notificações             | `GET /notifications`, `POST /notifications/read`                                                                          |

### 8.3 Eventos de tempo real

`task.created|updated|moved|deleted`, `comment.created`, `goal.updated`, `notification.created`, `presence.update`. Cada evento carrega `entityId`, `projectId`, `actorId` e o mínimo de dados para atualizar o cache.

---

## 9. Segurança

- Senhas com **argon2** (ou bcrypt custo ≥ 12). Refresh tokens rotativos e revogáveis.
- **RBAC** em middleware: toda rota declara a permissão exigida; checagem de pertencimento ao workspace em **todo** acesso a recurso (nunca confiar em ids vindos do cliente).
- Validação Zod em todas as entradas; sanitização do conteúdo rico (prevenção de XSS).
- `helmet`, CORS restrito por ambiente, rate limiting (login e rotas de escrita), proteção CSRF para cookies.
- Upload: limite de tamanho, lista de tipos permitidos, nomes aleatórios, armazenamento em S3 compatível (MinIO em dev).
- Segredos somente em variáveis de ambiente; `.env.example` versionado, `.env` ignorado.
- Logs estruturados (pino) sem dados sensíveis; `requestId` em toda requisição.
- Conformidade com **LGPD**: exportação e exclusão de dados do usuário.

---

## 10. Requisitos não funcionais

| Área                | Meta                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ |
| Performance API     | p95 < 300 ms nas rotas de leitura comuns                                             |
| Performance web     | LCP < 2,5 s; navegação entre visões < 200 ms (cache)                                 |
| Escala (v1)         | 10 mil tarefas por projeto; 200 usuários simultâneos por workspace                   |
| Disponibilidade     | Health checks (`/health`, `/ready`), shutdown gracioso                               |
| Observabilidade     | Logs estruturados, métricas básicas, tratamento de erros no front (error boundaries) |
| Cobertura de testes | ≥ 80% em services e utilitários; E2E dos fluxos críticos                             |
| Compatibilidade     | Últimas 2 versões de Chrome, Edge, Firefox, Safari                                   |

---

## 11. Estratégia de testes

- **Unitários (Vitest):** services, cálculo CPM, reagendamento, progresso de metas, utilitários de data, ordenação fracionária.
- **Integração (Supertest + Postgres de teste via Docker):** todas as rotas, incluindo autorização e isolamento entre workspaces.
- **Componentes (Testing Library):** cards, drawer de tarefa, formulários, filtros.
- **E2E (Playwright):** cadastro → criar workspace → projeto → tarefa → mover no Kanban → ver no Gantt → criar doc → criar meta; colaboração com dois contextos de navegador.
- **Acessibilidade:** `axe` nos E2E das telas principais.
- Seeds determinísticos para testes e demonstração (workspace de exemplo com 3 projetos, 150 tarefas, 2 docs, 1 quadro, 2 metas).

---

## 12. Regras para os agentes (copiar para `AGENTS.md`)

1. **Planejar antes de codar:** gerar Implementation Plan e aguardar aprovação em mudanças estruturais (schema, dependências novas, arquitetura).
2. **TypeScript estrito** (`strict: true`, sem `any` sem justificativa em comentário). Tipos e schemas compartilhados vivem em `packages/shared`.
3. **Não duplicar regra de negócio** no front: o front exibe e valida UX; o back decide.
4. **Camadas do backend** conforme seção 4; sem acesso ao Prisma em controllers.
5. **Migrations:** nunca editar migration já aplicada; criar nova. Rodar `prisma migrate dev` e atualizar o seed.
6. **UI:** usar MUI e o tema central; nada de cores/espaçamentos "mágicos"; CSS Modules para layouts específicos; todos os estados (loading/vazio/erro) implementados.
7. **Acessibilidade e i18n** desde o primeiro componente (textos via dicionário, nunca strings fixas).
8. **Dependências:** preferir as listadas na seção 3; justificar qualquer biblioteca nova (licença compatível, manutenção, tamanho).
9. **Commits** no padrão Conventional Commits; PRs pequenos por funcionalidade.
10. **Definition of Done de cada tarefa:** `lint`, `typecheck`, testes unitários/integração passando, E2E da funcionalidade, verificação visual no navegador com screenshot, documentação atualizada (README/OpenAPI).
11. **Segurança:** nunca commitar segredos; sempre checar autorização por workspace; nunca confiar em dados do cliente.
12. **Ao encontrar ambiguidade**, registrar a decisão em `docs/decisions/NNN-titulo.md` (ADR curto) em vez de assumir silenciosamente.

Scripts esperados no `package.json` raiz: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `db:studio`, `docker:up`.

---

## 13. Plano de entrega por fases

Cada fase = um agente/conversa no Antigravity, com artifact de plano aprovado, testes e screenshots ao final.

### Fase 0: Fundação

- Monorepo, TypeScript, ESLint/Prettier/Husky, Docker de desenvolvimento (Compose com hot reload, Postgres, Mailpit, MinIO) e Dockerfiles multi-stage de produção (seção 4.1), CI.
- Prisma com schema inicial, migrations, seed; Express com middleware base, `/health`, OpenAPI; Next.js com tema MUI, layout base e i18n.
- **Aceite:** `pnpm docker:up && pnpm dev` sobe tudo; pipeline de CI verde.

### Fase 1: Identidade e workspaces

- Autenticação completa, convites, papéis, RBAC, tela de login/cadastro, seletor de workspace.
- **Aceite:** testes de isolamento entre workspaces passando.

### Fase 2: Projetos e tarefas (visão Lista)

- CRUD de projetos e tarefas, drawer de detalhes, comentários, checklists, etiquetas, anexos, filtros e visões salvas, busca básica.
- **Aceite:** fluxo E2E criar → editar → comentar → filtrar.

### Fase 3: Kanban e tempo real

- Kanban com dnd-kit, colunas configuráveis, WIP, swimlanes; Socket.IO com atualização ao vivo e presença.
- **Aceite:** dois navegadores veem o mesmo movimento em < 1 s.

### Fase 4: Gantt, cronograma e calendário

- Dependências, CPM, reagendamento, baseline, zoom, cronograma por equipe e carga de trabalho, calendário.
- **Aceite:** 1.000 tarefas fluidas; testes de CPM e ciclos.

### Fase 5: Documentos

- TipTap + Yjs, hierarquia, menções, blocos de tarefa, versões, templates, exportação.
- **Aceite:** edição simultânea convergente e resiliente a reconexão.

### Fase 6: Quadros brancos

- tldraw + Yjs, cards de tarefa vinculados, conversão nota → tarefa, templates, exportação.

### Fase 7: Metas e dashboards

- OKRs com KRs de tarefas e check-ins; dashboards com widgets e filtros globais; relatórios (burndown, velocidade, carga).

### Fase 8: Polimento e entrega

- Notificações e e-mails, busca global (Ctrl+K), auditoria, lixeira, importar/exportar CSV, acessibilidade, performance, PWA, documentação de deploy (Compose de produção, migrations, backups e rollback).
- **Aceite:** checklist de NFRs (seção 10) cumprido; auditoria de acessibilidade sem violações críticas.

---

## 14. Prompt inicial sugerido para o Antigravity

> Você é o agente da **Fase 0** do projeto descrito em `SPEC.md`. Leia a spec e o `AGENTS.md` por completo. Gere primeiro um **Implementation Plan** (artifact) com a estrutura de pastas, versões das dependências, scripts e o schema Prisma inicial, e aguarde minha aprovação. Depois de aprovado, implemente, rode lint, typecheck e testes, suba o app com Docker e valide no navegador, anexando screenshots e um resumo do que foi feito e do que ficou pendente.

Para as fases seguintes, troque apenas o número da fase e peça para o agente primeiro ler o que já existe no repositório e o resumo da fase anterior.

---

## 15. Riscos e decisões em aberto

| Item                    | Risco / decisão                                 | Recomendação                                                        |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| Gantt próprio           | Alta complexidade (virtualização, dependências) | Construir incrementalmente: barras → arrastar → dependências → CPM  |
| Colaboração (Yjs)       | Persistência e escala do servidor de sync       | Começar com 1 instância; migrar para Redis/Hocuspocus se necessário |
| tldraw vs. Excalidraw   | Licenciamento do tldraw para uso comercial      | Validar licença antes da Fase 6; Excalidraw (MIT) como alternativa  |
| Next + Express          | Duas aplicações para implantar                  | Documentar deploy (containers separados) e usar proxy reverso       |
| Armazenamento de anexos | Custo e privacidade                             | Interface de storage abstrata (local/MinIO/S3)                      |
| Multi-tenancy           | Vazamento entre workspaces                      | Testes automatizados obrigatórios + filtro central no repositório   |

**Questões em aberto para o time:** nome definitivo do produto; necessidade de SSO (Google/Microsoft) já na v1; política de retenção de dados; hospedagem alvo (Vercel + Render, AWS, VPS).
