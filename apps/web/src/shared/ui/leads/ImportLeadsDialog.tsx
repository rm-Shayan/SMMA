"use client";

import React, { useState, useEffect, useRef } from "react";
import {
 X,
 Check,
 FileText,
 CheckCircle2,
 Copy,
 AlertCircle,
 Ban,
 Lock,
 Upload,
 Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useImportContactsMutation } from "@/redux/api/leadsApi";

interface ImportLeadsDialogProps {
 isOpen: boolean;
 onClose: () => void;
 onImportComplete?: (count: number) => void;
}

const DEFAULT_SAMPLE_CSV = `name,email,company,topic
Sarah Jenkins,sarah.jenkins@northwind.io,Northwind Digital,Outreach
Michael Chang,mchang@vertexai.tech,Vertex AI,Automation
Elena Rostova,elena@apexlogistics.com,Apex Logistics,Logistics
David Ross,david.ross@cloudscale.io,CloudScale,SaaS
Amina Zahra,amina@zenithventures.co,Zenith Ventures,Venture Capital`;

export default function ImportLeadsDialog({
 isOpen,
 onClose,
 onImportComplete,
}: ImportLeadsDialogProps) {
 const fileInputRef = useRef<HTMLInputElement | null>(null);
 const [skipDuplicates, setSkipDuplicates] = useState(true);
 const [skipInvalid, setSkipInvalid] = useState(true);
 const [fileName, setFileName] = useState("prospects-sample.csv");
 const [csvData, setCsvData] = useState(DEFAULT_SAMPLE_CSV);
 const [rowsCount, setRowsCount] = useState(5);

 const [importContacts, { isLoading }] = useImportContactsMutation();

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape" && isOpen) onClose();
 };
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setFileName(file.name);
 const reader = new FileReader();
 reader.onload = (event) => {
 const text = (event.target?.result as string) || "";
 setCsvData(text);
 const count = text.split("\n").filter((l) => l.trim().length > 0).length - 1;
 setRowsCount(Math.max(1, count));
 toast.success(`Loaded ${file.name} (${Math.max(1, count)} records)`);
 };
 reader.readAsText(file);
 };

 const handleImport = async () => {
 try {
 const res = await importContacts({ csv: csvData }).unwrap();
 if (!res.success) {
 toast.error("Import failed. Ensure CSV has name, email headers.");
 return;
 }
 toast.success(`Successfully imported ${res.imported} contacts! (${res.invalid} skipped/invalid)`);
 onImportComplete?.(res.imported);
 onClose();
 } catch (err) {
 const message = (err as { data?: { message?: string } })?.data?.message;
 toast.error(message || "Failed to import leads");
 }
 };

 return (
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby="import-leads-title"
 className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm animate-in fade-in duration-150"
 >
 <div className="fixed inset-0 -z-10" onClick={onClose} />
 <div className="relative w-full max-w-[720px] bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
 {/* Header */}
 <div className="px-6 pt-5 pb-3 flex items-start justify-between bg-surface-container-lowest border-b border-surface-container">
 <div>
 <h2 id="import-leads-title" className="text-xl font-bold text-on-surface">
 Import leads
 </h2>
 <p className="text-xs text-secondary mt-0.5">
 Upload a CSV file or connect your CRM
 </p>
 </div>
 <button
 onClick={onClose}
 className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
 aria-label="Close dialog"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Stepper */}
 <div className="px-6 py-3 bg-surface-container-lowest border-b border-surface-container">
 <div className="flex items-center justify-between relative">
 <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-surface-container" />

 {/* Step 1 */}
 <div className="relative z-10 flex items-center gap-2 bg-surface-container-lowest pr-3">
 <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-primary-container text-xs font-bold">
 <Check className="w-3.5 h-3.5" />
 </div>
 <span className="text-xs font-medium text-on-surface">Upload</span>
 </div>

 {/* Step 2 */}
 <div className="relative z-10 flex items-center gap-2 bg-surface-container-lowest px-3">
 <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-bold shadow-sm">
 2
 </div>
 <span className="text-xs font-bold text-primary-container">Review</span>
 </div>

 {/* Step 3 */}
 <div className="relative z-10 flex items-center gap-2 bg-surface-container-lowest pl-3">
 <div className="w-6 h-6 rounded-full bg-surface-container text-outline flex items-center justify-center text-xs font-medium">
 3
 </div>
 <span className="text-xs font-medium text-outline">Import</span>
 </div>
 </div>
 </div>

 {/* Scrollable Body */}
 <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
 <input
 ref={fileInputRef}
 type="file"
 accept=".csv"
 className="hidden"
 onChange={handleFileChange}
 />
 {/* Parsed File Row */}
 <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between border border-surface-container">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-md bg-secondary-container flex items-center justify-center text-primary-container">
 <FileText className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-on-surface">{fileName}</span>
 <span className="w-1 h-1 rounded-full bg-outline" />
 <span className="text-[11px] text-secondary font-mono">{rowsCount} rows</span>
 </div>
 <div className="flex items-center gap-1 text-primary-container text-[11px] font-semibold mt-0.5">
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>Ready to ingest</span>
 </div>
 </div>
 </div>
 <button
 type="button"
 onClick={() => fileInputRef.current?.click()}
 className="text-xs font-semibold text-primary-container hover:underline"
 >
 Choose CSV file
 </button>
 </div>

 {/* 4 Summary Metric Cards */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
 <div className="bg-surface-container-low rounded-lg p-3 border border-surface-container">
 <div className="flex items-center justify-between text-secondary">
 <span className="text-[10px] uppercase font-bold tracking-wider">Valid</span>
 <CheckCircle2 className="w-4 h-4 text-primary-container" />
 </div>
 <div className="mt-1.5">
 <div className="text-xl font-bold text-primary-container tabular-nums">268</div>
 <div className="text-[10px] text-secondary mt-0.5">Ready to ingest</div>
 </div>
 </div>

 <div className="bg-surface-container-low rounded-lg p-3 border border-surface-container">
 <div className="flex items-center justify-between text-secondary">
 <span className="text-[10px] uppercase font-bold tracking-wider">Duplicates</span>
 <Copy className="w-4 h-4 text-secondary" />
 </div>
 <div className="mt-1.5">
 <div className="text-xl font-bold text-secondary tabular-nums">31</div>
 <div className="text-[10px] text-secondary mt-0.5">Exist in CRM</div>
 </div>
 </div>

 <div className="bg-surface-container-low rounded-lg p-3 border border-surface-container">
 <div className="flex items-center justify-between text-secondary">
 <span className="text-[10px] uppercase font-bold tracking-wider">Invalid emails</span>
 <AlertCircle className="w-4 h-4 text-error" />
 </div>
 <div className="mt-1.5">
 <div className="text-xl font-bold text-error tabular-nums">9</div>
 <div className="text-[10px] text-secondary mt-0.5">Syntax/MX error</div>
 </div>
 </div>

 <div className="bg-surface-container-low rounded-lg p-3 border border-surface-container">
 <div className="flex items-center justify-between text-secondary">
 <span className="text-[10px] uppercase font-bold tracking-wider">Suppressed</span>
 <Ban className="w-4 h-4 text-outline" />
 </div>
 <div className="mt-1.5">
 <div className="text-xl font-bold text-secondary tabular-nums">4</div>
 <div className="text-[10px] text-secondary mt-0.5">On opt-out list</div>
 </div>
 </div>
 </div>

 {/* Short 5-Row Data Preview */}
 <div className="rounded-lg bg-surface-container-low overflow-hidden border border-surface-container">
 <div className="grid grid-cols-12 bg-surface-container px-3 py-2 text-[10px] font-bold text-secondary uppercase tracking-wider">
 <div className="col-span-3">Name</div>
 <div className="col-span-4">Email</div>
 <div className="col-span-3">Company</div>
 <div className="col-span-2 text-right">Check</div>
 </div>
 <div className="divide-y divide-surface-container text-xs bg-surface-container-lowest">
 <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-surface-container-low transition-colors">
 <div className="col-span-3 font-semibold text-on-surface truncate">Sarah Jenkins</div>
 <div className="col-span-4 text-secondary truncate font-mono text-[11px]">s.jenkins@vanguard.io</div>
 <div className="col-span-3 text-secondary truncate">Vanguard Tech</div>
 <div className="col-span-2 flex justify-end">
 <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary-container text-[10px] font-semibold">
 Valid
 </span>
 </div>
 </div>

 <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-surface-container-low transition-colors">
 <div className="col-span-3 font-semibold text-on-surface truncate">Marcus Thorne</div>
 <div className="col-span-4 text-secondary truncate font-mono text-[11px]">m.thorne@kinetix.ai</div>
 <div className="col-span-3 text-secondary truncate">Kinetix Solutions</div>
 <div className="col-span-2 flex justify-end">
 <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-semibold">
 Duplicate
 </span>
 </div>
 </div>

 <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-surface-container-low transition-colors">
 <div className="col-span-3 font-semibold text-on-surface truncate">Devon Miller</div>
 <div className="col-span-4 text-error truncate font-mono text-[11px]">devon@broken-domain.x</div>
 <div className="col-span-3 text-secondary truncate">Apex Logic</div>
 <div className="col-span-2 flex justify-end">
 <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[10px] font-semibold">
 Invalid
 </span>
 </div>
 </div>

 <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-surface-container-low transition-colors">
 <div className="col-span-3 font-semibold text-on-surface truncate">Amina Yusuf</div>
 <div className="col-span-4 text-secondary truncate font-mono text-[11px]">amina.y@strata-media.com</div>
 <div className="col-span-3 text-secondary truncate">Strata Media</div>
 <div className="col-span-2 flex justify-end">
 <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary-container text-[10px] font-semibold">
 Valid
 </span>
 </div>
 </div>

 <div className="grid grid-cols-12 px-3 py-2 items-center hover:bg-surface-container-low transition-colors">
 <div className="col-span-3 font-semibold text-on-surface truncate">David Zhang</div>
 <div className="col-span-4 text-secondary truncate font-mono text-[11px]">dzhang@globaloptout.org</div>
 <div className="col-span-3 text-secondary truncate">Optima Bio</div>
 <div className="col-span-2 flex justify-end">
 <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-semibold">
 Suppressed
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Checkbox Options */}
 <div className="bg-surface-container-low rounded-lg p-3 space-y-2.5 border border-surface-container">
 <label className="flex items-start gap-2.5 cursor-pointer">
 <input
 type="checkbox"
 checked={skipDuplicates}
 onChange={(e) => setSkipDuplicates(e.target.checked)}
 className="mt-0.5 w-4 h-4 rounded text-primary-container bg-surface-container-lowest focus:ring-primary-container"
 />
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-on-surface">Skip duplicates</span>
 <span className="text-[11px] text-secondary">
 31 contacts will not be re-added or overwrite existing campaign state
 </span>
 </div>
 </label>

 <label className="flex items-start gap-2.5 cursor-pointer">
 <input
 type="checkbox"
 checked={skipInvalid}
 onChange={(e) => setSkipInvalid(e.target.checked)}
 className="mt-0.5 w-4 h-4 rounded text-primary-container bg-surface-container-lowest focus:ring-primary-container"
 />
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-on-surface">Skip invalid emails</span>
 <span className="text-[11px] text-secondary">
 9 contacts with failed syntax or unreachable MX records
 </span>
 </div>
 </label>

 <div className="flex items-start gap-2.5 opacity-80 cursor-not-allowed">
 <input
 type="checkbox"
 checked
 disabled
 className="mt-0.5 w-4 h-4 rounded text-primary-container bg-surface-container cursor-not-allowed"
 />
 <div className="flex flex-col">
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-semibold text-on-surface">Skip suppressed contacts</span>
 <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-surface-container text-secondary text-[10px] font-semibold">
 <Lock className="w-3 h-3" />
 Mandatory
 </span>
 </div>
 <span className="text-[11px] text-secondary">
 4 unsubscribed addresses protected by global compliance policy
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="px-6 py-3.5 bg-surface-container-low border-t border-surface-container flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
 <CheckCircle2 className="w-4 h-4 text-primary-container" />
 <span>{rowsCount} leads ready to import</span>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={onClose}
 disabled={isLoading}
 className="h-8 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-secondary hover:text-on-surface text-xs font-medium transition-colors disabled:opacity-50"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleImport}
 disabled={isLoading}
 className="h-8 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
 >
 {isLoading ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 <span>Ingesting...</span>
 </>
 ) : (
 <>
 <Upload className="w-3.5 h-3.5" />
 <span>Import {rowsCount} leads</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
