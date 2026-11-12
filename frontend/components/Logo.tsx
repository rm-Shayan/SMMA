import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export default function Logo({
  size = "md",
  showText = true,
  subtitle = "Autonomous Agency Enclave",
  className = "",
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
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Radiant Quantum AI Squircle Emblem */}
      <div className={`relative ${iconDimensions[size]} shrink-0 flex items-center justify-center`}>
        {/* Soft Ambient Glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 blur-sm opacity-40 group-hover:opacity-75 transition-opacity duration-300" />

        {/* Squircle Badge */}
        <div className="relative w-full h-full rounded-xl flex items-center justify-center p-1.5 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-cyan-500 text-white shadow-md shadow-indigo-600/30">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            {/* Hexagonal Quantum Frame */}
            <path
              d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-90"
            />

            {/* Neural Synapse Lattice */}
            <path
              d="M16 8L22 12V20L16 24L10 20V12L16 8Z"
              stroke="#a5f3fc"
              strokeWidth="1.3"
              strokeLinejoin="round"
              className="opacity-75"
            />

            {/* Inner Cyber Diamond Core */}
            <path
              d="M16 11L20 16L16 21L12 16L16 11Z"
              fill="#ffffff"
              className="opacity-95"
            />

            {/* Singularity Cyan Point */}
            <circle cx="16" cy="16" r="2" fill="#06b6d4" />
          </svg>

          {/* Micro Status Beacon */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300 ring-2 ring-white"></span>
          </span>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black font-sans leading-tight text-slate-900 dark:text-white flex items-center gap-1.5 ${textStyles[size]}`}>
            <span>SMMA</span>
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent font-extrabold">
              .AI
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 leading-none">
              v4.2
            </span>
          </div>
          {subtitle && (
            <div className={`font-medium tracking-wide text-slate-500 uppercase leading-none mt-0.5 ${subStyles[size]}`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
