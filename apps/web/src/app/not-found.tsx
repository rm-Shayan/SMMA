'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/dashboard?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 antialiased">
            <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/80 shadow-[0_4px_24px_rgba(6,60,188,0.06)] p-8 flex flex-col items-center text-center">
                {/* Icon Container */}
                <div className="w-12 h-12 rounded-full bg-surface-container-low text-primary flex items-center justify-center mb-4 border border-primary">
                    <Search className="w-6 h-6" />
                </div>

                {/* Status Label */}
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
                    ERROR 404
                </span>

                {/* Heading */}
                <h1 className="text-2xl font-bold tracking-tight text-on-surface mb-2">
                    We could not find that page
                </h1>

                {/* Subtitle */}
                <p className="text-xs text-secondary leading-relaxed max-w-xs mb-8">
                    The link may be broken or the page may have been relocated in the latest fleet update.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 w-full mb-6">
                    <Link
                        href="/dashboard"
                        className="flex-1 h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Home className="w-3.5 h-3.5" />
                        <span>Go to Dashboard</span>
                    </Link>
                    <button
                        onClick={() => router.back()}
                        type="button"
                        className="flex-1 h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Go back</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-surface-container-low w-full my-4" />

                {/* Search Section */}
                <div className="w-full text-left space-y-2">
                    <span className="text-xs font-semibold text-on-surface-variant block text-center">
                        Looking for something?
                    </span>
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <Search className="w-4 h-4 absolute left-3 text-outline" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search pages or agents..."
                            className="w-full h-10 pl-9 pr-14 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <kbd className="absolute right-2.5 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            Ctrl K
                        </kbd>
                    </form>
                </div>
            </div>
        </div>
    );
}
