# Imagem de produção da API NestJS.
# Serve também ao WORKER (mesma imagem, comando `node dist/worker.js` no compose).
# Contexto de build: RAIZ do monorepo (precisa do workspace + turbo prune).
#
#   docker build -f apps/api/Dockerfile -t chamados-api .

# ---- base: node + openssl (Prisma) + pnpm ----
FROM node:20-slim AS base
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ---- pruner: subconjunto podado do monorepo só para a API ----
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.10.3 prune @chamados/api --docker

# ---- installer: instala deps, gera Prisma Client e compila ----
FROM base AS installer
# Primeiro só os manifests (cacheia a instalação enquanto o código muda)
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
# Depois o código-fonte podado
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @chamados/api prisma:generate \
 && pnpm --filter @chamados/api build

# ---- runner: só o necessário para rodar ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=installer /app /app
WORKDIR /app/apps/api
EXPOSE 3333
# Healthcheck em /health (respeita a PORT injetada por PaaS; 3333 no dev)
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "const p=process.env.PORT||3333;require('http').get('http://localhost:'+p+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
# Papel do processo por SERVICE_ROLE: 'worker' roda o worker; qualquer outro valor
# (padrão) roda a API aplicando as migrations antes. Uma imagem, dois papéis.
CMD ["sh", "-c", "if [ \"$SERVICE_ROLE\" = worker ]; then exec node dist/worker.js; else pnpm exec prisma migrate deploy && exec node dist/main.js; fi"]
