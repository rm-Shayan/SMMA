import React from "react";

export type StatusVariant =
 | "active"
 | "automated"
 | "in-review"
 | "draft"
 | "error"
 | "warning"
 | "neutral";

interface StatusPillProps {
 label: string;
 variant?: StatusVariant;
 pulse?: boolean;
 icon?: React.ReactNode;
 className?: string;
}

export function StatusPill({
 label,
 variant = "neutral",
 pulse = false,
 icon,
 className = "",
}: StatusPillProps) {
 const styles: Record<StatusVariant, { container: string; dot: string }> = {
 active: {
 container: "bg-emerald-50 text-emerald-800 border border-emerald-200",
 dot: "bg-emerald-500",
 },
 automated: {
 container: "bg-surface-container-low text-primary border border-primary",
 dot: "bg-primary",
 },
 "in-review": {
 container: "bg-amber-50 text-amber-900 border border-amber-200",
 dot: "bg-amber-500",
 },
 draft: {
 container: "bg-surface-container-low text-on-surface-variant border border-outline-variant",
 dot: "bg-outline-variant",
 },
 error: {
 container: "bg-rose-50 text-rose-800 border border-rose-200",
 dot: "bg-rose-500",
 },
 warning: {
 container: "bg-amber-50 text-amber-800 border border-amber-200",
 dot: "bg-amber-500",
 },
 neutral: {
 container: "bg-surface-container-lowest text-on-surface-variant border border-outline-variant",
 dot: "bg-outline-variant",
 },
 };

 const selected = styles[variant];

 return (
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-semibold select-none ${selected.container} ${className}`}
 >
 {pulse ? (
 <span className="relative flex h-2 w-2">
 <span
 className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selected.dot}`}
 />
 <span className={`relative inline-flex rounded-full h-2 w-2 ${selected.dot}`} />
 </span>
 ) : (
 <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected.dot}`} />
 )}
 {icon && <span className="shrink-0">{icon}</span>}
 <span className="truncate">{label}</span>
 </span>
 );
}
