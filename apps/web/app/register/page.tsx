'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { Button, Card, Field, Input } from '../../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [empresaNome, setEmpresa] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await register(empresaNome, nome, email, senha);
      router.push('/dashboard');
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-100 to-indigo-100 p-4">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">Criar empresa</h1>
          <p className="text-sm text-slate-500">
            Você será o administrador da conta
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nome da empresa">
            <Input
              value={empresaNome}
              onChange={(e) => setEmpresa(e.target.value)}
              required
            />
          </Field>
          <Field label="Seu nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Senha" hint="mínimo 8 caracteres">
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={8}
            />
          </Field>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Criar conta
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
