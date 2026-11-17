"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "../atoms/Input";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
  onClear,
  autoFocus,
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        leftIcon={<Search className="w-3.5 h-3.5" />}
        rightIcon={
          value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onClear?.();
              }}
              className="p-0.5 hover:text-foreground cursor-pointer rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
