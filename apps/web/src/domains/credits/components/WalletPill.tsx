"use client";

import React from "react";
import { Coins, Plus } from "lucide-react";
import { formatCredits } from "@/shared/utils/formatCurrency";

export interface WalletPillProps {
  availableCredits: number;
  onTopUpClick?: () => void;
}

export function WalletPill({
  availableCredits = 0,
  onTopUpClick,
}: WalletPillProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-xs">
      <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
        <Coins className="w-3.5 h-3.5" />
      </div>
      <span className="text-xs font-bold text-foreground">
        {formatCredits(availableCredits)}{" "}
        <span className="text-[10px] text-muted-foreground font-normal">CR</span>
      </span>
      {onTopUpClick && (
        <button
          onClick={onTopUpClick}
          className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity ml-1 cursor-pointer"
          title="Buy Credits"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
