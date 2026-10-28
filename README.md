# FluxoPro — Plataforma de Gerenciamento e Fluxo de Projetos

Plataforma unificada de produtividade e gestão de projetos (Tarefas, Kanban, Gantt, Cronograma, Documentos Colaborativos, Quadros Brancos, OKRs e Dashboards) construída em arquitetura monorepo (`pnpm workspaces`) com **Next.js 15 (App Router) + MUI v6**, **Node.js + Express + TypeScript**, **Prisma + PostgreSQL 16** e **Zod + OpenAPI 3.0**.

---

## Estrutura do Monorepo

```text
.
├── apps/
│   ├── api/                # Backend Express + TypeScript + OpenAPI + RBAC
│   └── web/                # Frontend Next.js (App Router) + MUI v6 + next-intl
├── packages/
│   ├── shared/             # Schemas Zod compartilhados, DTOs e Enums
│   ├── eslint-config/      # Configuração ESLint compartilhada
│   └── tsconfig/           # Configurações TypeScript estritas (strict: true)
├── prisma/
│   ├── schema.prisma       # Modelo relacional multi-tenant completo
│   ├── migrations/         # Migrations versionadas
│   └── seed.ts             # Seed determinístico de desenvolvimento
├── docker/                 # Dockerfiles multi-stage (dev/build/migrate/prod) e Nginx
└── docs/decisions/         # Architecture Decision Records (ADRs)
```

---

## Como Executar com Docker (Desenvolvimento)

1. Copie o arquivo de variáveis de ambiente (opcional, o Compose já possui defaults de dev):
   ```bash
   cp .env.example .env
   ```
2. Suba toda a stack com um único comando:
   ```bash
   pnpm docker:dev
   # ou em background:
   pnpm docker:up
   ```
3. Aplique as migrations e popule o banco com os dados de demonstração:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

### Portas dos Serviços (Desenvolvimento)
- **Web App (Next.js)**: `http://localhost:3000`
- **API REST (Express)**: `http://localhost:4000/api/v1`
- **Swagger / OpenAPI UI**: `http://localhost:4000/api/docs`
- **Health Check**: `http://localhost:4000/health`
- **Mailpit (Web UI de E-mails)**: `http://localhost:8025`
- **PostgreSQL 16**: `localhost:5432`

---

## Credenciais de Demonstração (Seed — Fase 1)

| Papel / Contexto | E-mail | Senha | Workspace |
| :--- | :--- | :--- | :--- |
| **Owner** | `admin@fluxopro.local` | `Senha@123` | `FluxoPro Org` (`fluxopro-org`) e `Engenharia & Produto` (`ADMIN`) |
| **Member** | `membro@fluxopro.local` | `Senha@123` | `FluxoPro Org` (`fluxopro-org`) |
| **Guest** | `convidado@fluxopro.local` | `Senha@123` | `FluxoPro Org` (`fluxopro-org`) |
| **Tenant Isolado** | `externo@acme.local` | `Senha@123` | `Acme Corp (Isolado)` (`acme-corp`) |

---

## Scripts Disponíveis (`package.json` raiz)

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| `pnpm dev` | `pnpm --filter "@fluxo/*" --parallel dev` | Inicia API e Web em paralelo |
| `pnpm build` | Build de `@fluxo/shared`, `@fluxo/api` e `@fluxo/web` | Compila todos os pacotes para produção |
| `pnpm lint` | `pnpm -r lint` | Executa ESLint em todos os pacotes |
| `pnpm typecheck` | `pnpm -r typecheck` | Valida tipos TypeScript (`strict: true`) |
| `pnpm test` | `pnpm -r test` | Executa testes unitários, de integração e de componentes (Vitest) |
| `pnpm test:e2e` | `pnpm --filter @fluxo/web test:e2e` | Executa testes E2E (Playwright) |
| `pnpm db:migrate` | `prisma migrate dev` | Cria e aplica migrations Prisma |
| `pnpm db:seed` | `tsx prisma/seed.ts` | Executa seed determinístico |
| `pnpm db:studio` | `prisma studio` | Abre interface visual do banco |
| `pnpm docker:up` | `docker compose up -d` | Sobe containers do ambiente de desenvolvimento |

---

## Status de Entrega por Fases

- [x] **Fase 0 — Fundação**: Monorepo, TypeScript estrito, ESLint/Prettier/Husky, Docker dev/prod multi-stage, Prisma schema inicial + seed, Express (`/health`, `/ready`, OpenAPI) e Next.js + MUI v6 + i18n (`pt-BR` / `en`).
- [x] **Fase 1 — Identidade e Workspaces**: Autenticação completa (`register`, `login`, `refresh` rotativo em cookie `httpOnly` com detecção de reúso, `logout`, `forgot-password`, `reset-password`, `me`), CRUD de Workspaces, convites por e-mail via SMTP/Mailpit, gestão de membros e RBAC (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`) com isolamento multi-tenant testado.
- [x] **Fase 2 — Projetos e Tarefas (Visão Lista)**: CRUD de Projetos com chave única (`FLX`) e status padrão, CRUD de Tarefas com numeração sequencial (`FLX-1`), subtarefas (até 3 níveis), edição inline e em massa, Drawer lateral de detalhes, etiquetas coloridas, checklists com progresso, comentários com `@menções`, anexos validados, filtros combinados, visões salvas e atalhos de teclado (`C`, `/`, `Esc`, `?`).
