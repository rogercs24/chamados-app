'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { getApiBase } from '../../lib/api';
import { Input } from '../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [precisaMfa, setPrecisaMfa] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  // Mensagem vinda de um redirect de OAuth que falhou (?erro=...).
  useEffect(() => {
    const msg = new URLSearchParams(window.location.search).get('erro');
    if (msg) setErro(msg);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, senha, precisaMfa ? mfaCode : undefined);
      router.push('/dashboard');
    } catch (err) {
      const msg = (err as Error).message;
      if (/mfa/i.test(msg)) {
        setPrecisaMfa(true);
        setErro('Informe o código de 6 dígitos do seu app autenticador.');
      } else {
        setErro(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Fundo Sinka */}
      <div className="fixed inset-0 -z-10 bg-[#0b1a12]">
        <Image
          src="/sinka-bg.jpg"
          alt="Sinka — Inteligência em Logística"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081410]/80 via-[#081410]/40 to-[#081410]/95" />
      </div>

      <div className="flex min-h-screen flex-col justify-center gap-10 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-16 lg:px-24">
        {/* Marca (à esquerda, sobre a imagem) */}
        <div className="hidden max-w-md md:block">
          <p className="text-3xl font-light leading-tight text-white/90">
            Central de <span className="font-semibold">Chamados</span>
          </p>
          <p className="mt-3 text-lg text-[#8fce4f]">Inteligência em Logística</p>
        </div>

        {/* Painel de login (à direita) */}
        <div className="w-full max-w-sm rounded-2xl bg-[#0d1c14]/85 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur">
          <h1 className="mb-6 text-center text-xl font-bold tracking-tight text-white">
            Login Chamados Sinka
          </h1>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="voce@empresa.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">Senha</label>
              <div className="relative">
                <Input
                  type={verSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400 hover:text-slate-600"
                >
                  {verSenha ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {precisaMfa && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-200">Código MFA</label>
                <Input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
              </div>
            )}

            {erro && <p className="text-sm text-red-400">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7cb342] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6ba035] disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Login'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            ou
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <a
            href={`${getApiBase()}/auth/github`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Entrar com GitHub
          </a>

          <p className="mt-5 text-center text-sm text-slate-400">
            Não tem conta?{' '}
            <Link href="/register" className="font-medium text-[#8fce4f] hover:underline">
              Criar empresa
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-slate-500">
            Ao usar o sistema, você concorda com nossa Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
