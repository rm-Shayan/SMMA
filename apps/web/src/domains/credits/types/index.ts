export interface Wallet {
  companyId: string;
  balance: number;
  reserved: number;
  available: number;
  currency: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  popular?: boolean;
}

export interface LedgerTransaction {
  id: string;
  amount: number;
  entryType: "credit" | "debit";
  reason: string;
  createdAt: string;
  referenceId?: string;
}
