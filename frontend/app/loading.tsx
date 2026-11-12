/** Instant loading UI for the root segment (e.g. `/` redirecting to `/dashboard`). */
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-lg">
        <span className="material-symbols-outlined text-[26px] animate-spin">
          progress_activity
        </span>
      </div>
      <p className="font-label-md text-label-md text-secondary">Loading workspace…</p>
    </div>
  );
}
