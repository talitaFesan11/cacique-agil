FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate && apk add --no-cache libc6-compat openssl
WORKDIR /workspace

FROM base AS deps
COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY prisma prisma
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
RUN pnpm prisma generate
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm --filter @fluxo/api dev"]

FROM dev AS build
RUN pnpm --filter @fluxo/shared build && pnpm --filter @fluxo/api build
RUN pnpm --filter @fluxo/api deploy --prod /out
RUN cp -r /workspace/node_modules/.prisma /out/node_modules/ 2>/dev/null || true
RUN cp -r /workspace/node_modules/@prisma /out/node_modules/ 2>/dev/null || true

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
