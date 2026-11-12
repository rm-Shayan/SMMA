"use client";

import { useState } from "react";
import Link from "next/link";
import { registerApi } from "@/services/authService";
import { ApiError } from "@/services/api";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    companyName?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { companyName?: string; fullName?: string; email?: string; password?: string; confirmPassword?: string } = {};

    if (!companyName.trim()) errors.companyName = "Agency or Company name is required.";
    else if (companyName.trim().length < 2) errors.companyName = "Company name must be at least 2 characters.";

    if (!fullName.trim()) errors.fullName = "Full name is required.";
    else if (fullName.trim().length < 2) errors.fullName = "Full name must be at least 2 characters.";

    if (!email.trim()) errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";

    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";

    if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }

    setValidationErrors({}); setApiError(null); setLoading(true);
    try {
      await registerApi({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        role: "CLIENT_OWNER",
      });
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        if (err.status === 409) setApiError("An account with this email already exists.");
        else setApiError(err.message);
      } else {
        setApiError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>

      <div className="w-full max-w-[460px] relative z-10 flex flex-col">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={true} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Register Your Agency</h1>
          <p className="text-xs text-secondary mt-1">
            Create your isolated company enclave and Agency Owner administrator account.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8 relative">
          {apiError && (
            <div className="bg-error-container/40 border border-error/30 rounded-xl p-3.5 mb-4 text-xs text-error">
              {apiError}
            </div>
          )}

          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
                <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">Verification Email Sent!</h2>
              <p className="text-xs text-secondary leading-relaxed">
                We sent a verification link to <strong className="text-on-surface">{email}</strong>. Please check your inbox and verify your email before logging in.
              </p>
              <div className="pt-2">
                <Link href="/login" className="inline-block py-2.5 px-6 bg-primary-container text-white text-xs font-semibold rounded-xl hover:bg-primary-container/90 transition-all">
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} noValidate className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Agency / Company Name <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Growth Partners"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40"
                />
                {validationErrors.companyName && <p className="text-xs text-error mt-1">{validationErrors.companyName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Owner Full Name <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40"
                />
                {validationErrors.fullName && <p className="text-xs text-error mt-1">{validationErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Work Email Address <span className="text-error">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@agency.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40"
                />
                {validationErrors.email && <p className="text-xs text-error mt-1">{validationErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Password (min 8 chars) <span className="text-error">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-secondary hover:text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {validationErrors.password && <p className="text-xs text-error mt-1">{validationErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Confirm Password <span className="text-error">*</span></label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-secondary hover:text-on-surface">
                    <span className="material-symbols-outlined text-[18px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {validationErrors.confirmPassword && <p className="text-xs text-error mt-1">{validationErrors.confirmPassword}</p>}
              </div>

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-[11px] text-secondary leading-relaxed">
                ℹ️ <strong>Role Notice:</strong> Public signup creates an isolated <strong>Agency Owner</strong> account. Staff members (Operators) and Interns (Trainees) are provisioned securely inside your Team settings.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary-container hover:bg-primary-container/90 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Registering Agency...</span></> : <span>Create Agency Account</span>}
              </button>
            </form>
          )}

          <div className="mt-4 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary">
            <span>Already have an account? </span>
            <Link href="/login" className="text-primary-container font-semibold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
