import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/organisms/sidebar';
import { Header } from '../components/organisms/header';

export const metadata: Metadata = {
  title: 'Styre-BOT | Autonomous 12-Agent SaaS Orchestrator',
  description: 'Enterprise multi-tenant autonomous AI agent workforce with credit ledger.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <Sidebar />
        <Header />
        <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-slate-950/40">
          {children}
        </main>
      </body>
    </html>
  );
}
