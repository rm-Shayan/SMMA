import AppShell from "@/components/AppShell";

export default function AuthorizedLoading() {
    return (
        <AppShell>
            <div className="flex flex-col w-full animate-pulse">
                {/* Header Shimmer */}
                <div className="pb-space-lg border-b border-outline-variant/30 mb-space-lg">
                    <div className="h-8 w-64 bg-surface-container-highest rounded-xl mb-2" />
                    <div className="h-4 w-96 max-w-full bg-surface-container rounded-lg" />
                </div>

                {/* Metric Cards Shimmer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-6">
                    <div className="h-28 bg-surface-container-low border border-outline-variant/30 rounded-2xl" />
                    <div className="h-28 bg-surface-container-low border border-outline-variant/30 rounded-2xl" />
                    <div className="h-28 bg-surface-container-low border border-outline-variant/30 rounded-2xl" />
                    <div className="h-28 bg-surface-container-low border border-outline-variant/30 rounded-2xl" />
                </div>

                {/* Content Table / Card Shimmer */}
                <div className="h-80 bg-surface-container-low border border-outline-variant/30 rounded-2xl w-full" />
            </div>
        </AppShell>
    );
}

