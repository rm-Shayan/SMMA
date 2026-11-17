'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AlertTriangle, Copy, Check, RotateCcw, Home } from 'lucide-react';

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const [referenceId] = useState(() => error.digest || 'err_' + Math.random().toString(36).substring(2, 10));

    const handleCopy = () => {
        navigator.clipboard.writeText(referenceId);
        setCopied(true);
        toast.success('Error reference copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 antialiased">
            <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/80 shadow-[0_4px_24px_rgba(225,29,72,0.06)] p-8 flex flex-col items-center text-center">
                {/* Warning Icon */}
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                    <AlertTriangle className="w-6 h-6" />
                </div>

                <span className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
                    ERROR 500
                </span>

                <h1 className="text-xl font-bold tracking-tight text-on-surface mb-2">
                    Something went wrong on our side
                </h1>

                <p className="text-xs text-secondary leading-relaxed max-w-xs mb-6">
                    Your workspace state is safe. Please retry, and if the issue persists, share the reference code with engineering.
                </p>

                {/* Reference ID Callout Box */}
                <div className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-xl p-3 px-4 flex items-center justify-between mb-6">
                    <div className="flex flex-col text-left">
                        <span className="text-[10px] font-semibold text-outline uppercase tracking-wider">
                            Reference ID
                        </span>
                        <span className="font-mono text-sm font-bold text-on-surface">{referenceId}</span>
                    </div>

                    <button
                        onClick={handleCopy}
                        type="button"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface text-xs font-semibold shadow-xs transition-colors"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 w-full">
                    <button
                        onClick={() => reset()}
                        type="button"
                        className="flex-1 h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Try again</span>
                    </button>
                    <Link
                        href="/dashboard"
                        className="flex-1 h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Home className="w-3.5 h-3.5" />
                        <span>Dashboard</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
