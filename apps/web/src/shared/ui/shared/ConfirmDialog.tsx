import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
 open: boolean;
 onClose: () => void;
 onConfirm: () => void;
 title: string;
 description: string;
 confirmLabel?: string;
 cancelLabel?: string;
 variant?: "danger" | "warning" | "default";
 loading?: boolean;
}

export function ConfirmDialog({
 open,
 onClose,
 onConfirm,
 title,
 description,
 confirmLabel = "Confirm",
 cancelLabel = "Cancel",
 variant = "default",
 loading = false,
}: ConfirmDialogProps) {
 if (!open) return null;

 const icons = {
 danger: <AlertCircle size={22} className="text-error" />,
 warning: <AlertTriangle size={22} className="text-amber-500" />,
 default: <Info size={22} className="text-primary" />,
 };

 const iconContainers = {
 danger: "bg-error-container text-on-error-container",
 warning: "bg-amber-100 text-amber-800",
 default: "bg-primary-fixed text-primary",
 };

 return (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
 {/* Backdrop */}
 <div
 className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-xs transition-opacity"
 onClick={loading ? undefined : onClose}
 />

 {/* Modal Dialog */}
 <div
 role="dialog"
 aria-modal="true"
 className="relative z-10 w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/50 p-6 shadow-2xl flex flex-col gap-4 my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
 >
 <div className="flex items-start gap-3.5">
 <div
 className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconContainers[variant]}`}
 >
 {icons[variant]}
 </div>
 <div className="flex flex-col">
 <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-tight">
 {title}
 </h3>
 <p className="font-body-sm text-body-sm text-secondary mt-1 leading-relaxed">
 {description}
 </p>
 </div>
 </div>

 <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline-variant/30">
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={onClose}
 disabled={loading}
 >
 {cancelLabel}
 </Button>
 <Button
 type="button"
 size="sm"
 onClick={onConfirm}
 disabled={loading}
 variant={variant === "danger" ? "destructive" : "default"}
 >
 {loading ? "Processing..." : confirmLabel}
 </Button>
 </div>
 </div>
 </div>
 );
}
