import React from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatDate } from "@/shared/utils/formatDate";
import { formatCredits } from "@/shared/utils/formatCurrency";
import type { LedgerTransaction } from "../types";

export interface LedgerTableProps {
  transactions: LedgerTransaction[];
}

export function LedgerTable({ transactions }: LedgerTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
        No ledger transactions recorded yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
          <tr>
            <th className="py-3 px-4">Transaction Type</th>
            <th className="py-3 px-4">Description / Reference</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((tx) => {
            const isCredit = tx.entryType === "credit";
            return (
              <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        isCredit
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="font-semibold capitalize text-foreground">
                      {tx.entryType}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-foreground font-medium">{tx.reason}</td>
                <td className="py-3 px-4 text-muted-foreground">{formatDate(tx.createdAt)}</td>
                <td
                  className={`py-3 px-4 text-right font-bold ${
                    isCredit ? "text-emerald-500" : "text-foreground"
                  }`}
                >
                  {isCredit ? "+" : "-"}
                  {formatCredits(tx.amount)} CR
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
