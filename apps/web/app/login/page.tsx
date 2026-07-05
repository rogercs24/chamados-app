'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, Input } from '../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [precisaMfa, setPrecisaMfa] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 to-indigo-100 p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            C
          </div>
          <h1 className="text-xl font-bold text-slate-900">Chamados SaaS</h1>
          <p className="text-sm text-slate-500">Acesse sua conta</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="voce@empresa.com"
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </Field>
          {precisaMfa && (
            <Field label="Código MFA">
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
              />
            </Field>
          )}
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Não tem conta?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Criar empresa
          </Link>
        </p>
      </Card>
    </div>
  );
}
