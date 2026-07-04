# ADR-0004 — Modelo de identidade e autenticação

- **Status:** Aceito
- **Data:** 2026-07-03

## Contexto

O edital exige: login e-mail/senha, OAuth Google, OAuth GitHub, MFA/TOTP, JWT,
refresh token e proteção contra abuso. Num sistema multi-tenant, duas questões
precisam de decisão explícita: **como o e-mail se relaciona com o tenant** e
**qual o formato do refresh token**.

## Decisões

### 1. E-mail é globalmente único na plataforma

`User.email` tem constraint `@unique` global (não `@@unique([tenantId, email])`).

**Por quê:** simplifica e endurece a autenticação — login e OAuth resolvem o
usuário só pelo e-mail, sem precisar de "qual tenant?" no formulário nem de um
seletor de empresa. Cada pessoa pertence a uma empresa (contexto de holding com
unidades), então a colisão de e-mail entre tenants não é um caso real do produto.

**Importante:** isso **não** enfraquece o isolamento de dados. O isolamento vale
para os dados de negócio (clientes, chamados, etc.), que continuam com `tenantId`
e escopo forçado pela Prisma Extension (ADR-0001). O e-mail global afeta só a
camada de identidade. O `tenantId` do usuário viaja no JWT e define o escopo.

### 2. Access token = JWT · Refresh token = opaco, rotativo, com detecção de reuso

- **Access token:** JWT assinado (HS256), curta duração (15 min), payload
  `{ sub, tenantId, papel, email }`. Stateless.
- **Refresh token:** string aleatória opaca (não-JWT), guardada **apenas como
  hash SHA-256** no banco. Longa duração (7 dias). Revogável.

**Rotação + detecção de reuso:** cada refresh pertence a uma "família". Ao usar um
refresh válido, ele é revogado e um novo é emitido na mesma família. Se um refresh
**já revogado** for reapresentado (sinal de vazamento/roubo), toda a família é
revogada — encerrando as sessões derivadas daquele token.

**Por quê opaco e não JWT:** refresh precisa ser **revogável**; um JWT stateless
não dá para invalidar antes de expirar. Guardar só o hash evita que um dump do
banco exponha tokens utilizáveis.

### 3. Hashing de senha com Argon2id

`@node-rs/argon2` (binário Rust pré-compilado, sem node-gyp). Argon2id é o padrão
recomendado atual (memory-hard), superior a bcrypt contra ataque com GPU.

### 4. MFA/TOTP opcional por usuário

Segredo TOTP (otplib) gerado no enroll, confirmado com um código válido antes de
ativar (`mfaEnabled`). Com MFA ativo, o login exige o código de 6 dígitos.

### 5. OAuth (Google/GitHub) vincula a usuário existente

O OAuth **autentica**, não **provisiona**: casa o e-mail do provedor com um usuário
já existente e grava `googleId`/`githubId` no primeiro uso. Se não houver usuário
com aquele e-mail, o login é negado (a criação de usuários é ação administrativa,
Fase 2). Evita criação implícita de contas/tenants por qualquer pessoa com um Google.

## Proteção contra abuso

Rate-limit (`@nestjs/throttler`) com store no **Redis** aplicado aos endpoints de
autenticação (login, refresh, MFA), limitando tentativas por IP. Complementa o
lockout implícito do Argon2 (custo por tentativa).

## Consequências

- ➕ Auth simples de usar, revogável, resistente a vazamento e a brute-force.
- ➖ Uma pessoa não pode ter o mesmo e-mail em dois tenants — aceitável no contexto.
