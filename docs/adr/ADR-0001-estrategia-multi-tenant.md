# ADR-0001 — Estratégia de multi-tenancy

- **Status:** Aceito
- **Data:** 2026-07-03
- **Contexto da avaliação:** o edital exige isolamento de dados entre empresas e
  pede a justificativa da decisão.

## Contexto

A plataforma será usada por múltiplas empresas (tenants). Cada empresa não pode,
em nenhuma hipótese, acessar dados de outra. Banco obrigatório: **MySQL 8**.

Três estratégias possíveis:

1. **Banco único, schema único, coluna `tenantId`** (discriminador por linha).
2. **Banco único, schema por tenant** (um schema MySQL por empresa).
3. **Banco por tenant** (uma instância/DB por empresa).

## Decisão

Adotamos a **opção 1: banco único, schema único, coluna `tenantId`** em toda
tabela de negócio, com isolamento imposto na **camada de aplicação**.

## Justificativa

- **Operação simples e barata:** uma migration, um pool de conexões, um backup.
  Ideal para muitos tenants de porte pequeno/médio — o caso deste produto.
- **MySQL não tem Row-Level Security** (diferente do PostgreSQL). Portanto,
  *qualquer* estratégia exige enforcement no app. Isso remove a principal vantagem
  "de graça" que schema-per-tenant/DB-per-tenant teriam no Postgres, deixando o
  custo operacional dessas opções sem contrapartida de segurança.
- **Escala de migrações:** alterar o schema de N schemas/DBs é operacionalmente
  frágil; num schema único é uma migration só.

## Como o isolamento é garantido (defesa em profundidade)

1. **Contexto de request** (`AsyncLocalStorage`): um interceptor lê o `tenantId`
   do JWT e o coloca no contexto da requisição.
2. **Prisma Client Extension** (ponto único): injeta `where: { tenantId }` em
   leituras/updates/deletes e seta `tenantId` em creates. Impossível "esquecer"
   o filtro em uma query específica.
3. **Teste de isolamento** por recurso: dois tenants, garantindo que A não lê nem
   escreve dados de B (resposta 404, não 403, para não vazar existência).

## Consequências

- ➕ Simplicidade operacional, custo baixo, onboarding instantâneo de tenant.
- ➖ "Barulho" de vizinhança (um tenant pesado afeta os outros) — mitigável com
  índices por `tenantId` e, no futuro, particionamento.
- ➖ A segurança depende de disciplina de código — mitigada pelo ponto único
  (extension) + testes automatizados de isolamento.

## Revisão futura

Se um tenant exigir isolamento físico/compliance, é possível "graduar" aquele
tenant para um banco dedicado sem reescrever a aplicação (a chave de escopo já existe).
