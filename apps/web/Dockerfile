# Imagem de produção da plataforma (Next.js, output standalone).
# Contexto de build: RAIZ do monorepo.
#
#   docker build -f apps/web/Dockerfile -t chamados-web .

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.10.3 prune @chamados/web --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# A URL da API é embutida no bundle em build-time (variável NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# Ativa o output standalone (gated por env — ver next.config.mjs)
ENV NEXT_OUTPUT=standalone
RUN pnpm --filter @chamados/web build

# ---- runner: server standalone (mínimo) ----
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
# Em monorepo, o standalone espelha a estrutura: apps/web/server.js + node_modules na raiz
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
