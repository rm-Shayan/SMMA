"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "w-full rounded-lg bg-card border text-xs text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-border focus:border-primary focus:ring-1 focus:ring-primary/30",
        error: "border-destructive focus:border-destructive focus:ring-1 focus:ring-destructive/30",
        ghost: "border-transparent bg-transparent focus:bg-muted/50",
      },
      inputSize: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-9 px-3 text-xs",
        lg: "h-10 px-3.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, leftIcon, rightIcon, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              inputVariants({ variant, inputSize, className }),
              leftIcon ? "pl-9" : "",
              rightIcon ? "pr-9" : ""
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(inputVariants({ variant, inputSize, className }))}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
