import React from "react";

interface PageSkeletonProps {
 cardsCount?: number;
 rowsCount?: number;
 className?: string;
}

export function PageSkeleton({
 cardsCount = 4,
 rowsCount = 5,
 className = "",
}: PageSkeletonProps) {
 return (
 <div className={`flex flex-col w-full animate-pulse space-y-margin-lg ${className}`}>
 {/* Top Header Skeleton */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container">
 <div className="space-y-2">
 <div className="h-8 w-48 bg-surface-container rounded-lg" />
 <div className="h-4 w-72 bg-surface-container-low rounded" />
 </div>
 <div className="flex items-center gap-2">
 <div className="h-9 w-28 bg-surface-container rounded-lg" />
 <div className="h-9 w-28 bg-surface-container rounded-lg" />
 </div>
 </div>

 {/* KPI Cards Skeleton Strip */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
 {Array.from({ length: cardsCount }).map((_, i) => (
 <div
 key={i}
 className="bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/30 h-32 flex flex-col justify-between"
 >
 <div className="flex items-center justify-between">
 <div className="h-3 w-20 bg-surface-container rounded" />
 <div className="w-7 h-7 rounded-lg bg-surface-container-low" />
 </div>
 <div className="space-y-1.5">
 <div className="h-8 w-24 bg-surface-container rounded-lg" />
 <div className="h-3 w-36 bg-surface-container-low rounded" />
 </div>
 </div>
 ))}
 </div>

 {/* Table / Content Area Skeleton */}
 <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-space-lg space-y-4">
 <div className="flex items-center justify-between">
 <div className="h-5 w-32 bg-surface-container rounded" />
 <div className="h-8 w-48 bg-surface-container-low rounded-lg" />
 </div>
 <div className="space-y-3 pt-2">
 {Array.from({ length: rowsCount }).map((_, i) => (
 <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-surface-container/40">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-surface-container" />
 <div className="space-y-1">
 <div className="h-3.5 w-32 bg-surface-container rounded" />
 <div className="h-2.5 w-24 bg-surface-container-low rounded" />
 </div>
 </div>
 <div className="h-3.5 w-20 bg-surface-container rounded" />
 <div className="h-2.5 w-36 bg-surface-container-low rounded" />
 <div className="h-7 w-16 bg-surface-container-low rounded-lg" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
