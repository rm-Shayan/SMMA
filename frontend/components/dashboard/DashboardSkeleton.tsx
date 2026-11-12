export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-space-xl" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading analytics…</span>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between h-32 border border-outline-variant/30"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-surface-container rounded" />
              <div className="w-8 h-8 rounded-lg bg-surface-container-high" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-7 w-24 bg-surface-container-highest rounded" />
              <div className="h-3 w-16 bg-surface-container rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-xs p-space-lg animate-pulse flex flex-col gap-space-lg border border-outline-variant/30">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-48 bg-surface-container-highest rounded" />
            <div className="h-3 w-72 bg-surface-container rounded" />
          </div>
          <div className="h-8 w-24 bg-surface-container rounded" />
        </div>
        <div className="h-4 w-full bg-surface-container-high rounded-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
          <div className="h-16 bg-surface-container-low rounded-xl" />
          <div className="h-16 bg-surface-container-low rounded-xl" />
          <div className="h-16 bg-surface-container-low rounded-xl" />
          <div className="h-16 bg-surface-container-low rounded-xl" />
        </div>
        <div className="flex flex-col gap-3 pt-space-md">
          <div className="h-10 bg-surface-container-low rounded-lg" />
          <div className="h-10 bg-surface-container-low rounded-lg" />
          <div className="h-10 bg-surface-container-low rounded-lg" />
        </div>
      </div>
    </div>
  );
}
