# Fluxos — Plataforma de Chamados SaaS Multi-Tenant

> Sequências dos fluxos-chave, como implementados. Complementa a [ARQUITETURA](ARQUITETURA.md)
> (componentes e mecanismos). Cada fluxo cita os arquivos reais que o executam.

Convenção dos diagramas: `→` chamada síncrona, `⇢` evento assíncrono (fila/socket),
`✗` caminho de falha.

---

## 1. Onboarding — registro cria Tenant + primeiro SUPER_ADMIN

Endpoint público `POST /api/auth/register` (rate-limit 10/min).
[`auth.controller.ts`](../apps/api/src/modules/auth/auth.controller.ts) →
`RegisterUseCase`.

```
Cliente → POST /api/auth/register { empresa, nome, email, senha }
   │
   ├─ cria Tenant (nome + slug)                         PrismaService base (cross-tenant)
   ├─ cria User papel=SUPER_ADMIN, senhaHash=argon2(senha)
   ├─ emite par de tokens (access + refresh)            TokenService.issuePair
   ├─ grava AuditLog(acao="register")
   └─ Set-Cookie: refresh (httpOnly, SameSite)  +  body { usuario, accessToken }
```

O registro é a única forma de criar um tenant. A partir daí, o SUPER_ADMIN cria demais usuários.

---

## 2. Login (com MFA quando ativo)

Endpoint público `POST /api/auth/login` (rate-limit 5/min).
`LoginUseCase` ([`login.use-case.ts`](../apps/api/src/modules/auth/use-cases/login.use-case.ts)).

```
Cliente → POST /api/auth/login { email, senha, mfaCode? }
   │
   ├─ busca user por email
   ├─ verifica argon2(senha)                    ✗ falha genérica (não revela se email existe)
   ├─ conta ativa?                              ✗ 401 "conta desativada"
   ├─ se user.mfaEnabled:
   │     ├─ mfaCode ausente  →  ✗ 401 "MFA obrigatório: informe mfaCode"
   │     └─ TOTP inválido    →  ✗ 401 + AuditLog(motivo="mfa_invalido")
   ├─ emite par de tokens
   └─ Set-Cookie: refresh  +  body { usuario, accessToken }
```

**Nota de segurança:** senha errada e e-mail inexistente devolvem a **mesma** falha genérica —
não vazam qual dos dois estava errado. MFA é validado *após* a senha, e a falha é auditada.

---

## 3. Refresh rotativo com detecção de reuso

Endpoint público `POST /api/auth/refresh` (rate-limit 20/min). O refresh token vem do cookie
`httpOnly` (ou do body, para clientes não-browser). `TokenService.rotate`
([`token.service.ts`](../apps/api/src/modules/auth/services/token.service.ts)).

Cada refresh token pertence a uma **família** (`family`). Rotacionar revoga o token antigo e
emite um novo na mesma família. Apresentar um token **já revogado** = sinal de vazamento →
a família inteira é encerrada.

```
Cliente → POST /api/auth/refresh  (cookie: refresh)
   │
   ├─ hash(token) existe?                    ✗ não → 401
   ├─ token.revogadoEm != null ?
   │     └─ SIM → REUSO DETECTADO:
   │             revoga toda a família (revogadoEm = now)   ✗ 401 (sessão comprometida)
   ├─ token expirado?                        ✗ 401
   ├─ revoga o token atual (substituidoPorId = novo)
   ├─ cria novo refresh na MESMA family
   ├─ emite novo access token
   └─ Set-Cookie: refresh novo  +  body { accessToken }
```

Resultado: um refresh token roubado só serve **uma vez**; no uso legítimo seguinte, o reuso é
detectado e toda a sessão cai. `logout` revoga o token apresentado; `revokeAllForUser` derruba
todas as sessões de um usuário.

---

## 4. Requisição autenticada isolada por tenant (o caminho do isolamento)

Vale para **toda** rota protegida. Ver ARQUITETURA §4.

```
Cliente → GET /api/tickets   (Authorization: Bearer <access>)
   │
   ├─ TenantContextMiddleware      abre escopo AsyncLocalStorage: store = {}
   ├─ JwtAuthGuard                 valida o access token (rota não @Public)
   ├─ JwtStrategy.validate         ctx.set({ tenantId, userId, papel })   ← preenche o contexto
   ├─ RolesGuard                   confere @Roles() da rota (se houver)
   ├─ Controller → UseCase → Repository
   │        Repository usa TENANT_PRISMA (cliente estendido)
   │        tenantExtension lê ctx.tenantId e injeta where.tenantId
   │              └─ sem contexto → LANÇA (fail-closed; nada vaza)
   └─ Presenter molda a saída  →  200
```

Um recurso de outro tenant simplesmente **não existe** para esta query — a lista nunca o traz,
e um acesso direto por id (via `findFirst` com escopo) retorna vazio → **404**, não 403.

---

## 5. Ciclo de vida de um chamado

[`tickets.controller.ts`](../apps/api/src/modules/tickets/tickets.controller.ts). Estados:
`TRIAGEM → ABERTO → EM_ANDAMENTO → RESOLVIDO → FECHADO`.

