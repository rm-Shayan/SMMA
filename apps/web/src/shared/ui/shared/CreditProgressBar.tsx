import React from "react";
import { AlertTriangle } from "lucide-react";

interface CreditProgressBarProps {
 used: number;
 limit: number;
 reserved?: number;
 showDetails?: boolean;
 className?: string;
}

export function CreditProgressBar({
 used,
 limit,
 reserved = 0,
 showDetails = true,
 className = "",
}: CreditProgressBarProps) {
 const safeLimit = Math.max(1, limit);
 const percentage = Math.min(100, Math.round((used / safeLimit) * 100));
 const remaining = Math.max(0, safeLimit - used);

 // Status thresholds: green < 60%, amber 60-79%, red with warning icon 80%+
 let statusColor = "bg-emerald-500";
 let textColor = "text-on-surface-variant";
 let isAlert = false;

 if (percentage >= 80) {
 statusColor = "bg-rose-600";
 textColor = "text-rose-600";
 isAlert = true;
 } else if (percentage >= 60) {
 statusColor = "bg-amber-500";
 textColor = "text-amber-700";
 }

 return (
 <div className={`flex flex-col gap-1.5 w-full ${className}`}>
 {showDetails && (
 <div className="flex items-center justify-between font-label-xs text-label-xs">
 <div className={`flex items-center gap-1 font-semibold ${textColor}`}>
 {isAlert && <AlertTriangle size={14} className="text-rose-600 shrink-0" />}
 <span className="tabular-nums">
 {used.toLocaleString()} / {limit.toLocaleString()}
 </span>
 </div>
 <span className={`${textColor} font-medium tabular-nums`}>
 {remaining.toLocaleString()} remaining ({percentage}%)
 </span>
 </div>
 )}

 {/* Track and Animated Bar */}
 <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
 <div
 className={`h-full ${statusColor} rounded-full transition-all duration-300`}
 style={{ width: `${percentage}%` }}
 />
 </div>

 {reserved > 0 && (
 <span className="text-[10px] text-secondary tabular-nums">
 ⚡ {reserved} credits held in active runs
 </span>
 )}
 </div>
 );
}
