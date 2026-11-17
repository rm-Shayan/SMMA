import React from "react";

interface StatCardProps {
 label: string;
 value: string | number;
 icon?: React.ReactNode;
 description?: string;
 subtext?: React.ReactNode;
 trend?: {
 value: string;
 positive?: boolean;
 };
 accentColor?: string;
 className?: string;
}

export function StatCard({
 label,
 value,
 icon,
 description,
 subtext,
 trend,
 className = "",
}: StatCardProps) {
 return (
 <div
 className={`bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/40 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${className}`}
 >
 <div className="flex items-center justify-between mb-space-md">
 <span className="font-label-xs text-label-xs uppercase tracking-wider text-secondary font-bold">
 {label}
 </span>
 {icon && (
 <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-primary shrink-0">
 {icon}
 </div>
 )}
 </div>

 <div>
 <div className="font-metric-display text-metric-display text-on-surface tabular-nums font-bold tracking-tight">
 {value}
 </div>

 {subtext ? (
 <div className="mt-space-xs">{subtext}</div>
 ) : (
 (description || trend) && (
 <div className="flex items-center gap-1.5 mt-space-xs text-secondary font-body-sm text-body-sm">
 {trend && (
 <span
 className={`font-semibold text-xs px-1.5 py-0.5 rounded ${
 trend.positive
 ? "bg-tertiary-fixed text-on-tertiary-fixed"
 : "bg-error-container text-on-error-container"
 }`}
 >
 {trend.positive ? "↑" : "↓"} {trend.value}
 </span>
 )}
 {description && <span>{description}</span>}
 </div>
 )
 )}
 </div>

 <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gradient-to-br from-primary-fixed-dim/20 to-transparent rounded-full pointer-events-none" />
 </div>
 );
}
