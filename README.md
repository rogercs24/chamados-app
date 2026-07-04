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

## Documentação

- [Plano de execução](docs/PLANO-DE-EXECUCAO.md) — fases, escopo e rastreabilidade
- [ADR-0001](docs/adr/ADR-0001-estrategia-multi-tenant.md) — estratégia multi-tenant
- [ADR-0002](docs/adr/ADR-0002-comunicacao-tempo-real.md) — tempo real (Socket.IO)
- [ADR-0003](docs/adr/ADR-0003-processamento-assincrono.md) — assíncrono (BullMQ)
- [CLAUDE.md](CLAUDE.md) — guia de contexto e convenções

## Status

- **Fase 0 — Fundação** ✅ (monorepo, infra, API bootável)
- **Fase 1 — Autenticação, tenancy e auditoria** ✅ (login/OAuth/MFA/JWT+refresh,
  RBAC, isolamento multi-tenant, rate-limit, auditoria — 18 testes)
- **Próxima: Fase 2 — Domínio** (usuários, clientes, chamados)

> **Primeira execução do banco:** com o Docker no ar (`pnpm infra:up`), rode
> `pnpm --filter @chamados/api prisma:migrate` — a migration inicial é criada a
> partir do schema atual. Depois `pnpm --filter @chamados/api seed`.
