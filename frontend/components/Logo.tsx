import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  const subSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Premium Futuristic AI Synapse Geometric Logo */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-cyan-500 shadow-md shadow-indigo-500/25 p-1.5`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Outer Quantum Diamond */}
          <path
            d="M12 2L21 7V17L12 22L3 17V7L12 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />
          {/* Inner Autonomous Neural Lattice */}
          <path
            d="M12 6L17 12L12 18L7 12L12 6Z"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Central AI Singularity Core */}
          <circle cx="12" cy="12" r="2.2" fill="#38bdf8" />
          <circle cx="12" cy="6" r="1.2" fill="currentColor" />
          <circle cx="17" cy="12" r="1.2" fill="currentColor" />
          <circle cx="12" cy="18" r="1.2" fill="currentColor" />
          <circle cx="7" cy="12" r="1.2" fill="currentColor" />
        </svg>
        {/* Subtle Ambient Pulse Ring */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
        </span>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className={`font-black tracking-tight text-on-surface leading-tight ${textSizes[size]}`}>
            SMMA<span className="text-indigo-600">.AI</span>
          </div>
          <div className={`font-semibold uppercase tracking-wider text-secondary leading-none ${subSizes[size]}`}>
            Autonomous Sales Enclave
          </div>
        </div>
      )}
    </div>
  );
}

