import { httpClient } from "@/shared/http/client";
import type { Wallet, CreditPack, LedgerTransaction } from "../types";

export const creditsApi = {
  getWallet: async (): Promise<Wallet> => {
    const res = await httpClient.get("/credits/wallets/me");
    return res.data;
  },

  getPacks: async (): Promise<CreditPack[]> => {
    const res = await httpClient.get("/credits/packs");
    return res.data;
  },

  getLedger: async (): Promise<LedgerTransaction[]> => {
    const res = await httpClient.get("/credits/ledger");
    return res.data;
  },

  createCheckoutSession: async (packId: string): Promise<{ checkout_url: string; session_id: string }> => {
    const res = await httpClient.post("/credits/checkout", { pack_id: packId });
    return res.data;
  },
};
