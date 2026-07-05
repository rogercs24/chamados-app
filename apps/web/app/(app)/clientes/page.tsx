'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';
import { useApi } from '../../../lib/use-api';
import { useToast } from '../../../components/toast';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Spinner,
} from '../../../components/ui';
import type { Cliente, Paginated } from '../../../lib/types';

const VAZIO = {
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  cep: '',
  logradouro: '',
  bairro: '',
  cidade: '',
  uf: '',
  email: '',
  telefone: '',
};

export default function ClientesPage() {
  const { data, loading, recarregar } = useApi<Paginated<Cliente>>(
    '/clients?limit=100',
  );
  const toast = useToast();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ ...VAZIO });
  const [busy, setBusy] = useState(false);

  const set = (campo: string, v: string) => setForm((f) => ({ ...f, [campo]: v }));

  async function buscarCnpj() {
    if (!form.cnpj) return;
    try {
      const d = await api<Record<string, string>>(
        `/clients/lookup/cnpj/${form.cnpj.replace(/\D/g, '')}`,
      );
      setForm((f) => ({
        ...f,
        razaoSocial: d.razaoSocial ?? f.razaoSocial,
        nomeFantasia: d.nomeFantasia ?? f.nomeFantasia,
        cep: d.cep ?? f.cep,
        cidade: d.cidade ?? f.cidade,
        uf: d.uf ?? f.uf,
        telefone: d.telefone ?? f.telefone,
      }));
      toast('Dados do CNPJ preenchidos', 'sucesso');
    } catch (err) {
      toast((err as Error).message, 'erro');
    }
  }

  async function buscarCep() {
    if (!form.cep) return;
    try {
      const d = await api<Record<string, string>>(
        `/clients/lookup/cep/${form.cep.replace(/\D/g, '')}`,
      );
      setForm((f) => ({
        ...f,
        logradouro: d.logradouro ?? f.logradouro,
        bairro: d.bairro ?? f.bairro,
        cidade: d.cidade ?? f.cidade,
        uf: d.uf ?? f.uf,
      }));
      toast('Endereço preenchido', 'sucesso');
    } catch (err) {
      toast((err as Error).message, 'erro');
    }
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/clients', { method: 'POST', body: form });
      toast('Cliente cadastrado', 'sucesso');
      setForm({ ...VAZIO });
      setAberto(false);
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    } finally {
      setBusy(false);
    }
  }

  async function remover(id: string) {
    if (!confirm('Remover este cliente?')) return;
    try {
      await api(`/clients/${id}`, { method: 'DELETE' });
      recarregar();
    } catch (err) {
      toast((err as Error).message, 'erro');
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro com consulta de CNPJ e CEP"
        action={
          <Button onClick={() => setAberto((v) => !v)}>
            {aberto ? 'Cancelar' : 'Novo cliente'}
          </Button>
        }
      />

      {aberto && (
        <Card className="mb-6 p-5">
          <form onSubmit={criar} className="grid gap-4 sm:grid-cols-2">
            <Field label="CNPJ" hint="clique em Buscar para autopreencher">
              <div className="flex gap-2">
                <Input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} required />
                <Button type="button" variant="secondary" onClick={buscarCnpj}>
                  Buscar
                </Button>
              </div>
            </Field>
            <Field label="Razão social">
              <Input value={form.razaoSocial} onChange={(e) => set('razaoSocial', e.target.value)} />
            </Field>
            <Field label="Nome fantasia">
              <Input value={form.nomeFantasia} onChange={(e) => set('nomeFantasia', e.target.value)} />
            </Field>
            <Field label="CEP">
              <div className="flex gap-2">
                <Input value={form.cep} onChange={(e) => set('cep', e.target.value)} />
                <Button type="button" variant="secondary" onClick={buscarCep}>
                  Buscar
                </Button>
              </div>
            </Field>
            <Field label="Cidade">
              <Input value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
            </Field>
            <Field label="UF">
              <Input value={form.uf} onChange={(e) => set('uf', e.target.value)} maxLength={2} />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy}>
                Cadastrar cliente
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
        <EmptyState>Nenhum cliente cadastrado.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Razão social</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {c.razaoSocial}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.cnpj}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.cidade ? `${c.cidade}/${c.uf ?? ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remover(c.id)}
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
