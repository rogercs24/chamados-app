'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';
import { useApi } from '../../../lib/use-api';
import { useToast } from '../../../components/toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Spinner,
} from '../../../components/ui';
import { PAPEL_LABEL } from '../../../lib/format';
import type { Paginated, Papel, Usuario } from '../../../lib/types';

const PAPEIS: Papel[] = [
  'ADMIN',
  'TRIAGEM',
  'TI',
  'TRADE',
  'OPERACOES',
  'SOLICITANTE',
  'SUPER_ADMIN',
];

export default function UsuariosPage() {
  const { data, loading, recarregar } = useApi<Paginated<Usuario>>(
    '/users?limit=100',
  );
  const toast = useToast();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    papel: 'SOLICITANTE' as Papel,
  });
  const [criando, setCriando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setCriando(true);
    try {
      await api('/users', { method: 'POST', body: form });
      toast('Usuário criado', 'sucesso');
      setForm({ nome: '', email: '', senha: '', papel: 'SOLICITANTE' });
      setAberto(false);
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    } finally {
      setCriando(false);
    }
  }

  async function mudarPapel(id: string, papel: string) {
    try {
      await api(`/users/${id}/role`, { method: 'PATCH', body: { papel } });
      toast('Permissão atualizada', 'sucesso');
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover este usuário?')) return;
    try {
      await api(`/users/${id}`, { method: 'DELETE' });
      toast('Usuário removido', 'sucesso');
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        subtitle="Cadastro e permissões"
        action={
          <Button onClick={() => setAberto((v) => !v)}>
            {aberto ? 'Cancelar' : 'Novo usuário'}
          </Button>
        }
      />

      {aberto && (
        <Card className="mb-6 p-5">
          <form onSubmit={criar} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Senha" hint="mínimo 8 caracteres">
              <Input
                type="password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                required
                minLength={8}
              />
            </Field>
            <Field label="Papel">
              <Select
                value={form.papel}
                onChange={(e) =>
                  setForm({ ...form, papel: e.target.value as Papel })
                }
              >
                {PAPEIS.map((p) => (
                  <option key={p} value={p}>
                    {PAPEL_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={criando}>
                Criar usuário
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="grid h-40 place-items-center">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState>Nenhum usuário cadastrado.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.nome}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.papel}
                      onChange={(e) => mudarPapel(u.id, e.target.value)}
                      className="w-40 py-1 text-xs"
                    >
                      {PAPEIS.map((p) => (
                        <option key={p} value={p}>
                          {PAPEL_LABEL[p]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        u.ativo === false
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }
                    >
                      {u.ativo === false ? 'Inativo' : 'Ativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remover(u.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