```
① Abertura     POST /api/tickets                 qualquer usuário do tenant
               status = TRIAGEM (sem prioridade/área ainda)
                  │
② Triagem      PATCH /api/tickets/:id/triagem     @Roles(SUPER_ADMIN, ADMIN, TRIAGEM)
               define prioridade + área  →  status = ABERTO
               ⇢ emite evento de tempo real ao tenant
                  │
③ Atendimento  POST /api/tickets/:id/responses    atendente da área responde
               (primeira resposta grava primeiraRespostaEm — métrica do dashboard)
               PATCH /api/tickets/:id/status  →  EM_ANDAMENTO
                  │
④ Resolução    PATCH /api/tickets/:id/status  →  RESOLVIDO  →  FECHADO (fechadoEm)
```

**Visibilidade por área:** um atendente (TI/TRADE/OPERACOES) enxerga os chamados da sua área;
ADMIN/TRIAGEM enxergam todos do tenant. A regra vive no use-case e é coberta por
[`ticket-access.spec.ts`](../apps/api/src/modules/tickets/ticket-access.spec.ts).

---

## 6. Anexo em uma resposta

`POST /api/tickets/:id/responses` aceita upload (multipart). O arquivo é gravado em disco por
`FileStorageService` ([`infra/storage/`](../apps/api/src/infra/storage/file-storage.service.ts));
só o **caminho relativo** vai para `Attachment`. O download é protegido:

```
Download   GET /api/tickets/:ticketId/attachments/:attachmentId
   │
   ├─ requisição autenticada → contexto de tenant preenchido
   ├─ Attachment é modelo isolado → só resolve se pertencer ao tenant   ✗ senão 404
   └─ stream do arquivo do disco
```

Isso impede que um id de anexo de outro tenant (ou adivinhado) seja baixado.

---

## 7. Importação assíncrona de planilha (CSV/XLSX)

Requisito clássico "202 + progresso". [`imports/`](../apps/api/src/modules/imports/) +
[`import.processor.ts`](../apps/api/src/modules/imports/import.processor.ts). Ver
[ADR-0003](adr/ADR-0003-processamento-assincrono.md).

```
Cliente → POST /api/imports/clients  (arquivo)
   │
   ├─ parseia a planilha (SpreadsheetParser)
   ├─ cria ImportJob(status=PENDENTE, total=N)
   ├─ enfileira job na fila BullMQ (Redis)
   └─ 202 Accepted { importJob }          ← a request retorna JÁ, sem processar

   ⇢ Worker consome a fila (ImportProcessor)
        ├─ setProcessando
        ├─ para cada linha:
        │     ├─ valida CNPJ (14 díg.) + razaoSocial
        │     ├─ cria Client (tenantId EXPLÍCITO — fora do ciclo HTTP)
        │     ├─ P2002 (CNPJ duplicado) → registra erro na linha, segue
        │     └─ a cada 5 linhas ⇢ import:progress (Socket.IO, room tenant:{id})
        └─ finish(CONCLUIDO, sucesso, falhas, erros[:100])  ⇢ import:done
```

O `ImportJob` guarda o progresso no banco, então mesmo que o cliente recarregue a página o
estado é recuperável — o socket é só a notificação em tempo real, não a fonte da verdade.

---

## 8. Geração assíncrona de relatório

[`reports/`](../apps/api/src/modules/reports/). Mesmo padrão da importação, sentido inverso:

```
Cliente → POST /api/reports/tickets  (filtros)
   │
   ├─ cria ReportJob(status=PENDENTE)
   ├─ enfileira na fila BullMQ
   └─ 202 { reportJob }

   ⇢ Worker (ReportProcessor)
        ├─ consulta agregada dos chamados do tenant
        ├─ gera XLSX, grava em disco (caminho no ReportJob)
        └─ status = CONCLUIDO  ⇢ evento "relatório pronto" (socket)

Cliente → GET download do relatório quando status = CONCLUIDO
```

Relatórios grandes não travam a request de origem — todo o trabalho pesado roda no worker.

---

## 9. Conexão de tempo real (handshake)

[`realtime.gateway.ts`](../apps/api/src/infra/realtime/realtime.gateway.ts). Ver
[ADR-0002](adr/ADR-0002-comunicacao-tempo-real.md).

```
Cliente conecta Socket.IO  (auth: { token: <access JWT> })
   │
   ├─ handleConnection: extrai token (auth.token ou header)
   ├─ jwt.verify(token, JWT_ACCESS_SECRET)     ✗ inválido → emit "erro" + disconnect
   ├─ client.join(`tenant:{tenantId}`)          ← isolamento também no tempo real
   └─ conectado; passa a receber emitToTenant(tenantId, ...)
```

Eventos nunca vão em broadcast global — sempre para a room do tenant. O adapter Redis
(`main.ts`) garante que um evento emitido em qualquer instância alcança os clientes conectados
em todas elas.

---

## Referências

- [ARQUITETURA.md](ARQUITETURA.md) — componentes, camadas e o mecanismo de isolamento
- [PLANO-DE-EXECUCAO.md](PLANO-DE-EXECUCAO.md) — fases e rastreabilidade de requisitos
- [ADRs](adr/) — decisões pontuais justificadas
