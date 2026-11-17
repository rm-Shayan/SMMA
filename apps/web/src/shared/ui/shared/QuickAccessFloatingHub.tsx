"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import {
 CreditCard,
 KeyRound,
 UserPlus,
 Palette,
 Receipt,
 Eye,
 X,
 ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export function QuickAccessFloatingHub() {
 const router = useRouter();
 const { user } = useAppSelector((state) => state.auth);
 const [isOpen, setIsOpen] = useState(false);
 const [previewRole, setPreviewRole] = useState<"ADMIN" | "MANAGER" | "EMPLOYEE">("ADMIN");
 const hubRef = useRef<HTMLDivElement>(null);

 const displayName = user?.name || user?.email?.split("@")[0] || "Ahmer Ali";
 const userInitials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

 // 320 / 400 credits used = 80% used
 const usedCredits = 320;
 const totalCredits = 400;
 const remainingCredits = totalCredits - usedCredits;
 const percentage = Math.round((usedCredits / totalCredits) * 100);

 // SVG circular stroke calculation
 // Radius = 40 => circumference = 2 * Math.PI * 40 = ~251.32
 const radius = 40;
 const circumference = 2 * Math.PI * radius;
 const strokeDashoffset = circumference - (percentage / 100) * circumference;

 // Arc color based on strict guidelines
 const strokeColor = percentage >= 80 ? "#ef4444" : percentage >= 60 ? "#f59e0b" : "#10b981";

 // Close on outside click
 useEffect(() => {
 const handleOutsideClick = (e: MouseEvent) => {
 if (hubRef.current && !hubRef.current.contains(e.target as Node)) {
 setIsOpen(false);
 }
 };
 if (isOpen) {
 document.addEventListener("mousedown", handleOutsideClick);
 }
 return () => document.removeEventListener("mousedown", handleOutsideClick);
 }, [isOpen]);

 const handleTileClick = (actionName: string, path?: string) => {
 if (path) {
 router.push(path);
 setIsOpen(false);
 } else {
 toast(`Action triggered: ${actionName}`);
 }
 };

 const handlePreviewRoleChange = (role: "ADMIN" | "MANAGER" | "EMPLOYEE") => {
 setPreviewRole(role);
 toast.success(`Switched preview mode to: ${role}`);
 };

 return (
 <div ref={hubRef} className="fixed bottom-6 left-6 md:left-72 z-40 select-none">
 {/* 1. Collapsed Assistive Touch Floating Trigger Button */}
 {!isOpen && (
 <button
 type="button"
 onClick={() => setIsOpen(true)}
 aria-label="Open Assistive Quick Access Hub"
 className="group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-inverse-surface/95 hover:bg-inverse-surface text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/15 backdrop-blur-md"
 >
 {/* Subtle AssistiveTouch glowing orb indicator */}
 <span className="relative flex h-2.5 w-2.5">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
 </span>

 <span className="text-[10px] font-mono font-bold tracking-widest text-secondary uppercase">
 {previewRole} HUB
 </span>

 <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest/40 group-hover:bg-surface-container-lowest transition-colors" />
 </button>
 )}

 {/* 2. Expanded Assistive Touch Quick Access Hub Window */}
 {isOpen && (
 <aside
 role="dialog"
 aria-label="Quick Access Floating Hub"
 className="w-[360px] sm:w-[380px] rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/60 shadow-2xl p-4.5 flex flex-col justify-between animate-in zoom-in-95 fade-in duration-200"
 >
 {/* Hub Header */}
 <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-9 h-9 rounded-full bg-primary text-on-primary font-bold text-xs flex items-center justify-center ring-2 ring-primary/20 shrink-0">
 {userInitials}
 </div>
 <div className="flex flex-col min-w-0">
 <div className="flex items-center gap-1.5">
 <span className="text-xs font-bold text-on-surface truncate leading-tight">
 {displayName}
 </span>
 <span className="bg-primary/10 text-primary font-bold text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider border border-primary/20">
 {previewRole}
 </span>
 </div>
 <span className="text-[10px] text-secondary truncate mt-0.5">
 Apex Growth Partners
 </span>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setIsOpen(false)}
 className="w-7 h-7 rounded-lg flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
 aria-label="Close Quick Access Hub"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Circular Credit Progress Ring */}
 <div className="flex flex-col items-center justify-center my-3.5">
 <div className="relative w-28 h-28 flex items-center justify-center">
 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
 {/* Background track */}
 <circle
 cx="50"
 cy="50"
 r={radius}
 fill="transparent"
 stroke="currentColor"
 strokeWidth="7"
 className="text-surface-container"
 />
 {/* Progress arc */}
 <circle
 cx="50"
 cy="50"
 r={radius}
 fill="transparent"
 stroke={strokeColor}
 strokeWidth="7"
 strokeDasharray={circumference}
 strokeDashoffset={strokeDashoffset}
 strokeLinecap="round"
 className="transition-all duration-500 ease-out"
 />
 </svg>

 {/* Center Ring Info */}
 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
 <span className="text-sm font-bold text-on-surface tabular-nums leading-none">
 {usedCredits} / {totalCredits}
 </span>
 <span className="text-[10px] text-secondary mt-1 font-medium">Credits used</span>
 </div>
 </div>

 <div className="flex items-center gap-1.5 mt-2">
 <span
 className="w-2 h-2 rounded-full"
 style={{ backgroundColor: strokeColor }}
 />
 <span className="text-[11px] font-semibold text-on-surface tabular-nums">
 {remainingCredits} credits remaining ({percentage}% consumed)
 </span>
 </div>
 </div>

 {/* 6 Action Tiles (3 x 2 grid) */}
 <div className="grid grid-cols-3 gap-2 my-2">
 <button
 type="button"
 onClick={() => handleTileClick("Allocate credits", "/workforce")}
 className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 hover:bg-primary/10 hover:border-primary/40 p-2.5 flex flex-col items-center justify-center text-center transition-all group shadow-2xs"
 >
 <CreditCard className="w-4 h-4 text-secondary group-hover:text-primary transition-colors mb-1" />
 <span className="text-[10px] font-semibold text-on-surface leading-tight">
 Allocate credits
 </span>
 </button>

 <button
 type="button"
 onClick={() => handleTileClick("Agent access", "/workforce")}
 className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 hover:bg-primary/10 hover:border-primary/40 p-2.5 flex flex-col items-center justify-center text-center transition-all group shadow-2xs"
 >
 <KeyRound className="w-4 h-4 text-secondary group-hover:text-primary transition-colors mb-1" />
 <span className="text-[10px] font-semibold text-on-surface leading-tight">
 Agent access
 </span>
 </button>

 <button
 type="button"
 onClick={() => handleTileClick("Invite member", "/team")}
 className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 hover:bg-primary/10 hover:border-primary/40 p-2.5 flex flex-col items-center justify-center text-center transition-all group shadow-2xs"
 >
 <UserPlus className="w-4 h-4 text-secondary group-hover:text-primary transition-colors mb-1" />
 <span className="text-[10px] font-semibold text-on-surface leading-tight">
 Invite member
 </span>
 </button>

 <button
 type="button"
 onClick={() => handleTileClick("Brand kit", "/knowledge-base")}
 className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 hover:bg-primary/10 hover:border-primary/40 p-2.5 flex flex-col items-center justify-center text-center transition-all group shadow-2xs"
 >
 <Palette className="w-4 h-4 text-secondary group-hover:text-primary transition-colors mb-1" />
 <span className="text-[10px] font-semibold text-on-surface leading-tight">
 Brand kit
 </span>
 </button>

 <button
 type="button"
 onClick={() => handleTileClick("Credit ledger", "/credits")}
 className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 hover:bg-primary/10 hover:border-primary/40 p-2.5 flex flex-col items-center justify-center text-center transition-all group shadow-2xs"
 >
 <Receipt className="w-4 h-4 text-secondary group-hover:text-primary transition-colors mb-1" />
 <span className="text-[10px] font-semibold text-on-surface leading-tight">
 Credit ledger
 </span>
 </button>

 <button
 type="button"
 onClick={() => handleTileClick("Preview role")}
 className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 hover:bg-primary/10 hover:border-primary/40 p-2.5 flex flex-col items-center justify-center text-center transition-all group shadow-2xs"
 >
 <Eye className="w-4 h-4 text-secondary group-hover:text-primary transition-colors mb-1" />
 <span className="text-[10px] font-semibold text-on-surface leading-tight">
 Preview role
 </span>
 </button>
 </div>

 {/* 'Preview as' Segmented Switch */}
 <div className="pt-2.5 border-t border-outline-variant/30">
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
 Preview Platform As
 </span>
 <span className="text-[10px] font-bold text-primary flex items-center gap-1">
 <ShieldCheck className="w-3 h-3" /> Live Simulator
 </span>
 </div>

 <div className="grid grid-cols-3 gap-1 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
 <button
 type="button"
 onClick={() => handlePreviewRoleChange("ADMIN")}
 className={`py-1 rounded text-center text-[10px] font-semibold transition-all ${
 previewRole === "ADMIN"
 ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
 : "text-secondary hover:text-on-surface"
 }`}
 >
 Admin
 </button>
 <button
 type="button"
 onClick={() => handlePreviewRoleChange("MANAGER")}
 className={`py-1 rounded text-center text-[10px] font-semibold transition-all ${
 previewRole === "MANAGER"
 ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
 : "text-secondary hover:text-on-surface"
 }`}
 >
 Manager
 </button>
 <button
 type="button"
 onClick={() => handlePreviewRoleChange("EMPLOYEE")}
 className={`py-1 rounded text-center text-[10px] font-semibold transition-all ${
 previewRole === "EMPLOYEE"
 ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
 : "text-secondary hover:text-on-surface"
 }`}
 >
 Employee
 </button>
 </div>

 <p className="text-[9px] text-secondary/70 text-center mt-1.5 leading-tight">
 Simulates menu visibility and operator permissions in real time
 </p>
 </div>
 </aside>
 )}
 </div>
 );
}
