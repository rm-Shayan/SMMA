"use client";

import React from "react";
import { Input, type InputProps } from "../atoms/Input";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      containerClassName,
      id,
      className,
      ...inputProps
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-foreground flex items-center justify-between"
          >
            <span>
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </span>
          </label>
        )}

        <Input
          ref={ref}
          id={inputId}
          variant={error ? "error" : "default"}
          className={className}
          {...inputProps}
        />

        {error ? (
          <p className="text-[11px] text-destructive font-medium animate-in fade-in">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";
