import React from 'react';
import { CreditCounter } from '../molecules/credit-counter';
import { Badge } from '../ui/badge';
import { Building2, User } from 'lucide-react';

export interface HeaderProps {
  tenantName?: string;
  userName?: string;
  userRole?: string;
  creditsBalance?: number;
}

export const Header: React.FC<HeaderProps> = ({
  tenantName = 'Acme Global Corp',
  userName = 'Admin User',
  userRole = 'company_admin',
  creditsBalance = 450,
}) => {
  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30 ml-64">
      {/* Active Organization */}
      <div className="flex items-center gap-2.5">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-sm text-slate-200">{tenantName}</span>
        <Badge variant="info" className="text-[10px] uppercase">{userRole}</Badge>
      </div>

      {/* Credits Counter & User Profile */}
      <div className="flex items-center gap-4">
        <CreditCounter balance={creditsBalance} isLow={creditsBalance < 20} />

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="block font-medium text-slate-200">{userName}</span>
            <span className="block text-[10px] text-emerald-400">Connected</span>
          </div>
        </div>
      </div>
    </header>
  );
};

