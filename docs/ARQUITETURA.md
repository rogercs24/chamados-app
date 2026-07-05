# Arquitetura — Plataforma de Chamados SaaS Multi-Tenant

> Como o sistema é montado e por quê. Complementa o [Plano de Execução](PLANO-DE-EXECUCAO.md)
> (o *quê* e *quando*) e os [ADRs](adr/) (decisões pontuais justificadas). Os caminhos de
> arquivo citados apontam para o código real — este documento acompanha a implementação.

---

## 1. Visão de contexto

```
        ┌───────────────┐        ┌───────────────┐
        │   Navegador   │        │   Navegador   │
        │  (plataforma) │        │   (landing)   │
        └───────┬───────┘        └───────┬───────┘
                │ HTTPS / WebSocket        │ HTTPS
        ┌───────▼───────┐        ┌────────▼──────┐
        │  apps/web     │        │ apps/landing  │
        │  Next.js      │        │  Next.js      │
        └───────┬───────┘        └───────────────┘
                │ REST (/api) + Socket.IO
        ┌───────▼─────────────────────────────────────┐
        │              apps/api  (NestJS)              │
        │  HTTP  ·  Socket.IO Gateway  ·  Swagger      │
        └──┬─────────────┬──────────────┬──────────────┘
           │             │              │
   ┌───────▼──┐   ┌──────▼──────┐   ┌───▼──────────────┐
   │ MySQL 8  │   │   Redis     │   │  APIs externas   │
   │ (Prisma) │   │ BullMQ +    │   │  BrasilAPI (CNPJ)│
   │          │   │ Socket adap.│   │  ViaCEP (CEP)    │
   │          │   │ + throttler │   └──────────────────┘
   └────▲─────┘   └──────▲──────┘
        │                │
   ┌────┴────────────────┴───┐
   │  Worker (BullMQ)        │   importação de planilhas + geração de relatórios
   │  mesmo código, sem HTTP │
   └─────────────────────────┘
```

**Atores e responsabilidades:**

- **apps/web** — plataforma administrativa (login/OAuth/MFA, usuários, clientes, chamados,
  triagem, dashboard, upload). Consome a API por REST e recebe eventos por Socket.IO.
- **apps/landing** — página pública (marketing/SEO). Não consome dados autenticados.
- **apps/api** — o núcleo: HTTP REST sob prefixo `/api`, gateway Socket.IO, Swagger em `/docs`,
  health em `/health`. Ver [`apps/api/src/main.ts`](../apps/api/src/main.ts).
- **Worker BullMQ** — mesmo código da API, executa os *processors* (import/relatório) fora do
  ciclo de requisição. Ver [ADR-0003](adr/ADR-0003-processamento-assincrono.md).
- **MySQL** — banco único, schema único, isolamento por coluna `tenantId` (ver §4).
- **Redis** — três papéis: fila BullMQ, adapter do Socket.IO (escala horizontal) e store do
  rate-limit (`@nestjs/throttler`).
- **APIs externas** — BrasilAPI (CNPJ) e ViaCEP (CEP) para autopreenchimento de clientes.

---

## 2. Topologia de execução (docker-compose)

| Serviço   | Papel                                       | Porta (dev) |
|-----------|---------------------------------------------|-------------|
| `api`     | NestJS (HTTP + Socket.IO)                   | 3333        |
| `worker`  | Processors BullMQ (import/relatório)        | —           |
| `web`     | Next.js — plataforma                        | 3000        |
| `landing` | Next.js — landing                           | 3001        |
| `mysql`   | Banco de dados                              | 3306        |
| `redis`   | Fila + pub/sub + rate-limit                 | 6379        |
| `adminer` | Cliente web do banco (dev)                  | 8080        |
| `mailhog` | Captura de e-mail (dev)                     | 8025        |

API e worker compartilham a base de código; o worker sobe sem o servidor HTTP e apenas registra
os *processors*. Assim, escalar o processamento assíncrono é escalar réplicas do worker, sem
tocar na API.

---

## 3. Camadas internas de um módulo Nest

O padrão é **Clean Architecture pragmática**: a regra de negócio não conhece HTTP.

```
Requisição HTTP
   │
   ▼
Controller  ── valida DTO (class-validator), aplica @Roles(), monta Swagger
   │           só orquestra; nenhuma regra de negócio aqui
   ▼
Use-case    ── a regra de negócio pura; não sabe o que é Request/Response
   │
   ▼
Repository  ── encapsula o Prisma (cliente COM escopo de tenant)
   │
   ▼
Presenter   ── molda a saída HTTP (nunca vaza campos sensíveis)
```

