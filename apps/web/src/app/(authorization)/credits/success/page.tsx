"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, Wallet, Sparkles } from "lucide-react";
import { useGetBalanceQuery } from "@/redux/api/creditsApi";

export default function CreditsSuccessPage() {
  const { data: balanceData, isLoading } = useGetBalanceQuery();
  const companyBalance = balanceData?.companyWallet?.balance;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Payment Successful!
          </h1>
          <p className="text-sm text-secondary">
            Your credit purchase has been verified and applied to your company wallet.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-secondary">
            <Wallet className="w-4 h-4 text-primary" />
            <span>Updated Balance</span>
          </div>
          <div className="text-lg font-bold text-on-surface tabular-nums flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isLoading ? "Updating..." : (companyBalance ?? 0).toLocaleString()}</span>
            <span className="text-xs font-normal text-secondary">cr</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/credits"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span>View Wallet</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
