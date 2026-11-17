import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
 title?: string;
 description?: string;
 icon?: React.ReactNode;
 actionLabel?: string;
 onAction?: () => void;
 className?: string;
}

export function EmptyState({
 title = "No data found",
 description = "There are no records matching your request or filter.",
 icon,
 actionLabel,
 onAction,
 className = "",
}: EmptyStateProps) {
 return (
 <div
 className={`w-full bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-12 flex flex-col items-center justify-center text-center ${className}`}
 >
 <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-secondary mb-3 shadow-2xs">
 {icon || <Inbox size={22} className="text-secondary" />}
 </div>
 <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">
 {title}
 </h3>
 <p className="font-body-sm text-body-sm text-secondary max-w-sm mb-4">
 {description}
 </p>
 {actionLabel && onAction && (
 <Button onClick={onAction} size="sm">
 {actionLabel}
 </Button>
 )}
 </div>
 );
}
