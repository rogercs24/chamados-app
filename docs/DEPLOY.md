# Deploy

> **Já provisionado** (topologia B — Railway + Vercel):
> - Plataforma: https://web-iota-seven-layqozmpu8.vercel.app
> - Landing: https://landing-sandy-delta-74.vercel.app
> - API: https://api-production-74f4.up.railway.app (`/docs` = Swagger)
>
> Backend (API + worker + MySQL + Redis) no Railway; frontends no Vercel.
> Como os frontends não têm dependências do workspace, seus deploys usam
> `npm install --legacy-peer-deps` a partir da pasta do app (ver `apps/*/vercel.json`).

Tudo o que o deploy precisa está **declarado no repositório**. Publicar = conectar o
repo ao provedor e preencher os segredos. Não há passo manual de build.

- Imagens: [`apps/api/Dockerfile`](../apps/api/Dockerfile) (API **e** worker),
  [`apps/web/Dockerfile`](../apps/web/Dockerfile), [`apps/landing/Dockerfile`](../apps/landing/Dockerfile)
- Railway (config-as-code): [`deploy/railway/*.json`](../deploy/railway/)
- Vercel: [`apps/web/vercel.json`](../apps/web/vercel.json), [`apps/landing/vercel.json`](../apps/landing/vercel.json)
- Stack local de produção: [`docker-compose.prod.yml`](../docker-compose.prod.yml)

---

## Topologias

**A) Tudo no Railway (Docker).** api + worker + web + landing + MySQL + Redis, um provedor só.

**B) Recomendada — Railway + Vercel.** Backend no Railway (api + worker + MySQL + Redis);
frontends Next na Vercel (lar natural do Next: edge, previews por PR, SSR). É a que este guia detalha.

---

## 1. Railway — backend (api + worker + MySQL + Redis)

1. **Novo projeto** a partir deste repositório do GitHub.
2. **Provisione os dados** (botão *New* → *Database*): **MySQL** e **Redis**. O Railway
   expõe as variáveis de referência `${{MySQL.DATABASE_URL}}` e `${{Redis.REDIS_URL}}`.
3. **Serviço `api`** — aponte *Settings → Config-as-code* para `deploy/railway/api.json`.
   (Deixe *Root Directory* vazio: o contexto de build é a raiz do monorepo.)
4. **Serviço `worker`** — outro serviço a partir do mesmo repo, config `deploy/railway/worker.json`.

O `api.json` já roda `prisma migrate deploy` antes de subir e usa `healthcheckPath: /health`.
A API respeita a `PORT` injetada pelo Railway (fallback para 3333).

### Variáveis por serviço (Railway)

| Variável | `api` | `worker` | Origem |
|----------|:---:|:---:|--------|
| `DATABASE_URL` | ✅ | ✅ | `${{MySQL.DATABASE_URL}}` |
| `REDIS_URL` | ✅ | ✅ | `${{Redis.REDIS_URL}}` |
| `NODE_ENV=production` | ✅ | ✅ | fixo |
| `JWT_ACCESS_SECRET` | ✅ | ✅ | segredo (≥16 chars) |
| `JWT_REFRESH_SECRET` | ✅ | ✅ | segredo (≥16 chars) |
| `GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL` | ⬜ | ⬜ | OAuth (opcional) |
| `GITHUB_CLIENT_ID/SECRET/CALLBACK_URL` | ⬜ | ⬜ | OAuth (opcional) |
| `SENTRY_DSN` · `SENTRY_ENVIRONMENT` | ⬜ | ⬜ | observabilidade (opcional) |

> Os callbacks OAuth apontam para o domínio público da API, ex.:
> `https://<api>.up.railway.app/api/auth/google/callback`.

Se optar pela **topologia A**, crie também os serviços `web` (`deploy/railway/web.json`) e
`landing` (`deploy/railway/landing.json`); o `web` precisa do build arg/variável
`NEXT_PUBLIC_API_URL` com a URL pública da API.

---

## 2. Vercel — frontends (web + landing)

Dois projetos Vercel a partir do mesmo repo:

| Projeto | Root Directory | Variável |
|---------|----------------|----------|
| plataforma | `apps/web` | `NEXT_PUBLIC_API_URL` = URL pública da API |
| landing | `apps/landing` | — |

O Vercel detecta pnpm + Turborepo automaticamente; os `vercel.json` de cada app fixam
`framework`, `installCommand` e `buildCommand`. O build é o Next padrão (sem `standalone` —
esse modo é só para as imagens Docker).

---

## 3. Pós-deploy

- **Health:** `GET https://<api>/health` deve responder `200` com `database: up`.
- **Migrations:** aplicadas automaticamente no start da `api` (`prisma migrate deploy`).
- **Seed (opcional):** para dados de demonstração, rode uma vez
  `pnpm --filter @chamados/api seed` com a `DATABASE_URL` de produção (ex.: via
  *Railway Run* ou um job pontual). **Não** rode seed automático em produção real.
- **CORS/OAuth:** confira que os domínios da Vercel estão liberados e que as callback URLs
  do Google/GitHub batem com o domínio público da API.

---

## Checklist de segredos (nunca commitar)

`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`,
`SENTRY_DSN`, e as strings de conexão `DATABASE_URL`/`REDIS_URL` (referências gerenciadas).
Modelo de todas as variáveis em [`.env.example`](../.env.example).
