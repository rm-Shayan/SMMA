"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
 X,
 Lock,
 Link as LinkIcon,
 Eye,
 EyeOff,
 Trash2,
 Plus,
 ShieldCheck,
 Check,
} from "lucide-react";

interface ConnectDataSourceDialogProps {
 isOpen: boolean;
 onClose: () => void;
}

interface CustomHeader {
 id: string;
 key: string;
 value: string;
}

export default function ConnectDataSourceDialog({ isOpen, onClose }: ConnectDataSourceDialogProps) {
 const [connectionName, setConnectionName] = useState("Orders API");
 const [baseUrl, setBaseUrl] = useState("https://api.example.com/v1");
 const [authType, setAuthType] = useState("bearer");
 const [token, setToken] = useState("");
 const [showToken, setShowToken] = useState(false);
 const [headers, setHeaders] = useState<CustomHeader[]>([
 { id: "1", key: "X-Agency-Client-ID", value: "styre_live_89402a" },
 ]);
 const [syncInterval, setSyncInterval] = useState("hourly");
 const [isTesting, setIsTesting] = useState(false);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape" && isOpen) onClose();
 };
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 const handleAddHeader = () => {
 setHeaders((prev) => [
 ...prev,
 { id: Date.now().toString(), key: "", value: "" },
 ]);
 };

 const handleRemoveHeader = (id: string) => {
 setHeaders((prev) => prev.filter((h) => h.id !== id));
 };

 const handleTestConnection = () => {
 setIsTesting(true);
 setTimeout(() => {
 setIsTesting(false);
 toast.success("Connection test successful! Ping: 42ms (HTTP 200 OK)");
 }, 1200);
 };

 const handleSave = (e: React.FormEvent) => {
 e.preventDefault();
 toast.success(`Connected ${connectionName} successfully! Sync queued.`);
 onClose();
 };

 return (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
 <div className="fixed inset-0 -z-10" onClick={onClose} />
 <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
 {/* Header */}
 <div className="p-5 sm:p-6 border-b border-outline-variant flex items-start justify-between">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="text-[11px] font-semibold tracking-wider uppercase text-secondary">
 Data Ingestion Pipeline
 </span>
 <span className="text-outline-variant">•</span>
 <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
 <Lock className="w-3 h-3" /> TLS 1.3 / AES-256
 </span>
 </div>
 <h2 className="text-xl font-bold tracking-tight text-on-surface ">
 Connect data source
 </h2>
 <p className="text-xs text-secondary ">
 Give your agents read-only access to your business data and internal APIs.
 </p>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-container-low transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Stepper Rail */}
 <div className="px-6 py-3 bg-surface-container-lowest border-b border-outline-variant ">
 <div className="flex items-center justify-between max-w-md mx-auto text-xs">
 <div className="flex items-center gap-1.5 font-medium text-on-surface-variant ">
 <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
 <Check className="w-3 h-3" />
 </div>
 <span>Type</span>
 </div>
 <div className="h-0.5 w-10 bg-[#063cbc]"></div>
 <div className="flex items-center gap-1.5 font-semibold text-[#063cbc]">
 <div className="w-5 h-5 rounded-full bg-[#063cbc] text-white flex items-center justify-center text-[10px]">
 2
 </div>
 <span>Details</span>
 </div>
 <div className="h-0.5 w-10 bg-surface-container "></div>
 <div className="flex items-center gap-1.5 text-outline">
 <div className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[10px]">
 3
 </div>
 <span>Test</span>
 </div>
 </div>
 </div>

 {/* Form Body */}
 <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
 {/* Connection Name */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label htmlFor="conn-name" className="text-xs font-semibold text-on-surface-variant ">
 Connection name
 </label>
 <span className="text-[11px] text-outline">Internal identifier</span>
 </div>
 <input
 id="conn-name"
 type="text"
 value={connectionName}
 onChange={(e) => setConnectionName(e.target.value)}
 className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-[#063cbc]"
 required
 />
 </div>

 {/* Base URL */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label htmlFor="base-url" className="text-xs font-semibold text-on-surface-variant ">
 Base URL
 </label>
 <span className="text-[11px] text-outline">Root destination path</span>
 </div>
 <div className="relative flex items-center">
 <span className="absolute left-2.5 px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono font-medium">
 HTTPS
 </span>
 <input
 id="base-url"
 type="text"
 value={baseUrl}
 onChange={(e) => setBaseUrl(e.target.value)}
 className="w-full h-9 pl-20 pr-9 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-[#063cbc]"
 required
 />
 <LinkIcon className="w-4 h-4 absolute right-3 text-outline" />
 </div>
 </div>

 {/* Authentication Type */}
 <div className="space-y-1.5">
 <label htmlFor="auth-type" className="text-xs font-semibold text-on-surface-variant ">
 Authentication type
 </label>
 <select
 id="auth-type"
 value={authType}
 onChange={(e) => setAuthType(e.target.value)}
 className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface-variant focus:outline-none focus:border-[#063cbc] cursor-pointer"
 >
 <option value="bearer">Bearer token</option>
 <option value="basic">Basic Auth</option>
 <option value="apikey">API Key</option>
 <option value="oauth2">OAuth 2.0</option>
 </select>
 </div>

 {/* Masked Token */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label htmlFor="auth-token" className="text-xs font-semibold text-on-surface-variant ">
 Token
 </label>
 <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
 <Lock className="w-3 h-3" /> Encrypted in agency vault
 </span>
 </div>
 <div className="relative flex items-center">
 <input
 id="auth-token"
 type={showToken ? "text" : "password"}
 value={token}
 onChange={(e) => setToken(e.target.value)}
 className="w-full h-9 px-3 pr-10 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-[#063cbc]"
 />
 <button
 type="button"
 onClick={() => setShowToken(!showToken)}
 className="absolute right-2.5 p-1 text-outline hover:text-on-surface-variant transition-colors"
 >
 {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Custom Headers */}
 <div className="space-y-2 pt-1">
 <div className="flex items-center justify-between">
 <label className="text-xs font-semibold text-on-surface-variant ">
 Custom Headers ({headers.length})
 </label>
 <button
 type="button"
 onClick={handleAddHeader}
 className="text-xs font-semibold text-[#063cbc] hover:underline inline-flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Add Header</span>
 </button>
 </div>

 {headers.map((header) => (
 <div key={header.id} className="flex items-center gap-2">
 <input
 type="text"
 placeholder="Key (e.g. X-Header)"
 value={header.key}
 onChange={(e) => {
 const val = e.target.value;
 setHeaders((prev) =>
 prev.map((h) => (h.id === header.id ? { ...h, key: val } : h))
 );
 }}
 className="flex-1 h-8 px-3 rounded-md bg-surface-container-lowest border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-[#063cbc]"
 />
 <input
 type="text"
 placeholder="Value"
 value={header.value}
 onChange={(e) => {
 const val = e.target.value;
 setHeaders((prev) =>
 prev.map((h) => (h.id === header.id ? { ...h, value: val } : h))
 );
 }}
 className="flex-1 h-8 px-3 rounded-md bg-surface-container-lowest border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-[#063cbc]"
 />
 <button
 type="button"
 onClick={() => handleRemoveHeader(header.id)}
 className="p-1.5 text-outline hover:text-rose-500 transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>

 {/* Sync Frequency */}
 <div className="space-y-1.5 pt-2">
 <label htmlFor="sync-freq" className="text-xs font-semibold text-on-surface-variant ">
 Synchronizer cadence
 </label>
 <select
 id="sync-freq"
 value={syncInterval}
 onChange={(e) => setSyncInterval(e.target.value)}
 className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface-variant focus:outline-none focus:border-[#063cbc]"
 >
 <option value="hourly">Hourly polling</option>
 <option value="6hours">Every 6 hours</option>
 <option value="daily">Daily midnight sync</option>
 <option value="webhook">Real-time webhook listener</option>
 </select>
 </div>

 {/* Privacy Note */}
 <div className="p-3 rounded-lg bg-surface-container-low/60 border border-primary flex items-start gap-2.5 text-xs text-on-surface-variant ">
 <ShieldCheck className="w-4 h-4 text-[#063cbc] shrink-0 mt-0.5" />
 <p className="leading-snug">
 Agents only perform read queries against this API. No mutating POST/PUT/DELETE requests
 are permitted without supervisor override.
 </p>
 </div>

 {/* Action buttons */}
 <div className="pt-3 border-t border-outline-variant flex items-center justify-between">
 <button
 type="button"
 disabled={isTesting}
 onClick={handleTestConnection}
 className="h-9 px-3.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
 >
 {isTesting ? "Testing endpoint..." : "Test Connection"}
 </button>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={onClose}
 className="h-9 px-4 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 className="h-9 px-4 rounded-lg bg-[#063cbc] hover:bg-[#00298a] text-white text-xs font-semibold shadow-sm transition-all"
 >
 Save & Authorize
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>
 );
}
