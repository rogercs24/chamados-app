# Plano de Execução — Plataforma de Chamados SaaS Multi-Tenant

> Documento vivo. Guia a reestruturação do projeto atual (Express + JSON) para um
> SaaS multi-tenant na stack obrigatória. Cada decisão relevante está justificada,
> porque a **capacidade de justificar escolhas** é critério de avaliação.

---

## 1. Visão geral

Rebuild **greenfield** numa stack nova. O app atual (`backend/` Express + arquivos JSON,
`frontend/` HTML puro) deixa de ser código executável e passa a ser **referência de domínio**:
chamados, triagem, papéis (solicitante/atendente/admin), FAQ obrigatório e anexos por resposta
já estão modelados no negócio e migram como requisitos, não como código.

**Princípios que guiam o projeto:**

- **Isolamento de tenant é inegociável** — nenhuma query sem escopo de empresa.
- **Camada de casos de uso isolada** — regra de negócio não depende de framework nem de HTTP.
- **Tudo observável e auditável** — logs estruturados + audit log desde a fase 1.
- **Documentar decisões** (ADRs) no mesmo passo em que se implementa.

---

## 2. Stack e decisões-chave

| Área | Escolha | Justificativa (resumo — ADR completo em `docs/adr/`) |
|------|---------|------|
| Backend | **NestJS + TypeScript** | Modularidade, DI, decorators, ecossistema de guards/interceptors casam com os itens de "Qualidade" do edital. |
| ORM | **Prisma** | Migrations versionadas, type-safety, Client Extensions (chave do isolamento multi-tenant). |
| Banco | **MySQL 8** | Obrigatório. ⚠️ Sem Row-Level Security → isolamento imposto no app (ver §5). |
| Cache/Fila/PubSub | **Redis** | Obrigatório. Serve a 3 propósitos: BullMQ, adapter do Socket.IO, store do rate-limit. |
| Frontend | **Next.js (App Router) + TypeScript** | Plataforma admin + landing. SSR/SEO na landing, RSC na plataforma. |
| Fila assíncrona | **BullMQ** | Import de planilhas e relatórios. Worker Nest separado. |
| Tempo real | **Socket.IO + @socket.io/redis-adapter** | Rooms por tenant/chamado, auth no handshake, reconexão, escala horizontal via Redis. |
| Auth | **Passport** (local, Google, GitHub) + **JWT access + refresh rotativo** + **TOTP (otplib)** | Cobre login/OAuth/MFA/JWT/refresh do edital num módulo. |
| Rate limit | **@nestjs/throttler + Redis** | "Proteção contra abuso de autenticação". |
| APIs externas | **BrasilAPI (CNPJ)** + **ViaCEP (CEP)** | Autopreenchimento no cadastro de clientes B2B. Grátis, sem chave. |
| Logs | **Pino (nestjs-pino)** + correlation-id | Logs estruturados + rastreamento de requisições. |
| Testes | **Jest + Supertest + Testcontainers** (back), **Vitest/RTL + Playwright** (front) | Pirâmide de testes. |
| Monorepo | **pnpm workspaces + Turborepo** | Cache de build, tipos compartilhados. |
| Container | **Docker + docker-compose** | Obrigatório. api, worker, web, landing, mysql, redis, adminer, mailhog. |
| Deploy | **Railway** (stack Docker) + **Vercel** (web/landing) | MySQL+Redis gerenciados; Next no lar natural. |

**Medidas de segurança adicionais (sinalizadas conforme o edital pede):** Helmet, CORS estrito,
**argon2** no lugar de bcrypt, refresh em cookie `httpOnly`+`SameSite`, rotação de refresh com
**detecção de reuso**, validação/sanitização global de input, secrets só por env.

---

## 3. Estrutura do monorepo

