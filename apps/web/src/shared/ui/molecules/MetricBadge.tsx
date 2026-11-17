import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricBadgeProps {
  label: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricBadge({
  label,
  value,
  trend,
  isPositive = true,
  icon,
  className,
}: MetricBadgeProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs transition-colors hover:border-primary/40",
        className
      )}
    >
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </span>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-emerald-500" : "text-destructive"
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
}
