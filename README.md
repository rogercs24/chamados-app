# Chamados SaaS — Plataforma multi-tenant de gestão de chamados

Monorepo de uma plataforma SaaS para abertura, triagem, atendimento e análise de
chamados, com isolamento de dados entre empresas (multi-tenant).

> Reestruturação do projeto original (Express + JSON), agora em NestJS + Next.js +
> Prisma + MySQL. O app antigo está preservado em [`legacy/`](legacy/) como
> referência de domínio.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS · TypeScript · Prisma · MySQL 8 |
| Frontend | Next.js (App Router) · TypeScript · Tailwind |
| Infra | Docker Compose · Redis |
| Monorepo | pnpm workspaces · Turborepo |

## Estrutura

```
apps/
  api/        API NestJS (Prisma, health, logs Pino, Swagger)
  web/        Plataforma administrativa (Next.js)
  landing/    Landing page pública (Next.js)
packages/
  types/      Contratos compartilhados front↔back
docs/         Plano de execução, arquitetura e ADRs (decisões)
legacy/       App original (referência)
```

## Pré-requisitos

- Node.js 20+ · pnpm 9+ · Docker Desktop · Git

## Como rodar

```bash
# 1. dependências
pnpm install

# 2. variáveis de ambiente
copy .env.example .env                      # Windows
cp .env.example .env                        # Linux/Mac
copy apps\api\.env.example apps\api\.env     # Windows

# 3. infraestrutura (MySQL, Redis, Adminer, Mailhog)
pnpm infra:up

# 4. banco: migration + seed
pnpm --filter @chamados/api prisma:migrate
pnpm --filter @chamados/api seed

# 5. subir tudo em dev
pnpm dev
```

| Serviço | URL |
|---------|-----|
| API | http://localhost:3333 |
| Swagger (docs) | http://localhost:3333/docs |
| Health check | http://localhost:3333/health |
| Plataforma (web) | http://localhost:3000 |
| Landing | http://localhost:3001 |
| Adminer (banco) | http://localhost:8080 |
| Mailhog (e-mail) | http://localhost:8025 |

**Login de demonstração (após seed):** `admin@demo.com` / `Admin@123`

## Produção (Docker)

Todo o stack é containerizado. As imagens são construídas a partir deste repositório
(multi-stage + `turbo prune`; Next em `output: standalone`):

```bash
# copie e ajuste os segredos
cp .env.example .env

# constrói e sobe api + worker + web + landing + mysql + redis
docker compose -f docker-compose.prod.yml up -d --build
```

- A API aplica as migrations pendentes (`prisma migrate deploy`) antes de subir.
- O **worker** roda em processo separado (`node dist/worker.js`), consumindo as filas
  BullMQ e emitindo eventos de tempo real via o mesmo adapter Redis (ver
  [ADR-0003](docs/adr/ADR-0003-processamento-assincrono.md)).
- Imagens: [`apps/api/Dockerfile`](apps/api/Dockerfile) (serve API **e** worker),
  [`apps/web/Dockerfile`](apps/web/Dockerfile), [`apps/landing/Dockerfile`](apps/landing/Dockerfile).

**Deploy:** qualquer host Docker roda o stack acima (Railway, Render, Fly, VPS). A API e o
worker apontam para MySQL e Redis gerenciados via `DATABASE_URL`/`REDIS_URL`. Os frontends
Next também rodam bem na Vercel (build padrão, sem `standalone`).

## Qualidade (CI)

[GitHub Actions](.github/workflows/ci.yml) roda em cada push/PR: `install` →
`prisma generate` → **lint** → **typecheck** → **test** → **build** no monorepo (via Turborepo).

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # o mesmo, localmente
```

## Documentação

- [Arquitetura](docs/ARQUITETURA.md) — componentes, camadas e o mecanismo de isolamento
- [Fluxos](docs/FLUXOS.md) — sequências dos fluxos-chave (auth, chamado, assíncrono, tempo real)
- [Plano de execução](docs/PLANO-DE-EXECUCAO.md) — fases, escopo e rastreabilidade
- [ADR-0001](docs/adr/ADR-0001-estrategia-multi-tenant.md) — estratégia multi-tenant
- [ADR-0002](docs/adr/ADR-0002-comunicacao-tempo-real.md) — tempo real (Socket.IO)
- [ADR-0003](docs/adr/ADR-0003-processamento-assincrono.md) — assíncrono (BullMQ)
- [ADR-0004](docs/adr/ADR-0004-modelo-de-identidade-e-auth.md) — identidade e autenticação
- [CLAUDE.md](CLAUDE.md) — guia de contexto e convenções

## Status

- **Fase 0 — Fundação** ✅ (monorepo, infra, API bootável)
- **Fase 1 — Autenticação, tenancy e auditoria** ✅ (login/OAuth/MFA/JWT+refresh,
  RBAC, isolamento multi-tenant, rate-limit, auditoria)
- **Fase 2 — Domínio** ✅ (usuários com CRUD+permissões, clientes com integração
  CNPJ/CEP, chamados com triagem/atendimento e visibilidade por área — 29 testes)
- **Fase 3 — Assíncrono + tempo real + upload** ✅ (importação de planilhas
  CSV/XLSX via BullMQ, Socket.IO com adapter Redis, anexos em respostas)
- **Fase 4 — Dashboard + relatórios** ✅ (indicadores por status/área/período e
  tempo de resposta; geração assíncrona de relatório XLSX)
- **Fase 5 — Frontends** ✅ (plataforma Next.js cobrindo todas as telas com
  tempo real; landing page animada com storytelling)
- **Fase 6 — Testes, deploy + docs** 🚧 (em andamento) — docs de arquitetura/fluxos;
  Dockerfiles de produção (api/worker/web/landing) + `docker-compose.prod.yml`;
  CI (GitHub Actions: lint+typecheck+test+build **+ e2e**); ESLint da API; **teste
  e2e de isolamento multi-tenant** com Testcontainers (MySQL+Redis efêmeros);
  observabilidade **Sentry** (erros 5xx, no-op sem DSN). **Pendente:** deploy público
  (Railway/Vercel) — infra pronta, falta apertar o botão

> **Primeira execução do banco:** com o Docker no ar (`pnpm infra:up`), rode
> `pnpm --filter @chamados/api prisma:migrate` — a migration inicial é criada a
> partir do schema atual. Depois `pnpm --filter @chamados/api seed`.
