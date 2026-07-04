# CLAUDE.md — Guia do projeto

Contexto para o Claude Code (e para qualquer dev) trabalhar neste repositório.

## O que é

Plataforma **SaaS multi-tenant de gestão de chamados**. Monorepo com API NestJS,
dois frontends Next.js (plataforma + landing) e infra Docker (MySQL, Redis).

O app original (Express + arquivos JSON) foi preservado em [`legacy/`](legacy/)
apenas como **referência de domínio** — não é executado nem mantido.

## Stack

- **Backend:** NestJS + TypeScript, Prisma ORM, MySQL 8
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind
- **Infra:** Docker Compose, Redis (BullMQ + adapter Socket.IO + rate-limit)
- **Monorepo:** pnpm workspaces + Turborepo

## Estrutura

```
apps/api        NestJS — módulos por domínio (controller → use-case → repository)
apps/web        Next.js — plataforma administrativa
apps/landing    Next.js — landing page pública
packages/types  contratos compartilhados front↔back
docs/           PLANO-DE-EXECUCAO, ARQUITETURA, adr/ (decisões)
legacy/         app antigo (referência)
```

## Comandos

```bash
pnpm install
pnpm infra:up                         # sobe MySQL, Redis, Adminer, Mailhog
pnpm --filter @chamados/api prisma:migrate
pnpm --filter @chamados/api seed
pnpm dev                              # api (3333) + web (3000) + landing (3001)
```

- Swagger: http://localhost:3333/docs
- Health: http://localhost:3333/health
- Adminer: http://localhost:8080 · Mailhog: http://localhost:8025

## Convenções

- **Idioma:** domínio e mensagens em pt-BR; termos técnicos em inglês quando padrão.
- **Multi-tenant:** NENHUMA query sem escopo de `tenantId`. O isolamento é imposto
  centralmente (Prisma Client Extension, Fase 1) — não filtre manualmente em cada
  query, confie no ponto único e cubra com teste de isolamento.
- **Arquitetura Nest:** regra de negócio vive em `use-cases/`, sem conhecer HTTP.
  Controllers só orquestram; repositories encapsulam o Prisma; presenters moldam a saída.
- **Erros:** exception filter global; nunca vazar stack para o cliente.
- **Segredos:** só via env; nunca commitar `.env`.

## Roadmap

Ver [`docs/PLANO-DE-EXECUCAO.md`](docs/PLANO-DE-EXECUCAO.md). Fase atual: **0 (Fundação)**.
