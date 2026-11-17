import React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
 title?: string;
 message?: string;
 onRetry?: () => void;
 className?: string;
}

export function ErrorState({
 title = "Something went wrong",
 message = "Failed to load data from the operations server. Please try again.",
 onRetry,
 className = "",
}: ErrorStateProps) {
 return (
 <div
 className={`w-full bg-surface-container-lowest rounded-xl border border-error/30 p-8 flex flex-col items-center justify-center text-center ${className}`}
 >
 <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mb-3">
 <AlertCircle size={22} className="text-error" />
 </div>
 <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">
 {title}
 </h3>
 <p className="font-body-sm text-body-sm text-secondary max-w-md mb-4">
 {message}
 </p>
 {onRetry && (
 <Button onClick={onRetry} variant="outline" size="sm" className="gap-1.5">
 <RotateCw size={14} />
 Retry Connection
 </Button>
 )}
 </div>
 );
}
