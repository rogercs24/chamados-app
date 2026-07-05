import { Reveal } from '../components/reveal';

const PLATAFORMA_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const FEATURES = [
  {
    icone: '🏢',
    titulo: 'Multi-tenant de verdade',
    texto:
      'Cada empresa com isolamento total de dados, garantido no núcleo da aplicação.',
  },
  {
    icone: '⚡',
    titulo: 'Tempo real',
    texto:
      'Novos chamados, respostas e importações aparecem na hora, sem recarregar a página.',
  },
  {
    icone: '🔐',
    titulo: 'Segurança forte',
    texto:
      'Login, OAuth Google/GitHub, MFA por TOTP, tokens rotativos e proteção contra abuso.',
  },
  {
    icone: '📊',
    titulo: 'Decisão orientada a dados',
    texto:
      'Dashboard com chamados por período, por área e tempo médio de resposta.',
  },
  {
    icone: '🔌',
    titulo: 'Integrações',
    texto:
      'Cadastro de clientes que se autopreenche por CNPJ (BrasilAPI) e CEP (ViaCEP).',
  },
  {
    icone: '📥',
    titulo: 'Importação em massa',
    texto:
      'Suba planilhas CSV/XLSX processadas em segundo plano, com progresso ao vivo.',
  },
];

const PASSOS = [
  { n: '01', titulo: 'Abertura', texto: 'O solicitante registra o chamado.' },
  { n: '02', titulo: 'Triagem', texto: 'A gestão define prioridade e área.' },
  { n: '03', titulo: 'Atendimento', texto: 'A área responde com texto e anexos.' },
  { n: '04', titulo: 'Resolução', texto: 'Status evolui até fechar o chamado.' },
];

export default function Landing() {
  return (
    <main className="overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 font-bold text-white">
              C
            </div>
            <span className="font-semibold">Chamados SaaS</span>
          </div>
          <a
            href={PLATAFORMA_URL}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
          >
            Entrar
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-float absolute -left-20 top-32 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="animate-float absolute -right-16 top-52 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl [animation-delay:2s]" />
          <div className="animate-float absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl [animation-delay:4s]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="animate-fade-up mb-6 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-indigo-200">
            Multi-tenant • Seguro • Tempo real
          </div>
          <h1 className="animate-fade-up text-5xl font-bold leading-tight tracking-tight [animation-delay:100ms] sm:text-6xl">
            Gestão de chamados que{' '}
            <span className="animate-gradient bg-gradient-to-r from-indigo-400 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
              escala com a sua operação
            </span>
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg text-slate-300 [animation-delay:200ms]">
            Triagem inteligente, atendimento por área e indicadores em tempo
            real — com isolamento total entre empresas.
          </p>
          <div className="animate-fade-up mt-9 flex flex-wrap justify-center gap-4 [animation-delay:300ms]">
            <a
              href={PLATAFORMA_URL}
              className="rounded-lg bg-indigo-500 px-7 py-3 font-medium shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400"
            >
              Acessar plataforma
            </a>
            <a
              href="#recursos"
              className="rounded-lg border border-white/20 px-7 py-3 font-medium transition hover:bg-white/10"
            >
              Conhecer recursos
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="recursos" className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Tudo que uma operação séria precisa
          </h2>
          <p className="mt-3 text-slate-400">
            Construído sobre uma base moderna: NestJS, Prisma, Redis e Next.js.
          </p>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.titulo} delay={i * 80}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/[0.07]">
                <div className="mb-4 text-3xl">{f.icone}</div>
                <h3 className="mb-2 text-lg font-semibold">{f.titulo}</h3>
                <p className="text-sm text-slate-400">{f.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-y border-white/5 bg-white/[0.02] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mb-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Do pedido à resolução
            </h2>
            <p className="mt-3 text-slate-400">Um fluxo claro, sem ruído.</p>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-4">
            {PASSOS.map((p, i) => (
              <Reveal key={p.n} delay={i * 120}>
                <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                  <div className="mb-3 text-4xl font-bold text-indigo-500/40">
                    {p.n}
                  </div>
                  <h3 className="mb-1 font-semibold">{p.titulo}</h3>
                  <p className="text-sm text-slate-400">{p.texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SEGURANÇA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/60 to-slate-900 p-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Segurança em cada camada
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              MFA/TOTP, OAuth, JWT com refresh rotativo e detecção de reuso,
              rate-limit, senhas com Argon2id e trilha de auditoria completa.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
              {['MFA/TOTP', 'OAuth Google & GitHub', 'JWT + Refresh', 'Auditoria', 'Rate-limit', 'Argon2id'].map(
                (t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-slate-200"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="px-6 pb-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Pronto para organizar seus chamados?
          </h2>
          <a
            href={PLATAFORMA_URL}
            className="mt-8 inline-block rounded-lg bg-indigo-500 px-8 py-3.5 font-medium shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400"
          >
            Começar agora
          </a>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Chamados SaaS · Plataforma multi-tenant de
        gestão de chamados
      </footer>
    </main>
  );
}
