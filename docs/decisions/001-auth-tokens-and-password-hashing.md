# ADR 001: Tokens de Autenticação, Rotação de Refresh Token e Hash de Senhas

- **Status:** Aceito
- **Data:** 2026-10-27
- **Contexto:** Fase 1 (Identidade e Workspaces)

## Contexto e Problema

A especificação (`SPEC.md` seções 6.1 e 9) exige:
1. Autenticação baseada em Access Token JWT de curta duração no header `Authorization: Bearer <token>` e Refresh Token rotativo e revogável enviado em cookie `httpOnly`.
2. Hash de senhas com `argon2` ou `bcrypt` com custo $\ge 12$.
3. Execução consistente tanto no host quanto em imagens Docker baseadas em `node:22-alpine`.

## Decisão

1. **Hash de Senhas (`bcryptjs` com custo 12)**:
   - Optamos por `bcryptjs` com salt rounds = `12` em produção/desenvolvimento (ajustável para `4` apenas em ambiente de teste `NODE_ENV=test` para manter a suíte de integração rápida sem alterar o algoritmo).
   - Evita problemas de binários nativos C++/musl em containers Alpine multi-arquitetura, atendendo integralmente ao requisito da seção 9 da Spec.

2. **Access Token + Refresh Token Rotativo**:
   - **Access Token**: JWT assinado com `JWT_SECRET` (expiração padrão `15m`), contendo `{ sub: userId, email, name }` no payload.
   - **Refresh Token**: token opaco criptograficamente aleatório (`crypto.randomBytes(40).toString('hex')`), armazenado no banco de dados (`refresh_tokens`) apenas como hash SHA-256 (`tokenHash`), com validade de 7 dias.
   - Na rota `POST /api/v1/auth/refresh`, o token anterior é marcado com `revokedAt = now()` e `replacedByTokenHash = newHash`. Caso um token já revogado seja reutilizado (detecção de roubo de token), todas as sessões ativas do usuário são revogadas preventivamente.
   - O cookie `fluxopro_refresh_token` é configurado com `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'` e `path: '/api/v1/auth'`.

3. **Isolamento Multi-Tenant e RBAC**:
   - Toda rota de workspace ou recurso vinculado a um workspace exige o middleware `requireWorkspaceRole`, que consulta a tabela `memberships` garantindo que `(userId, workspaceId)` exista e que o papel do usuário satisfaça o nível exigido (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`).
   - Quando um usuário pertence a um workspace A e tenta acessar qualquer rota do workspace B, a API responde com `403 FORBIDDEN` (ou `404 NOT_FOUND` quando apropriado) sem vazar metadados.