O layout físico é **pragmático, não cerimonioso** — cada camada existe, mas materializa no
formato que o módulo pede: o repositório pode ser uma pasta ou um único arquivo, e o presenter
só aparece onde há moldagem de saída a fazer. Exemplo real —
[`apps/api/src/modules/tickets/`](../apps/api/src/modules/tickets/):
`tickets.controller.ts` → `use-cases/*` (um arquivo por caso: criar, triar, responder, mudar
status…) → `tickets.repository.ts`. Já `auth/` e `clients/` têm `presenters/` próprios porque
precisam esconder campos sensíveis (hash de senha, segredo MFA) na saída.

**Módulos de domínio** (`apps/api/src/modules/`): `auth`, `users`, `clients`, `tickets`,
`imports`, `reports`, `dashboard`, `audit`, `health`, `integrations`.

**Infra transversal** (`apps/api/src/infra/`): `prisma`, `redis`, `realtime` (gateway +
adapter Redis), `storage` (anexos em disco).

**Common** (`apps/api/src/common/`): `guards`, `filters`, `decorators`, `pipes`, `context`
(AsyncLocalStorage), `prisma` (a extension de isolamento).

---

## 4. Isolamento multi-tenant — o mecanismo (o item mais crítico)

**Estratégia:** banco único, schema único, coluna discriminadora `tenantId`
(ver [ADR-0001](adr/ADR-0001-estrategia-multi-tenant.md)). MySQL não tem Row-Level Security,
então o isolamento é **imposto no aplicativo, num ponto único**, com defesa em profundidade.

O caminho de uma requisição autenticada:

```
1. TenantContextMiddleware              abre um escopo de AsyncLocalStorage por requisição
   (common/context/tenant-context.middleware.ts)          store = {}

2. JwtStrategy.validate(payload)         após validar o JWT, PREENCHE o contexto:
   (modules/auth/strategies/jwt.strategy.ts)   ctx.set({ tenantId, userId, papel })

3. Repositório injeta TENANT_PRISMA      o cliente Prisma estendido
   (infra/prisma/prisma.module.ts)       prisma.$extends(tenantExtension(ctx))

4. tenantExtension intercepta TODA query (common/prisma/tenant.extension.ts)
   - modelo não isolado  → passa direto
   - sem tenantId no contexto → LANÇA (fail-closed; nada vaza)
   - modelo isolado      → applyTenantScope(...)

5. applyTenantScope                       (common/prisma/tenant-scope.ts — lógica pura, testável)
   - findMany/count/updateMany/...  → injeta where.tenantId
   - create/createMany              → injeta data.tenantId
   - findUnique/update/delete/upsert → PROIBIDO (o where único não aceita tenantId com
     segurança) → TenantScopeError. Convenção: findFirst/updateMany/deleteMany com escopo.
```

**Modelos isolados** (`TENANT_MODELS` em `tenant-scope.ts`): `User`, `Client`, `Ticket`,
`TicketResponse`, `Attachment`.

**Fora da extension, de propósito:** operações de bootstrap/auth cross-tenant (registro,
login) usam o `PrismaService` base; e `AuditLog`/`ImportJob`/`ReportJob` gravam com `tenantId`
**explícito**, porque ocorrem fora do contexto de requisição (login antes do contexto existir;
worker fora do ciclo HTTP).

**Por que é seguro:** o desenvolvedor de um repositório não pode *esquecer* de filtrar por
tenant — o filtro é injetado no ponto único e, na ausência de contexto, a operação falha alto.
Operações ambíguas (`findUnique` por id) são bloqueadas em vez de permitidas. Cada recurso tem
um **teste de isolamento** com dois tenants garantindo que A nunca lê/escreve dados de B
(retorna 404, não 403, para não vazar existência).

---

## 5. Segurança

| Vetor                        | Medida (onde) |
|------------------------------|---------------|
| Cabeçalhos HTTP              | `helmet()` — [`main.ts`](../apps/api/src/main.ts) |
| CORS                         | `enableCors({ credentials: true })` |
| Senhas                       | **argon2** (não bcrypt) — `modules/auth/services/password.service.ts` |
| Sessão                       | JWT access curto + **refresh rotativo em cookie** com **detecção de reuso** (§ Fluxos) |
| Força bruta                  | `@nestjs/throttler` com store **Redis** (120 req/min) |
| Injeção / massa de dados     | `ValidationPipe` global `whitelist + forbidNonWhitelisted + transform` |
| Vazamento de segredo em log  | Pino `redact: [authorization, cookie]` |
| Vazamento de stack           | `AllExceptionsFilter` global — nunca devolve stack ao cliente |
| MFA                          | TOTP (otplib) — enroll/enable/disable |
| Autorização                  | `JwtAuthGuard` (global, `@Public()` libera) + `RolesGuard` + `@Roles()` |

