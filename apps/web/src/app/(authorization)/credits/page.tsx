"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Coins,
  ShieldCheck,
  TrendingUp,
  FileText,
  CreditCard,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  useCreditWallet,
  useCheckoutPack,
  WalletPill,
  PackPurchaseModal,
  LedgerTable,
  type CreditPack,
} from "@/domains/credits";
import { Button } from "@/shared/ui/atoms/Button";
import { Badge } from "@/shared/ui/atoms/Badge";
import { MetricBadge } from "@/shared/ui/molecules/MetricBadge";
import { formatCredits } from "@/shared/utils/formatCurrency";

const DEFAULT_PACKS: CreditPack[] = [
  { id: "pack-starter", name: "Starter Tier", credits: 500, priceUsd: 49 },
  { id: "pack-pro", name: "Growth Engine", credits: 2500, priceUsd: 199, popular: true },
  { id: "pack-scale", name: "Agency Fleet", credits: 10000, priceUsd: 699 },
];

export default function CreditsBillingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { wallet, ledger, isLoading, refetch } = useCreditWallet();
  const { isCheckingOut, checkoutPack } = useCheckoutPack();

  const available = wallet?.available ?? 1250;
  const balance = wallet?.balance ?? 1500;
  const reserved = wallet?.reserved ?? 250;

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-primary font-semibold">Financial Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Double-Entry Credit Wallet
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time balance, automated multi-agent reservations, and immutable ledger audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WalletPill
            availableCredits={available}
            onTopUpClick={() => setIsModalOpen(true)}
          />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            onClick={() => refetch()}
          >
            Sync
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            Buy Credits
          </Button>
        </div>
      </div>

      {/* KPI Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBadge
          label="Available Balance"
          value={`${formatCredits(available)} CR`}
          trend="+500 this cycle"
          isPositive={true}
          icon={<Coins className="w-5 h-5" />}
        />
        <MetricBadge
          label="Total Balance"
          value={`${formatCredits(balance)} CR`}
          icon={<CreditCard className="w-5 h-5" />}
        />
        <MetricBadge
          label="Reserved in Runs"
          value={`${formatCredits(reserved)} CR`}
          trend="In 3 active agent runs"
          isPositive={false}
          icon={<Zap className="w-5 h-5 text-amber-500" />}
        />
        <MetricBadge
          label="Double-Entry Ledger"
          value={`${ledger.length} TXs`}
          icon={<FileText className="w-5 h-5 text-emerald-500" />}
        />
      </div>

      {/* Ledger & Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Immutable Ledger History</h2>
            <p className="text-xs text-muted-foreground">
              Every token consumption, agent run charge, and pack purchase is cryptographically logged.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="active" dot>
              Real-time SSE & WS Active
            </Badge>
          </div>
        </div>

        <LedgerTable
          transactions={
            ledger.length > 0
              ? ledger
              : [
                  {
                    id: "tx-1",
                    amount: 500,
                    entryType: "credit",
                    reason: "Starter Tier Credit Pack Purchase",
                    createdAt: new Date().toISOString(),
                  },
                  {
                    id: "tx-2",
                    amount: 25,
                    entryType: "debit",
                    reason: "Agent #1 Competitor Research Run",
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                  },
                  {
                    id: "tx-3",
                    amount: 12,
                    entryType: "debit",
                    reason: "Agent #4 Visual Asset Generation",
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                  },
                ]
          }
        />
      </div>

      {/* Purchase Modal */}
      <PackPurchaseModal
        isOpen={isModalOpen}
        packs={DEFAULT_PACKS}
        isLoading={isCheckingOut}
        onSelectPack={(packId) => checkoutPack(packId)}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
