"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
 Download,
 Search,
 CreditCard,
 Sliders,
 PlusCircle,
 ArrowLeft,
} from "lucide-react";
import BuyCreditsDialog from "@/components/billing/BuyCreditsDialog";
import {
 useGetBalanceQuery,
 useGetLedgerQuery,
 type CreditTransactionDto,
} from "@/redux/api/creditsApi";

interface InvoiceItem {
 id: string;
 invoiceNumber: string;
 date: string;
 description: string;
 credits: number;
 paymentMethod: string;
 status: "Paid" | "Pending";
}

function formatInvoiceDate(value?: string | null): string {
 if (!value) return "—";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function toInvoice(tx: CreditTransactionDto): InvoiceItem {
 const date = tx.created_at ? new Date(tx.created_at) : null;
 const year = date && !Number.isNaN(date.getTime()) ? date.getFullYear() : new Date().getFullYear();
 return {
 id: tx.id,
 invoiceNumber: `INV-${year}-${tx.id.slice(0, 6).toUpperCase()}`,
 date: formatInvoiceDate(tx.created_at),
 description: tx.note || "Credit wallet top-up",
 credits: Number(tx.amount ?? 0),
 paymentMethod: "Credit wallet",
 status: "Paid",
 };
}

export default function CreditsInvoicesPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

 const { data: balanceData } = useGetBalanceQuery();
 const { data: ledgerData, isLoading } = useGetLedgerQuery({ limit: 100 });

 const companyWallet = balanceData?.companyWallet ?? null;
 const availableBalance = companyWallet?.available ?? 0;

 const invoices = useMemo(
 () =>
 (ledgerData?.transactions ?? [])
 .filter((tx) => {
 const type = String(tx.type).toLowerCase();
 return type === "purchase" || type === "grant";
 })
 .map(toInvoice),
 [ledgerData],
 );

 const filteredInvoices = invoices.filter((inv) => {
 const matchesSearch =
 inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
 inv.description.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesStatus =
 statusFilter === "all" || inv.status.toLowerCase() === statusFilter.toLowerCase();
 return matchesSearch && matchesStatus;
 });

 return (
 <div className="flex flex-col w-full pb-12">
 {/* Header & Title Area */}
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
 <div className="space-y-1">
 <div className="flex items-center gap-2.5 text-xs mb-1">
 <Link
 href="/credits"
 className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant shadow-2xs transition-all group"
 >
 <ArrowLeft className="w-3.5 h-3.5 text-secondary group-hover:text-on-surface group-hover:-translate-x-0.5 transition-transform" />
 <span>Back</span>
 </Link>
 <span className="text-outline-variant">•</span>
 <div className="flex items-center gap-1.5">
 <span className="font-semibold uppercase tracking-wider text-outline">
 Administration
 </span>
 <span className="text-outline-variant">/</span>
 <span className="font-bold uppercase tracking-wider text-[#063cbc]">
 Invoices & Tax Receipts
 </span>
 </div>
 </div>
 <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface ">
 Credits & Billing
 </h1>
 <p className="text-sm text-secondary">
 Balance, purchases, tax documentation, and credit accounting ledger
 </p>
 </div>

 <div className="flex items-center gap-2.5 self-start md:self-auto">
 <Link
 href="/credits"
 className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface-variant border border-outline-variant text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-surface-container-lowest transition-colors"
 >
 <Sliders className="w-4 h-4 text-secondary" />
 <span>Manage Ledger</span>
 </Link>
 <button
 type="button"
 onClick={() => setIsBuyModalOpen(true)}
 className="h-9 px-3.5 rounded-lg bg-[#063cbc] hover:bg-[#00298a] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
 >
 <PlusCircle className="w-4 h-4" />
 <span>Buy credits</span>
 </button>
 </div>
 </div>

 {/* Tab Navigation */}
 <div className="flex items-center gap-6 border-b border-outline-variant mb-6">
 <Link
 href="/credits"
 className="pb-3 text-xs font-medium text-secondary hover:text-on-surface transition-colors"
 >
 <span>Ledger</span>
 </Link>
 <Link
 href="/credits/invoices"
 className="relative pb-3 flex items-center gap-2 text-xs font-bold text-[#063cbc]"
 >
 <span>Invoices</span>
 <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary-fixed text-[#063cbc] font-semibold">
 {invoices.length}
 </span>
 <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#063cbc] rounded-full"></span>
 </Link>
 </div>

 {/* Two-Column Main Canvas */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 {/* Left Column: Filter Toolbar & Invoices Master Table (8 Cols) */}
 <div className="lg:col-span-8 flex flex-col gap-4">
 {/* Filter Toolbar */}
 <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
 <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5">
 <div className="relative w-full sm:max-w-xs">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search by invoice number..."
 className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-[#063cbc]"
 />
 </div>

 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full sm:w-auto h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-medium text-on-surface-variant focus:outline-none cursor-pointer"
 >
 <option value="all">All statuses</option>
 <option value="paid">Paid only</option>
 <option value="pending">Pending only</option>
 </select>
 </div>

 <button
 type="button"
 onClick={() => {
 if (!filteredInvoices.length) {
 toast.error("No invoices to export");
 return;
 }
 const rows = [
 ["Invoice", "Date", "Description", "Credits", "Method", "Status"],
 ...filteredInvoices.map((inv) => [
 inv.invoiceNumber,
 inv.date,
 inv.description,
 String(inv.credits),
 inv.paymentMethod,
 inv.status,
 ]),
 ];
 const csv = rows
 .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
 .join("\n");
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = "invoices.csv";
 link.click();
 URL.revokeObjectURL(url);
 toast.success("Exported invoices CSV");
 }}
 className="h-9 px-3.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
 >
 <Download className="w-4 h-4 text-secondary" />
 <span>Export CSV</span>
 </button>
 </div>

 {/* Main Invoices Table Card */}
 <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm overflow-hidden flex flex-col">
 <div className="px-5 py-4 flex items-center justify-between border-b border-surface-container ">
 <div className="flex items-center gap-2">
 <h2 className="text-sm font-bold text-on-surface ">Invoice History</h2>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-low text-secondary font-semibold">
 Automated Sync
 </span>
 </div>
 <span className="text-[11px] text-outline">USD ($) Standard Settlement</span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-surface-container-lowest text-secondary uppercase text-[10px] tracking-wider font-semibold h-9 border-b border-outline-variant ">
 <th className="py-2.5 px-4">Invoice #</th>
 <th className="py-2.5 px-4">Date</th>
 <th className="py-2.5 px-4">Description</th>
 <th className="py-2.5 px-4 text-right">Credits</th>
 <th className="py-2.5 px-4">Method</th>
 <th className="py-2.5 px-4">Status</th>
 <th className="py-2.5 px-4 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-surface-container text-xs">
 {isLoading && (
 <tr>
 <td colSpan={7} className="py-8 text-center text-secondary">
 Loading invoices…
 </td>
 </tr>
 )}
 {!isLoading && filteredInvoices.length === 0 && (
 <tr>
 <td colSpan={7} className="py-8 text-center text-secondary">
 No purchase invoices recorded yet.
 </td>
 </tr>
 )}
 {filteredInvoices.map((inv) => (
 <tr key={inv.id} className="hover:bg-surface-container-lowest transition-colors">
 <td className="py-3.5 px-4 font-mono font-semibold text-[#063cbc]">
 {inv.invoiceNumber}
 </td>
 <td className="py-3.5 px-4 text-secondary whitespace-nowrap">
 {inv.date}
 </td>
 <td className="py-3.5 px-4 font-medium text-on-surface ">
 {inv.description}
 </td>
 <td className="py-3.5 px-4 font-semibold text-right tabular-nums text-on-surface ">
 +{inv.credits.toLocaleString()} cr
 </td>
 <td className="py-3.5 px-4">
 <div className="flex items-center gap-1.5 text-secondary">
 <CreditCard className="w-3.5 h-3.5" />
 <span>{inv.paymentMethod}</span>
 </div>
 </td>
 <td className="py-3.5 px-4">
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
 {inv.status}
 </span>
 </td>
 <td className="py-3.5 px-4 text-right">
 <button
 type="button"
 onClick={() => toast("PDF export is not available yet")}
 className="inline-flex items-center gap-1 text-xs font-semibold text-[#063cbc] hover:underline"
 >
 <Download className="w-3.5 h-3.5" />
 <span>PDF</span>
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Right Column: Cards (4 cols) */}
 <div className="lg:col-span-4 flex flex-col gap-4">
 {/* Card 1: Payment Method */}
 <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 flex flex-col gap-3">
 <h3 className="text-sm font-bold text-on-surface ">Default Payment Method</h3>
 <div className="p-3 rounded-xl border border-outline-variant bg-surface-container-lowest flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-7 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-[#063cbc]">
 <CreditCard className="w-4 h-4" />
 </div>
 <div className="text-xs">
 <div className="font-semibold text-on-surface ">Visa ending in 4417</div>
 <div className="text-outline text-[11px]">Expires 08/2028</div>
 </div>
 </div>
 <button
 type="button"
 onClick={() => toast("Card update dialog")}
 className="text-xs font-semibold text-[#063cbc] hover:underline"
 >
 Edit
 </button>
 </div>
 </div>

 {/* Card 2: Billing Info */}
 <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 flex flex-col gap-2.5 text-xs">
 <h3 className="text-sm font-bold text-on-surface ">Tax Information</h3>
 <p className="text-secondary leading-relaxed">
 Invoices are issued to <strong className="text-on-surface ">Apex Growth Partners LLC</strong> with VAT ID: <span className="font-mono">US-948201948</span>.
 </p>
 <button
 type="button"
 onClick={() => toast("Tax profile settings")}
 className="text-xs font-semibold text-[#063cbc] hover:underline text-left pt-1"
 >
 Update tax details
 </button>
 </div>
 </div>
 </div>

 {/* Buy Credits Dialog */}
 <BuyCreditsDialog
 isOpen={isBuyModalOpen}
 onClose={() => setIsBuyModalOpen(false)}
 currentBalance={availableBalance}
 />
 </div>
 );
}
