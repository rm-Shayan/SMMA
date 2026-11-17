'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MailCheck, 
  Share2, 
  BookOpen, 
  Cpu, 
  ShieldCheck, 
  Bot 
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Campaigns & Email', href: '/campaigns', icon: MailCheck },
  { label: 'Social & Pacing', href: '/social', icon: Share2 },
  { label: 'Knowledge & SOP', href: '/knowledge', icon: BookOpen },
  { label: 'Supervisor & Ops', href: '/orchestration', icon: Cpu },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-100 text-base tracking-wide">STYRE-BOT</span>
          <span className="block text-[10px] text-indigo-400 font-medium uppercase tracking-wider">12-Agent System</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Security & RLS Footnote */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/60">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Tenant Isolated (RLS Active)</span>
        </div>
      </div>
    </aside>
  );
};

