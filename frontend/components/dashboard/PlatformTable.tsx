import { ChannelSlice, formatPercent } from "./platform-channels";

export default function PlatformTable({ slices }: { slices: ChannelSlice[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider border-t border-outline-variant/30">
            <th className="py-3 px-space-lg font-semibold">Channel / Platform</th>
            <th className="py-3 px-space-lg font-semibold">Conversations</th>
            <th className="py-3 px-space-lg font-semibold">Share of Volume</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-high/40 text-body-md font-body-md text-on-surface">
          {slices.map((slice) => (
            <tr key={slice.key} className="hover:bg-surface-container-low/50 transition-colors">
              <td className="py-3.5 px-space-lg">
                <div className="flex items-center gap-space-sm">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${slice.dot}`} />
                  <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                    {slice.label}
                  </span>
                  <span className="font-caption text-caption text-secondary uppercase">{slice.key}</span>
                </div>
              </td>
              <td className="py-3.5 px-space-lg font-semibold">
                {slice.count.toLocaleString("en-US")}
              </td>
              <td className={`py-3.5 px-space-lg font-semibold ${slice.text}`}>
                {formatPercent(slice.percent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
