## 12. Regras para os agentes

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