```
chamados-saas/                         (este repo)
├── apps/
│   ├── api/                           NestJS
│   │   ├── prisma/                    schema.prisma, migrations, seed
│   │   └── src/
│   │       ├── main.ts, app.module.ts
│   │       ├── common/                guards, interceptors, filters, decorators, pipes
│   │       ├── infra/                 prisma.service, redis, bullmq, socket gateway
│   │       ├── config/                env schema (zod), config module
│   │       └── modules/
│   │           ├── auth/              (local, google, github, mfa, refresh)
│   │           ├── tenants/          (empresas)
│   │           ├── users/
│   │           ├── clients/           (+ integração CNPJ/CEP)
│   │           ├── tickets/           (chamados + triagem + respostas + upload)
│   │           ├── faq/
│   │           ├── dashboard/
│   │           ├── reports/           (geração assíncrona)
│   │           └── audit/
│   ├── web/                           Next.js — plataforma administrativa
│   └── landing/                       Next.js — landing page pública
├── packages/
│   ├── types/                         contratos/DTOs compartilhados front↔back
│   └── config/                        eslint, tsconfig, tailwind preset
├── docs/
│   ├── PLANO-DE-EXECUCAO.md          (este arquivo)
│   ├── ARQUITETURA.md
│   ├── adr/                           ADR-0001 multi-tenant, ADR-0002 realtime, ...
│   └── FLUXOS.md
├── legacy/                            app Express+JSON original (referência)
├── .claude/                          agentes, skills, regras (exigido)
├── CLAUDE.md
├── docker-compose.yml
├── turbo.json, pnpm-workspace.yaml
└── README.md
```

**Padrão interno de cada módulo Nest** (Clean Architecture pragmática):

```
modules/tickets/
├── tickets.module.ts
├── tickets.controller.ts        (HTTP + Swagger + guards)
├── dto/                         (class-validator: CreateTicketDto, ...)
├── use-cases/                   (CreateTicketUseCase, TriageTicketUseCase, ...)
├── repositories/               (TicketsRepository — interface + prisma impl)
├── entities/                    (domínio puro)
└── presenters/                  (TicketPresenter — molda a saída HTTP)
```

`controller → use-case → repository → prisma`. Regra de negócio vive no use-case, sem saber de HTTP.

---

## 4. Modelo de dados (esboço do schema Prisma)

Toda tabela de negócio carrega `tenantId` (exceto `Tenant` e tabelas globais).

- **Tenant** — `id, nome, slug, criadoEm`. A empresa.
- **User** — `id, tenantId, nome, email, senhaHash, provider, mfaSecret, mfaEnabled, papel(enum), area(enum?), ...`. `@@unique([tenantId, email])`.
- **RefreshToken** — `id, userId, tokenHash, expiraEm, revogadoEm, substituidoPor` (rotação + reuse detection).
- **Client** — `id, tenantId, cnpj, razaoSocial, cep, endereco, ...` (populado por BrasilAPI/ViaCEP).
- **Ticket** — `id, tenantId, titulo, descricao, solicitanteId, prioridade, area, status(enum), criadoEm, atualizadoEm`.
- **TicketResponse** — `id, tenantId, ticketId, autorId, texto, criadoEm`.
- **Attachment** — `id, tenantId, responseId, nomeArquivo, path/url, mime, tamanho`.
- **ImportJob** — `id, tenantId, tipo, status, total, processados, erros, criadoEm` (planilhas).
- **AuditLog** — `id, tenantId, actorId, acao, entidade, entidadeId, metadata(json), ip, criadoEm` (append-only).
- **FaqConsulta / FaqToken** — token de uso único (regra atual mantida).

Enums: `Papel { SUPER_ADMIN, ADMIN, TRIAGEM, TI, TRADE, OPERACOES, SOLICITANTE }`,
`Status { TRIAGEM, ABERTO, EM_ANDAMENTO, RESOLVIDO, FECHADO }`, `Prioridade`, `Area`.

---

## 5. Estratégia multi-tenant (decisão documentada — ADR-0001)

**Escolha: banco único, schema único, coluna discriminadora `tenantId`.**

**Por quê (e não schema-per-tenant nem DB-per-tenant):**
- Alvo é SaaS com muitos tenants pequenos → migrations e operação simples num schema só.
- MySQL **não tem RLS** (diferente do Postgres) → qualquer estratégia exige enforcement no app; então o custo de schema-per-tenant não compra a segurança "de graça" que teria no Postgres.

**Como o isolamento é garantido (defesa em profundidade):**
1. **Contexto de request** via `AsyncLocalStorage` — um interceptor extrai o `tenantId` do JWT e o guarda no contexto.
2. **Prisma Client Extension** — injeta `where: { tenantId }` em todo `findMany/findUnique/update/delete` e seta `tenantId` em todo `create`. Ponto único, impossível de esquecer.
3. **Teste automatizado de isolamento** — para cada recurso, um teste com dois tenants garante que A nunca lê/escreve dados de B (retorna 404, não 403, para não vazar existência).

