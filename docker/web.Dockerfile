# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate && apk add --no-cache libc6-compat
WORKDIR /workspace

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/eslint-config/package.json packages/eslint-config/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
CMD ["pnpm", "--filter", "@fluxo/web", "dev"]

FROM dev AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @fluxo/shared build
RUN pnpm --filter @fluxo/web build

FROM node:22-alpine AS prod
RUN apk add --no-cache tini wget
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=build /workspace/apps/web/.next/standalone ./
COPY --from=build /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /workspace/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost:3000/ || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
