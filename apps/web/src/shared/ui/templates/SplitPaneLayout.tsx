import React from "react";
import { cn } from "@/lib/utils";

export interface SplitPaneLayoutProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  leftPaneClassName?: string;
  rightPaneClassName?: string;
  className?: string;
}

export function SplitPaneLayout({
  leftPane,
  rightPane,
  leftPaneClassName,
  rightPaneClassName,
  className,
}: SplitPaneLayoutProps) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-6 w-full", className)}>
      <div className={cn("lg:col-span-4 xl:col-span-3 space-y-4", leftPaneClassName)}>
        {leftPane}
      </div>
      <div className={cn("lg:col-span-8 xl:col-span-9 space-y-6", rightPaneClassName)}>
        {rightPane}
      </div>
    </div>
  );
}
