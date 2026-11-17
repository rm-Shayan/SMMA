import React from 'react';
import { Coins, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';

export interface CreditCounterProps {
  balance: number;
  reserved?: number;
  isLow?: boolean;
}

export const CreditCounter: React.FC<CreditCounterProps> = ({
  balance,
  reserved = 0,
  isLow = false,
}) => {
  return (
    <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 shadow-sm">
      <Coins className="w-4 h-4 text-amber-400" />
      <div className="flex items-baseline gap-1.5 text-xs">
        <span className="font-bold text-slate-100">{balance}</span>
        <span className="text-slate-500">credits</span>
        {reserved > 0 && <span className="text-slate-600">({reserved} hold)</span>}
      </div>
      {isLow && (
        <Badge variant="warning" className="gap-1 ml-1">
          <AlertTriangle className="w-3 h-3" /> Low
        </Badge>
      )}
    </div>
  );
};

