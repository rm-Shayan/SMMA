import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  inverted?: boolean;
  className?: string;
}

export default function Logo({
  size = "md",
  showText = true,
  subtitle = "Autonomous Agency Enclave",
  inverted = false,
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

  const titleColor = inverted ? "text-white" : "text-slate-900";
  const subColor = inverted ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Precision Geometric AI Emblem */}
      <div className={`relative ${iconDimensions[size]} shrink-0 flex items-center justify-center`}>
        {/* Soft Ambient Radial Glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 blur-[6px] opacity-40 group-hover:opacity-75 transition-opacity duration-300" />

        {/* Outer Hex-Shield Squircle */}
        <div className="relative w-full h-full rounded-2xl flex items-center justify-center p-2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30 border border-white/20">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            {/* Outer Hexagon Shield */}
            <path
              d="M16 2.5L27.5 9.2V22.8L16 29.5L4.5 22.8V9.2L16 2.5Z"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Neural Node Ring */}
            <path
              d="M16 8L22.5 12V20L16 24L9.5 20V12L16 8Z"
              stroke="#67e8f9"
              strokeWidth="1.2"
              strokeDasharray="2 1.5"
            />
            {/* Central Diamond Singularity */}
            <path
              d="M16 11.5L20 16L16 20.5L12 16L16 11.5Z"
              fill="#ffffff"
            />
            <circle cx="16" cy="16" r="1.8" fill="#0891b2" />
          </svg>

          {/* Micro Status Beacon */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 ring-2 ring-white"></span>
          </span>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black font-sans leading-tight ${titleColor} flex items-center gap-1.5 ${textStyles[size]}`}>
            <span className="tracking-tight font-extrabold">SMMA</span>  
          </div>
          {subtitle && (
            <div className={`font-medium tracking-wide ${subColor} uppercase leading-none mt-1 ${subStyles[size]}`}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
