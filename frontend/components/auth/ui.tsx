"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

/* Shared primitives for the authentication screens. Kept in one place so every
 * auth page has identical labels, focus treatment and error behaviour. */

const inputBase =
  "w-full h-11 rounded-xl border bg-surface-container-low/50 text-sm text-on-surface placeholder:text-outline/80 outline-none transition-colors focus:bg-surface-container-lowest focus:ring-4 disabled:opacity-60 disabled:cursor-not-allowed";

function stateClasses(error?: string) {
  return error
    ? "border-error/70 focus:border-error focus:ring-error/10"
    : "border-outline-variant/70 hover:border-outline/60 focus:border-primary-container focus:ring-primary-container/10";
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  icon?: string;
  labelAction?: ReactNode;
  wrapperClassName?: string;
}

export function TextField({
  id,
  label,
  error,
  hint,
  icon,
  labelAction,
  wrapperClassName = "",
  className = "",
  ...props
}: FieldProps) {
  return (
    <div className={wrapperClassName}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold text-secondary">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-outline"
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputBase} ${stateClasses(error)} ${icon ? "pl-10" : "pl-3.5"} pr-3.5 ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-xs text-error">
          <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
            error
          </span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface PasswordFieldProps extends Omit<FieldProps, "icon" | "type"> {
  showStrength?: boolean;
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  labelAction,
  showStrength = false,
  wrapperClassName = "",
  value,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const password = typeof value === "string" ? value : "";

  return (
    <div className={wrapperClassName}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold text-secondary">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <span
          aria-hidden="true"
          className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-outline"
        >
          lock
        </span>
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`${inputBase} ${stateClasses(error)} pl-10 pr-11`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:outline-none"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            {visible ? "visibility_off" : "visibility"}
          </span>
        </button>
      </div>
      {showStrength && password.length > 0 && <PasswordStrength value={password} />}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1 text-xs text-error">
          <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
            error
          </span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function passwordScore(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

const strengthMeta = [
  { label: "Too short", tone: "bg-error", text: "text-error" },
  { label: "Weak", tone: "bg-error", text: "text-error" },
  { label: "Fair", tone: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", tone: "bg-primary-container", text: "text-primary-container" },
  { label: "Strong", tone: "bg-emerald-500", text: "text-emerald-600" },
];

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  const meta = strengthMeta[score];
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1 flex-1 rounded-full transition-colors ${step <= score ? meta.tone : "bg-surface-container-highest"}`}
          />
        ))}
        <span className={`ml-1 w-14 shrink-0 text-right text-[11px] font-medium ${meta.text}`}>
          {meta.label}
        </span>
      </div>
      <p className="mt-1 text-[11px] text-secondary">
        Use 8+ characters with a mix of letters, numbers and symbols.
      </p>
    </div>
  );
}

export function Alert({
  variant = "error",
  title,
  children,
}: {
  variant?: "error" | "success" | "info";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    error: {
      box: "border-error/20 bg-error-container/40",
      title: "text-on-error-container",
      icon: "error",
      iconTone: "text-error",
    },
    success: {
      box: "border-emerald-200 bg-emerald-50",
      title: "text-emerald-900",
      icon: "check_circle",
      iconTone: "text-emerald-600",
    },
    info: {
      box: "border-primary/15 bg-primary-fixed/40",
      title: "text-on-primary-fixed",
      icon: "info",
      iconTone: "text-primary",
    },
  }[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${styles.box}`}
    >
      <span aria-hidden="true" className={`material-symbols-outlined mt-px text-[18px] ${styles.iconTone}`}>
        {styles.icon}
      </span>
      <div className="min-w-0">
        {title && <p className={`font-semibold ${styles.title}`}>{title}</p>}
        <div className="mt-0.5 leading-relaxed text-secondary">{children}</div>
      </div>
    </div>
  );
}

export function SubmitButton({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-container text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary focus-visible:ring-4 focus-visible:ring-primary-container/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="material-symbols-outlined animate-spin text-[18px]">
            progress_activity
          </span>
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">{eyebrow}</p>
      )}
      <h1 className="font-headline-lg text-on-surface">{title}</h1>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-secondary">{description}</p>}
    </div>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_-24px_rgba(16,24,40,0.25)] sm:p-8">
      {children}
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="mt-5 text-center text-xs text-secondary">
      {prompt}{" "}
      <a
        href={href}
        className="font-semibold text-primary-container underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:outline-none"
      >
        {label}
      </a>
    </p>
  );
}

export function SuccessPanel({
  icon = "check_circle",
  title,
  description,
  children,
}: {
  icon?: string;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
        <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
          {icon}
        </span>
      </div>
      <h1 className="font-headline-lg text-on-surface">{title}</h1>
      <div className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-secondary">{description}</div>
      {children && <div className="mt-6 space-y-2.5">{children}</div>}
    </div>
  );
}
