import { Bolt, Loader2 } from "lucide-react";

/** Instant loading UI for the root segment (e.g. `/` redirecting to `/dashboard`). */
export default function RootLoading() {
    return (
        <div
            role="status"
            aria-live="polite"
            className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4"
        >
            <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25">
                    <Bolt className="w-7 h-7 animate-pulse" />
                </div>
                <div className="absolute -inset-2">
                    <Loader2 className="w-18 h-18 text-primary/30 animate-spin" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-1 mt-2">
                <p className="text-xs font-bold text-on-surface tracking-wide">Styre AI</p>
                <p className="text-[11px] font-medium text-secondary">Loading workspace…</p>
            </div>
        </div>
    );
}
