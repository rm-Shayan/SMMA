"use client";

import { useState, useEffect, useCallback } from "react";
import { creditsApi } from "../api/credits.api";
import type { Wallet, LedgerTransaction } from "../types";
import { useWebSocket } from "@/shared/hooks/useWebSocket";

export function useCreditWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [walletRes, ledgerRes] = await Promise.allSettled([
        creditsApi.getWallet(),
        creditsApi.getLedger(),
      ]);

      if (walletRes.status === "fulfilled") setWallet(walletRes.value);
      if (ledgerRes.status === "fulfilled") setLedger(ledgerRes.value);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Real-time balance update listener
  useWebSocket("all", () => {
    fetchWalletData();
  });

  return { wallet, ledger, isLoading, refetch: fetchWalletData };
}
