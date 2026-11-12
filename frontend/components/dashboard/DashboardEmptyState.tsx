import Link from "next/link";

export default function DashboardEmptyState() {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xs px-6 py-10 lg:px-12 lg:py-12 flex flex-col items-center justify-center text-center w-full border border-outline-variant/40">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary-container mb-space-md shadow-inner">
        <span className="material-symbols-outlined text-[32px]">hub</span>
      </div>
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-xs font-semibold">
        No Tenant Activity Recorded Yet
      </h2>
      <p className="font-body-md text-body-md text-secondary mb-space-lg max-w-lg">
        Connect social channels or activate an AI agent in the Agent Workspace to begin
        capturing leads and scheduling content for this tenant.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-space-md">
        <Link
          href="/channels"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">add_link</span>
          Connect First Channel
        </Link>
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          Deploy AI Agent
        </Link>
      </div>
      <div className="mt-8 pt-5 border-t border-surface-container-high/60 w-full flex items-center justify-center gap-6 text-caption font-caption text-secondary flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">lock</span> SOC2 Encrypted Vault
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">speed</span> Sub-second Auto
          Ingestion
        </span>
      </div>
    </div>
  );
}
