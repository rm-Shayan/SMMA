/**
 * RTK Query Credits & Billing API — /api/v1/credits endpoints.
 *
 * Wallets, ledger transactions, purchases and team allocations backed by the
 * live FastAPI credits router.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface CreditWalletDto {
  id: string;
  company_id: string;
  user_id: string | null;
  balance: number;
  reserved: number;
  available?: number;
}

export interface BalanceResponse {
  success: boolean;
  companyWallet: CreditWalletDto | null;
  userWallet: CreditWalletDto | null;
}

export interface WalletsResponse {
  success: boolean;
  wallets: CreditWalletDto[];
}

export type CreditTransactionType =
  | "purchase"
  | "grant"
  | "allocate"
  | "revoke"
  | "reserve"
  | "consume"
  | "release"
  | "expire";

export interface CreditTransactionDto {
  id: string;
  wallet_id: string;
  counter_wallet_id?: string | null;
  type: CreditTransactionType | string;
  amount: number;
  created_by?: string | null;
  note?: string | null;
  created_at?: string | null;
}

export interface TransactionsResponse {
  success: boolean;
  transactions: CreditTransactionDto[];
}

export interface CreditPackDto {
  name: string;
  credits: number;
  priceUsd: number;
}

export interface CreditPacksResponse {
  success: boolean;
  packs: Record<string, CreditPackDto>;
}

export interface AllocateCreditsPayload {
  userId: string;
  amount: number;
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, method = "GET", body, params }: BaseQueryArgs) {
  try {
    const data =
      method === "POST"
        ? await apiPost(url, body, { params })
        : await apiGet(url, { params });
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } },
    };
  }
}

export const creditsApi = createApi({
  reducerPath: "creditsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Balance", "Wallet", "Ledger"],
  endpoints: (builder) => ({
    getBalance: builder.query<BalanceResponse, void>({
      query: () => ({ url: "/credits/balance", method: "GET" }),
      providesTags: ["Balance"],
    }),

    getPacks: builder.query<CreditPacksResponse, void>({
      query: () => ({ url: "/credits/packs", method: "GET" }),
    }),

    getWallets: builder.query<WalletsResponse, void>({
      query: () => ({ url: "/credits/wallets", method: "GET" }),
      providesTags: ["Wallet"],
    }),

    getLedger: builder.query<TransactionsResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/credits/transactions",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: ["Ledger"],
    }),

    buyCredits: builder.mutation<{ success: boolean; wallet: CreditWalletDto }, { amount: number }>({
      query: (body) => ({
        url: "/credits/purchase",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Balance", "Wallet", "Ledger"],
    }),

    createCheckoutSession: builder.mutation<
      {
        success: boolean;
        enabled: boolean;
        bypassed?: boolean;
        checkoutUrl?: string | null;
        credits: number;
        priceUsd: number;
        wallet?: CreditWalletDto;
        message?: string;
      },
      { packId?: string; credits?: number }
    >({
      query: (body) => ({
        url: "/credits/checkout-session",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Balance", "Wallet", "Ledger"],
    }),

    allocateCredits: builder.mutation<
      { success: boolean; companyWallet: CreditWalletDto; userWallet: CreditWalletDto },
      AllocateCreditsPayload
    >({
      query: (body) => ({
        url: "/credits/allocate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Balance", "Wallet", "Ledger"],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useGetPacksQuery,
  useGetWalletsQuery,
  useGetLedgerQuery,
  useBuyCreditsMutation,
  useCreateCheckoutSessionMutation,
  useAllocateCreditsMutation,
} = creditsApi;

export const useGetCreditBalanceQuery = useGetBalanceQuery;
export const useStripeCheckoutMutation = useCreateCheckoutSessionMutation;