---

## 6. Fases de execução

Cada fase tem **objetivo → tarefas → arquivos → critério de aceite (DoD)**. Fases são sequenciais;
dentro de cada uma, tarefas podem paralelizar.

### Fase 0 — Fundação

- **Objetivo:** monorepo de pé, MySQL+Redis no compose, NestJS+Prisma+Next bootando, ADRs iniciais.
- **Tarefas:**
  - `pnpm-workspace.yaml`, `turbo.json`, mover app atual para `legacy/`.
  - `docker-compose.yml` (mysql, redis, adminer, mailhog).
  - `apps/api`: NestJS + config (zod env), PrismaService, health check (`@nestjs/terminus`), Swagger, Pino.
  - `apps/web` e `apps/landing`: Next.js App Router + Tailwind.
  - `prisma/schema.prisma` inicial (Tenant, User) + primeira migration + seed.
  - `docs/adr/ADR-0001..0003`, `CLAUDE.md`, `.claude/` (regras de projeto).
- **DoD:** `docker compose up` sobe tudo; `GET /health` 200; `/docs` (Swagger) abre; landing e web renderizam.

### Fase 1 — Autenticação, tenancy e auditoria

- **Objetivo:** o núcleo de segurança e o isolamento funcionando.
- **Tarefas:**
  - Módulo `auth`: local (argon2), Google e GitHub (Passport), JWT access + refresh rotativo (reuse detection), TOTP (otplib) enroll/verify.
  - `RolesGuard` + `@Roles()`; `TenantContext` (AsyncLocalStorage) + interceptor.
  - **Prisma Extension** de isolamento por `tenantId`.
  - `@nestjs/throttler` (Redis) nos endpoints de auth.
  - Módulo `audit`: interceptor + `AuditLog` (login, logout, CRUD usuário, mudança de permissão).
  - Onboarding: registro cria **Tenant + primeiro usuário SUPER_ADMIN**.
- **DoD:** login/refresh/MFA/OAuth funcionam; teste de isolamento entre 2 tenants passa; ações auditadas gravam log; brute-force é barrado.

### Fase 2 — Domínio (usuários, clientes, chamados)

- **Objetivo:** CRUDs e o fluxo de chamado ponta a ponta.
- **Tarefas:**
  - `users`: cadastro/edição/remoção (soft-delete) + controle de permissões.
  - `clients`: CRUD + **integração BrasilAPI (CNPJ)** e **ViaCEP (CEP)** com cache Redis.
  - `tickets`: criar (exige faqToken), triagem (admin define prioridade+área), status, respostas.
  - `attachments`: upload (multer/local ou S3-compat) por resposta.
  - Paginação, filtros e ordenação nas listagens.
- **DoD:** fluxo triagem→aberto→em_andamento→resolvido→fechado completo; cadastro de cliente autopreenche por CNPJ/CEP; testes de use-case cobrindo regras.

### Fase 3 — Assíncrono + tempo real

- **Objetivo:** amarrar upload de planilha + fila + atualização ao vivo.
- **Tarefas:**
  - BullMQ: fila de **import CSV/XLSX** (parse, validação linha a linha, `ImportJob` com progresso).
  - Worker Nest separado (processo/serviço próprio no compose).
  - Socket.IO Gateway + Redis adapter: rooms `tenant:{id}` e `ticket:{id}`; auth no handshake.
  - Eventos ao vivo: novo chamado na triagem, nova resposta, progresso do import, contadores.
- **DoD:** subir planilha retorna 202 e progride via socket; dois navegadores veem atualização em tempo real; job falho registra erros por linha.

### Fase 4 — Dashboard + relatórios

- **Objetivo:** indicadores para decisão + geração assíncrona de relatório.
- **Tarefas:**
  - `dashboard`: chamados por dia/semana/mês/ano/período, por área; tempo médio de resposta; agregações SQL eficientes.
  - `reports`: geração assíncrona (BullMQ) de relatório (ex.: XLSX/PDF) com download quando pronto (aviso via socket).
- **DoD:** dashboard responde com filtros de período/área; relatório grande gera sem travar a request.

### Fase 5 — Frontend

