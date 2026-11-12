import AppShell from "@/components/AppShell";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

/** App Router instant-loading UI while the `/dashboard` segment streams in. */
export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="flex flex-col w-full">
        <div className="pb-space-lg border-b border-outline-variant/30 mb-space-lg animate-pulse">
          <div className="h-7 w-64 bg-surface-container-highest rounded-lg" />
          <div className="h-4 w-96 bg-surface-container rounded-lg mt-2" />
        </div>
        <DashboardSkeleton />
      </div>
    </AppShell>
  );
}
