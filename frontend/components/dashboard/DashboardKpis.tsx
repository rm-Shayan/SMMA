import type { Analytics } from "@/types/analytics";

interface KpiConfig {
  label: string;
  value: number;
  hint: string;
  icon: string;
  iconClass: string;
  hintClass: string;
}

export default function DashboardKpis({ analytics }: { analytics: Analytics }) {
  const cards: KpiConfig[] = [
    {
      label: "Total Leads",
      value: analytics.totalLeads,
      hint: "Captured across channels",
      icon: "group_add",
      iconClass: "bg-surface-container-high text-primary",
      hintClass: "bg-surface-container text-primary",
    },
    {
      label: "Hot Leads",
      value: analytics.hotLeads,
      hint: "Score 80+ qualified",
      icon: "local_fire_department",
      iconClass: "bg-amber-50 text-amber-600",
      hintClass: "bg-amber-100 text-amber-800",
    },
    {
      label: "Total Conversations",
      value: analytics.totalConversations,
      hint: "Inbound messages handled",
      icon: "forum",
      iconClass: "bg-surface-container text-primary-container",
      hintClass: "bg-surface-container-high text-tertiary-container",
    },
    {
      label: "Scheduled Posts",
      value: analytics.totalScheduledPosts,
      hint: "In the publishing queue",
      icon: "event_upcoming",
      iconClass: "bg-surface-container-low text-secondary",
      hintClass: "bg-surface-container text-on-secondary-container",
    },
    {
      label: "Published Posts",
      value: analytics.publishedPosts,
      hint: "Successfully distributed",
      icon: "task_alt",
      iconClass: "bg-surface-container text-primary",
      hintClass: "bg-surface-container-high text-tertiary-container",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-outline-variant/40"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-secondary">{card.label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconClass}`}>
              <span className="material-symbols-outlined text-[18px]">{card.icon}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
              {card.value.toLocaleString("en-US")}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-label-sm font-semibold ${card.hintClass}`}
              >
                {card.hint}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
