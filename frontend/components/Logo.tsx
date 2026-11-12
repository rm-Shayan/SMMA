import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
  monochrome?: boolean;
}

export default function Logo({
  size = "md",
  showText = true,
  subtitle = "Autonomous Agency Enclave",
  className = "",
  monochrome = false,
}: LogoProps) {
  const iconDimensions = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const textStyles = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-xl tracking-tight",
    xl: "text-2xl tracking-tighter",
  };

  const subStyles = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-[11px]",
    xl: "text-xs",
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* High-Precision AI Quantum Hex-Core Icon */}
      <div className={`relative ${iconDimensions[size]} shrink-0 flex items-center justify-center`}>
        {/* Ambient Gradient Glow */}
        {!monochrome && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600/40 via-purple-600/30 to-cyan-400/40 blur-md transform group-hover:scale-110 transition-transform duration-300" />
        )}

        {/* Icon Frame */}
        <div
          className={`relative w-full h-full rounded-xl flex items-center justify-center p-1.5 shadow-md ${
            monochrome
              ? "bg-foreground/10 text-foreground"
              : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-indigo-950/50"
          }`}
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            {/* Outer Cyber Hexagon with Beveled Node Points */}
            <path
              d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
              stroke="url(#outerGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Neural Lattice Inner Constellation */}
            <path
              d="M16 8L23 12V20L16 24L9 20V12L16 8Z"
              stroke="url(#innerGrad)"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              strokeLinejoin="round"
              className="opacity-80"
            />

            {/* Tri-Axis Synapse Connectors */}
            <path d="M16 3V8M27 9.5L23 12M27 22.5L23 20M16 29V24M5 22.5L9 20M5 9.5L9 12" stroke="#818cf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />

            {/* Central Hyper-Core Energy Diamond */}
            <path
              d="M16 11L20.5 16L16 21L11.5 16L16 11Z"
              fill="url(#coreGrad)"
            />

            {/* Center Pulsing Quantum Singularity Dot */}
            <circle cx="16" cy="16" r="2.2" fill="#38bdf8" />
            <circle cx="16" cy="16" r="1.1" fill="#ffffff" />

            <defs>
              <linearGradient id="outerGrad" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="innerGrad" x1="9" y1="8" x2="23" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#818cf8" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="coreGrad" x1="11.5" y1="11" x2="20.5" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Real-time Status Indicator Beacon */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 ring-2 ring-slate-900"></span>
          </span>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black font-sans leading-tight text-on-surface flex items-center gap-1.5 ${textStyles[size]}`}>
            <span>SMMA</span>
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent font-extrabold">
              .AI
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 leading-none">
              v4.2
            </span>
          </div>
          {subtitle && (
            <div className={`font-medium tracking-wide text-secondary/90 uppercase leading-none mt-0.5 ${subStyles[size]}`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
