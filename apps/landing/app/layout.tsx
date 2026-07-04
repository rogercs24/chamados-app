import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chamados SaaS — Gestão de chamados multi-empresa',
  description:
    'A plataforma multi-tenant para triagem, atendimento e análise de chamados. Rápida, segura e pronta para escalar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
