import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  className?: string;
}

export function Logo({
  href = "/dashboard",
  size = "md",
  showSubtitle = true,
  className = "",
}: LogoProps) {
  const iconPixelSizes = {
    sm: 24,
    md: 32,
    lg: 40,
  };

  const content = (
    <div className={`flex items-center gap-2.5 select-none group ${className}`}>
      <div className="relative rounded-lg overflow-hidden shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
        <Image
          src="/brand/icon.png"
          alt="Styre-Bot"
          width={iconPixelSizes[size]}
          height={iconPixelSizes[size]}
          className="rounded-lg object-contain"
          priority
        />
      </div>
      <div className="flex flex-col text-left">
        <span
          className={`font-bold text-foreground leading-none tracking-tight ${
            size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-lg"
          }`}
        >
          Styre-Bot
        </span>
        {showSubtitle && (
          <span className="font-semibold text-[10px] text-primary leading-none mt-1 tracking-wider uppercase">
            AI Fleet Platform
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