- **Objetivo:** plataforma administrativa + landing.
- **Tarefas:**
  - `web`: login/OAuth/MFA, guard de rota por papel, telas de usuários/clientes/chamados/triagem/dashboard, upload, tempo real (socket client).
  - `landing`: design próprio, responsivo, animações/transições, storytelling visual, SEO.
  - `packages/types` compartilhando contratos.
- **DoD:** fluxos navegáveis com dados reais da API; landing responsiva e animada; Lighthouse saudável.

### Fase 6 — Testes, observabilidade, deploy e documentação

- **Objetivo:** fechar os critérios transversais.
- **Tarefas:**
  - Testes: unit (use-cases), e2e (Supertest + Testcontainers MySQL), Playwright nos fluxos críticos; relatório de cobertura.
  - Observabilidade: correlation-id ponta a ponta, exception filter global, Sentry (diferencial), health/readiness.
  - Deploy: Railway (api+worker+mysql+redis) + Vercel (web/landing); `.env.example`; CI (GitHub Actions: lint+test+build).
  - Docs: `README` (instalação/execução), `ARQUITETURA.md`, `FLUXOS.md`, ADRs revisados.
- **DoD:** URL pública funcionando; `README` permite subir local em 1 comando; cobertura e docs prontas.

---

## 7. Rastreabilidade — requisito do edital → onde é atendido

| Requisito | Fase | Onde |
|-----------|------|------|
| Multi-tenant + isolamento + justificativa | 1 | §5, ADR-0001, Prisma Extension |
| Auth e-mail/senha + Google + GitHub + MFA/TOTP + JWT + refresh | 1 | módulo `auth` |
| Controle de acesso por perfil | 1 | `RolesGuard`, `@Roles()` |
| Proteção contra abuso de autenticação | 1 | `throttler` + Redis |
| Auditoria | 1 | módulo `audit` |
| Gestão de usuários (CRUD + permissões) | 2 | módulo `users` |
| Gestão de clientes (CRUD) | 2 | módulo `clients` |
| Integrações externas (2+) | 2 | BrasilAPI + ViaCEP |
| Upload CSV/XLSX | 2/3 | `attachments` + import |
| Processamento assíncrono + doc | 3 | BullMQ, ADR-0003 |
| Comunicação em tempo real | 3 | Socket.IO, ADR-0002 |
| Dashboard de indicadores | 4 | módulo `dashboard` |
| Landing page | 5 | `apps/landing` |
| Qualidade / separação de responsabilidades | todas | §3 (use-cases, DTOs, presenters) |
| Testes | 6 | §6 Fase 6 |
| Observabilidade | 6 | Pino, correlation-id, filters |
| Deploy público | 6 | Railway + Vercel |
| Documentação | 6 | `docs/`, `README` |
| Artefatos de IA (`.claude`) | 0 | `.claude/`, `CLAUDE.md` |

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Vazamento entre tenants (o mais grave) | Enforcement único na Prisma Extension + testes de isolamento obrigatórios por recurso. |
| Escopo enorme x prazo | Fases entregam valor incremental; MVP vertical (um fluxo real) cedo. |
| Anexos em host efêmero | Storage S3-compatível (ou volume persistente) já previsto. |
| Complexidade do async | Começar por um único job (import) bem feito antes de generalizar. |
| Segredos/OAuth em deploy | `.env.example` + secrets no Railway/Vercel; nunca commitar `.env`. |

---

## 9. Ambiente e comandos (após Fase 0)

```bash
pnpm install
docker compose up -d          # mysql, redis, adminer, mailhog
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
pnpm dev                      # api + web + landing via turbo
```

---

## 10. Estado atual

- [x] Diagnóstico do app legado e decisões de stack
- [x] Fase 0 — Fundação (monorepo, infra, API bootável, ADRs) — build 4/4 OK
- [x] Fase 1 — Auth, tenancy, auditoria (build OK, 18 testes) — ADR-0004
- [x] Fase 2 — Domínio: usuários (CRUD+RBAC), clientes (CNPJ/CEP), chamados
      (triagem/atendimento) — 29 testes, isolamento validado ao vivo
- [x] Fase 3 — Assíncrono (BullMQ import CSV/XLSX) + tempo real (Socket.IO) +
      upload de anexos — os três validados ponta a ponta
- [x] Fase 4 — Dashboard (status/área/série/tempo de resposta) + geração
      assíncrona de relatório XLSX — validados ao vivo
- [ ] Fase 5 — Frontend
- [ ] Fase 6 — Testes, observabilidade, deploy, docs
