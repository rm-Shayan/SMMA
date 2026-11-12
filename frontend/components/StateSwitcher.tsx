"use client";

export type ViewState = "live" | "loading" | "empty" | "error";

interface StateSwitcherProps {
  current: ViewState;
  onChange: (state: ViewState) => void;
  label?: string;
}

export default function StateSwitcher({
  current,
  onChange,
  label = "View Mode:",
}: StateSwitcherProps) {
  return (
    <div className="flex items-center bg-surface-container-low p-1 rounded-xl shadow-xs self-start lg:self-center flex-wrap gap-1 border border-outline-variant/30">
      <span className="font-label-sm text-label-sm text-secondary px-space-sm uppercase tracking-wider select-none text-[10px]">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange("live")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 text-xs ${
            current === "live"
              ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
          <span>Live View</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("loading")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 text-xs ${
            current === "loading"
              ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60"
          }`}
        >
          <span className="material-symbols-outlined text-[15px] animate-spin">
            sync
          </span>
          <span>Loading Skeleton</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("empty")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 text-xs ${
            current === "empty"
              ? "bg-surface-container-lowest text-primary shadow-xs font-semibold"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60"
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            inbox
          </span>
          <span>Empty State</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("error")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all duration-150 text-xs ${
            current === "error"
              ? "bg-surface-container-lowest text-error shadow-xs font-semibold"
              : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60"
          }`}
        >
          <span className="material-symbols-outlined text-[15px] text-error">
            warning
          </span>
          <span>API Error State</span>
        </button>
      </div>
    </div>
  );
}

