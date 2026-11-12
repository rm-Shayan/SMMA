/** Channel presentation helpers shared by the dashboard breakdown components. */

export interface ChannelMeta {
  label: string;
  dot: string;
  text: string;
}

const CHANNEL_META: Record<string, ChannelMeta> = {
  linkedin: { label: "LinkedIn", dot: "bg-primary", text: "text-primary" },
  instagram: { label: "Instagram", dot: "bg-secondary", text: "text-secondary" },
  twitter: { label: "X (Twitter)", dot: "bg-inverse-surface", text: "text-inverse-surface" },
  x: { label: "X (Twitter)", dot: "bg-inverse-surface", text: "text-inverse-surface" },
  facebook: { label: "Facebook", dot: "bg-surface-tint", text: "text-primary-container" },
  whatsapp: { label: "WhatsApp", dot: "bg-tertiary-container", text: "text-tertiary-container" },
  email: { label: "Email", dot: "bg-outline", text: "text-secondary" },
};

export function channelMeta(key: string): ChannelMeta {
  return CHANNEL_META[key.toLowerCase()] ?? {
    label: key || "Unknown channel",
    dot: "bg-surface-tint",
    text: "text-primary-container",
  };
}

export interface ChannelSlice extends ChannelMeta {
  key: string;
  count: number;
  percent: number;
}

/** Builds sorted slices (largest volume first) from the API `platformBreakdown`. */
export function buildSlices(breakdown: Record<string, number>): ChannelSlice[] {
  const entries = Object.entries(breakdown).filter(([, count]) => Number(count) > 0);
  const total = entries.reduce((sum, [, count]) => sum + Number(count), 0);

  return entries
    .map(([key, count]) => ({
      key,
      count: Number(count),
      percent: total > 0 ? (Number(count) / total) * 100 : 0,
      ...channelMeta(key),
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatPercent(percent: number): string {
  if (percent > 0 && percent < 10) return `${percent.toFixed(1)}%`;
  return `${Math.round(percent)}%`;
}
