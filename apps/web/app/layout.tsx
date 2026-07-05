import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../lib/auth';
import { ToastProvider } from '../components/toast';

export const metadata: Metadata = {
  title: 'Chamados SaaS — Plataforma',
  description: 'Plataforma administrativa multi-tenant de gestão de chamados',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
