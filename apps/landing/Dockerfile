# Imagem de produção da landing (Next.js, output standalone).
# Contexto de build: RAIZ do monorepo.
#
#   docker build -f apps/landing/Dockerfile -t chamados-landing .

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.10.3 prune @chamados/landing --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# Ativa o output standalone (gated por env — ver next.config.mjs)
ENV NEXT_OUTPUT=standalone
RUN pnpm --filter @chamados/landing build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=installer /app/apps/landing/.next/standalone ./
COPY --from=installer /app/apps/landing/.next/static ./apps/landing/.next/static
EXPOSE 3001
ENV PORT=3001 HOSTNAME=0.0.0.0
CMD ["node", "apps/landing/server.js"]