---

## 6. Tempo real

`RealtimeGateway` ([`infra/realtime/realtime.gateway.ts`](../apps/api/src/infra/realtime/realtime.gateway.ts))
autentica **no handshake** (JWT no `auth.token` ou header) e coloca cada cliente na room
`tenant:{id}`. Eventos são emitidos por tenant (`emitToTenant`), nunca em broadcast global —
o isolamento vale também para o tempo real. O `@socket.io/redis-adapter` (montado no `main.ts`)
propaga eventos entre instâncias, permitindo escala horizontal.
Ver [ADR-0002](adr/ADR-0002-comunicacao-tempo-real.md).

Eventos: `import:progress`, `import:done`, novo chamado na triagem, nova resposta, relatório pronto.

---

## 7. Processamento assíncrono

Filas BullMQ sobre Redis, consumidas pelo **worker** (processo separado). Ver
[ADR-0003](adr/ADR-0003-processamento-assincrono.md).

- **Importação de planilhas** — `modules/imports/`. O controller valida e enfileira; retorna
  **202** com o `ImportJob`. O `ImportProcessor` faz parse + validação linha a linha, grava
  clientes com `tenantId` explícito, persiste erros por linha e emite progresso via Socket.IO.
- **Geração de relatórios** — `modules/reports/`. Mesmo padrão: enfileira, gera XLSX no worker,
  disponibiliza download quando pronto e avisa por socket.

Ambos rastreiam estado em tabela (`ImportJob` / `ReportJob`, enum `ImportStatus`), então o
progresso sobrevive a reconexão do cliente — o socket é notificação, não fonte da verdade.

---

## 8. Observabilidade

- **Logs estruturados** — Pino (`nestjs-pino`), JSON em produção, `pino-pretty` em dev.
- **Correlation-id** — `genReqId` no `LoggerModule` reaproveita `x-request-id` recebido ou gera
  um UUID, e devolve no response header. Toda linha de log carrega o `reqId`.
- **Exception filter global** — `AllExceptionsFilter` padroniza o corpo de erro e esconde stack.
- **Health / readiness** — `modules/health/` com `@nestjs/terminus`; `prisma.health.ts` checa o
  banco (`SELECT 1`). `GET /health` fica fora do prefixo `/api`.

---

## 9. Modelo de dados

Fonte da verdade: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).
Toda tabela de negócio carrega `tenantId` (exceto `Tenant`).

| Tabela            | Papel |
|-------------------|-------|
| `Tenant`          | Empresa — raiz do isolamento |
| `User`            | Usuário (papel, OAuth, MFA, soft-delete) |
| `RefreshToken`    | Refresh opaco (só hash), com `family` para rotação + detecção de reuso |
| `Client`          | Cliente atendido (CNPJ/CEP), `@@unique([tenantId, cnpj])` |
| `Ticket`          | Chamado — ciclo `TRIAGEM → ABERTO → EM_ANDAMENTO → RESOLVIDO → FECHADO` |
| `TicketResponse`  | Resposta de um chamado |
| `Attachment`      | Anexo de uma resposta (arquivo em disco, caminho relativo) |
| `ImportJob`       | Job de importação (status, progresso, erros por linha) |
| `ReportJob`       | Job de geração de relatório |
| `AuditLog`        | Trilha append-only (login, CRUD, mudança de papel) |

Enums: `Papel`, `Area`, `Prioridade`, `StatusChamado`, `ImportStatus`.

---

## 10. Decisões registradas (ADRs)

| ADR | Decisão |
|-----|---------|
| [ADR-0001](adr/ADR-0001-estrategia-multi-tenant.md) | Estratégia multi-tenant (banco único + `tenantId`) |
| [ADR-0002](adr/ADR-0002-comunicacao-tempo-real.md)  | Comunicação em tempo real (Socket.IO + adapter Redis) |
| [ADR-0003](adr/ADR-0003-processamento-assincrono.md)| Processamento assíncrono (BullMQ + worker) |
| [ADR-0004](adr/ADR-0004-modelo-de-identidade-e-auth.md) | Modelo de identidade e autenticação |

Sequências detalhadas dos fluxos-chave em [FLUXOS.md](FLUXOS.md).
