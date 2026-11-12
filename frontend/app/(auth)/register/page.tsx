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
    const errors: {
      companyName?: string;
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!companyName.trim()) errors.companyName = "Agency or Company name is required.";
    else if (companyName.trim().length < 2) errors.companyName = "Company name must be at least 2 characters.";

    if (!fullName.trim()) errors.fullName = "Full name is required.";
    else if (fullName.trim().length < 2) errors.fullName = "Full name must be at least 2 characters.";

    if (!email.trim()) errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid work email address.";

    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";

    if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setApiError(null);
    setLoading(true);

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
        setApiError("Registration failed. Please check your network and try again.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100/90 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-slate-800 antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/30 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[500px] relative z-10 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block transition-transform hover:scale-[1.02] mb-3">
            <Logo size="lg" showText={true} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Your Agency Enclave
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Onboard your agency into a dedicated, multi-tenant isolated AI workspace.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-9 border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.08),0_4px_16px_rgba(0,0,0,0.02)]">
          {success ? (
            <div className="p-4 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[30px]">mark_email_read</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Enclave Provisioned!
                </h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  We sent a verification token to <strong className="text-slate-900">{email}</strong>.
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Please verify your email address to unlock your Agency Owner console.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-indigo-600">domain</span>
                  <span>{companyName}</span>
                </div>
                <div>Role: <strong className="text-indigo-600">CLIENT_OWNER</strong> (Full Enclave Access)</div>
                <div>Status: <span className="text-amber-600 font-medium">Pending Email Verification</span></div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Sign In</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
                <Link
                  href="/verify-email"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Enter Token Manually
                </Link>
              </div>
            </div>
          ) : (
            <>
              {apiError && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
                    error
                  </span>
                  <div>
                    <p className="font-semibold text-rose-800">Registration Failed</p>
                    <p className="mt-0.5 leading-relaxed text-rose-600">{apiError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleRegister} noValidate className="space-y-3.5">
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1"
                  >
                    Agency / Company Name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      domain
                    </span>
                    <input
                      type="text"
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Apex Growth Partners LLC"
                      required
                      className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                        validationErrors.companyName
                          ? "border-rose-400 ring-2 ring-rose-100 bg-white"
                          : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                      }`}
                    />
                  </div>
                  {validationErrors.companyName && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      {validationErrors.companyName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1"
                    >
                      Owner Full Name
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        person
                      </span>
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Morgan"
                        required
                        className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.fullName
                            ? "border-rose-400 ring-2 ring-rose-100 bg-white"
                            : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                        }`}
                      />
                    </div>
                    {validationErrors.fullName && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1"
                    >
                      Work Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        mail
                      </span>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@agency.com"
                        required
                        className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.email
                            ? "border-rose-400 ring-2 ring-rose-100 bg-white"
                            : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                        }`}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1"
                    >
                      Master Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        lock
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 8 chars"
                        required
                        className={`w-full pl-10 pr-10 py-2 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.password
                            ? "border-rose-400 ring-2 ring-rose-100 bg-white"
                            : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        verified
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        required
                        className={`w-full pl-10 pr-10 py-2 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                          validationErrors.confirmPassword
                            ? "border-rose-400 ring-2 ring-rose-100 bg-white"
                            : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle password"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Pill Banner */}
                <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[17px] text-indigo-600 shrink-0 mt-0.5">
                    shield
                  </span>
                  <div>
                    <span className="font-semibold text-indigo-950">Privileged Role Assignment: </span>
                    Public signups provision a dedicated <strong className="text-indigo-600">CLIENT_OWNER</strong> with full tenant autonomy.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-md shadow-indigo-600/20 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>Provisioning Enclave...</span>
                    </>
                  ) : (
                    <>
                      <span>Provision Agency Enclave</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>Already have an enclave? </span>
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors underline-offset-4 hover:underline"
            >
              Sign In &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400">
          <p>&copy; 2026 SMMA AI Systems &middot; Multi-Tenant Enterprise Enclave</p>
        </div>
      </div>
    </div>
  );
}
