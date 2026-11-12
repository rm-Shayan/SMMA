import PlatformTable from "./PlatformTable";
import { buildSlices, formatPercent } from "./platform-channels";

interface PlatformBreakdownProps {
  breakdown: Record<string, number>;
  totalConversations: number;
}

export default function PlatformBreakdown({
  breakdown,
  totalConversations,
}: PlatformBreakdownProps) {
  const slices = buildSlices(breakdown);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col border border-outline-variant/40">
      <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-outline-variant/30">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            Platform Breakdown
            <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded">
              {slices.length} Channel{slices.length === 1 ? "" : "s"} Active
            </span>
          </h2>
          <p className="font-body-md text-body-md text-secondary mt-0.5">
            Conversation volume distribution across connected social channels
          </p>
        </div>
      </div>

      {slices.length === 0 ? (
        <div className="px-space-lg py-10 text-center">
          <p className="font-body-md text-body-md text-secondary">
            No conversation volume recorded per platform yet.
          </p>
        </div>
      ) : (
        <>
          <div className="px-space-lg pt-space-md pb-space-lg bg-surface-container-lowest">
            <div className="w-full flex flex-col gap-2">
              <div className="flex justify-between items-center text-caption font-caption text-secondary">
                <span>
                  Overall Network Distribution (
                  {totalConversations.toLocaleString("en-US")} conversations)
                </span>
                <span className="font-medium text-on-surface">100% Allocated</span>
              </div>
              <div className="w-full h-3.5 bg-surface-container-high rounded-full overflow-hidden flex shadow-inner">
                {slices.map((slice) => (
                  <div
                    key={slice.key}
                    className={`h-full transition-all duration-500 hover:brightness-110 ${slice.dot}`}
                    style={{ width: `${slice.percent}%` }}
                    title={`${slice.label}: ${formatPercent(slice.percent)}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mt-space-lg">
              {slices.map((slice) => (
                <div
                  key={slice.key}
                  className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${slice.dot}`} />
                      <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                        {slice.label}
                      </span>
                    </div>
                    <span className={`font-label-sm text-label-sm font-semibold ${slice.text}`}>
                      {formatPercent(slice.percent)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-body-sm font-body-sm text-secondary">
                    <span>{slice.count.toLocaleString("en-US")} conversations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PlatformTable slices={slices} />
        </>
      )}
    </div>
  );
}
