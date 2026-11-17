"use client";

import React from "react";
import { X, Check, Zap } from "lucide-react";
import { Button } from "@/shared/ui/atoms/Button";
import { formatCurrency, formatCredits } from "@/shared/utils/formatCurrency";
import type { CreditPack } from "../types";

export interface PackPurchaseModalProps {
  isOpen: boolean;
  packs: CreditPack[];
  isLoading?: boolean;
  onSelectPack: (packId: string) => void;
  onClose: () => void;
}

export function PackPurchaseModal({
  isOpen,
  packs,
  isLoading = false,
  onSelectPack,
  onClose,
}: PackPurchaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">Top-Up Credit Packs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Power your autonomous fleet with instant double-entry ledger credits.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                pack.popular
                  ? "border-primary bg-primary/5 shadow-md relative"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                  Popular
                </span>
              )}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-foreground">{pack.name}</h4>
                <div className="space-y-1">
                  <span className="text-2xl font-bold text-foreground">
                    {formatCurrency(pack.priceUsd)}
                  </span>
                  <div className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{formatCredits(pack.credits)} Credits</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant={pack.popular ? "primary" : "outline"}
                  size="sm"
                  className="w-full"
                  isLoading={isLoading}
                  onClick={() => onSelectPack(pack.id)}
                >
                  Purchase Pack
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
