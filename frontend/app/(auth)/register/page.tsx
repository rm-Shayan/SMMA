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
    <div className="min-h-screen w-full flex bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* LEFT FORM PANE */}
      <div className="w-full lg:w-[54%] xl:w-[50%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/login" className="transition-transform hover:scale-[1.02]">
            <Logo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Already registered?</span>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Center Auth Card */}
        <div className="my-auto py-8 max-w-lg w-full mx-auto">
          {success ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-emerald-500/30 text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
                <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Enclave Provisioned!
                </h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  We sent a cryptographic verification token to{" "}
                  <strong className="text-white font-mono">{email}</strong>.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Please verify your email address to unlock your isolated Agency Owner console.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">domain</span>
                  <span>Tenant Record: {companyName}</span>
                </div>
                <div>Default Role: <strong className="text-white">CLIENT_OWNER</strong> (Full Enclave Access)</div>
                <div>Status: <span className="text-amber-400 font-medium">Pending Email Verification</span></div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Proceed to Sign In</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <Link
                  href="/verify-email"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Enter Token Manually
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Form Heading */}
              <div className="mb-6 text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Single-Tenant Provisioning
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Create Your Agency Enclave
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  Onboard your marketing agency into a dedicated, cryptographically isolated AI workspace.
                </p>
              </div>

              {/* Error Alert */}
              {apiError && (
                <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">
                    error
                  </span>
                  <div>
                    <p className="font-semibold text-rose-200">Registration Failed</p>
                    <p className="mt-0.5 leading-relaxed text-rose-300/90">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={handleRegister} noValidate className="space-y-4">
                {/* Agency Name */}
                <div>
                  <label
                    htmlFor="companyName"
                    className="block text-xs font-medium tracking-wide uppercase text-slate-300 mb-1.5"
                  >
                    Agency / Company Name <span className="text-indigo-400">*</span>
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
                      placeholder="e.g. Apex Growth Partners, LLC"
                      required
                      className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-900 border text-white placeholder-slate-500 transition-all outline-none ${
                        validationErrors.companyName
                          ? "border-rose-500 ring-1 ring-rose-500"
                          : "border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      }`}
                    />
                  </div>
                  {validationErrors.companyName && (
                    <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      {validationErrors.companyName}
                    </p>
                  )}
                </div>

                {/* Owner Name & Work Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-xs font-medium tracking-wide uppercase text-slate-300 mb-1.5"
                    >
                      Owner Full Name <span className="text-indigo-400">*</span>
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
                        className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-900 border text-white placeholder-slate-500 transition-all outline-none ${
                          validationErrors.fullName
                            ? "border-rose-500 ring-1 ring-rose-500"
                            : "border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        }`}
                      />
                    </div>
                    {validationErrors.fullName && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium tracking-wide uppercase text-slate-300 mb-1.5"
                    >
                      Work Email <span className="text-indigo-400">*</span>
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
                        className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-900 border text-white placeholder-slate-500 transition-all outline-none ${
                          validationErrors.email
                            ? "border-rose-500 ring-1 ring-rose-500"
                            : "border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        }`}
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password & Confirm Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-medium tracking-wide uppercase text-slate-300 mb-1.5"
                    >
                      Master Password <span className="text-indigo-400">*</span>
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
                        placeholder="Min 8 characters"
                        required
                        className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-900 border text-white placeholder-slate-500 transition-all outline-none ${
                          validationErrors.password
                            ? "border-rose-500 ring-1 ring-rose-500"
                            : "border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Toggle password"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-medium tracking-wide uppercase text-slate-300 mb-1.5"
                    >
                      Confirm Password <span className="text-indigo-400">*</span>
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
                        className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-900 border text-white placeholder-slate-500 transition-all outline-none ${
                          validationErrors.confirmPassword
                            ? "border-rose-500 ring-1 ring-rose-500"
                            : "border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label="Toggle password"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role Notification Banner */}
                <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-indigo-400 shrink-0">
                    shield
                  </span>
                  <div>
                    <span className="font-semibold text-white">Privileged Role Assignment: </span>
                    Public signups automatically provision a designated{" "}
                    <strong className="text-cyan-300">CLIENT_OWNER</strong> with full tenant autonomy. Team operators and trainees can be invited inside once verified.
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>Provisioning Enclave &amp; Generating Keys...</span>
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
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>&copy; 2026 SMMA AI Systems. Multi-Tenant Enterprise Enclave.</p>
          <div className="flex items-center gap-3">
            <span>Automated Onboarding</span>
            <span>&bull;</span>
            <span>Zero Data Leakage Guarantee</span>
          </div>
        </div>
      </div>

      {/* RIGHT AMBIENT SHOWCASE PANEL */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-l border-indigo-900/30">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-xs font-medium text-indigo-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Instant Enclave Provisioning</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Security Tier: Level 4</span>
        </div>

        {/* Value Proposition Grid */}
        <div className="relative z-10 my-auto max-w-lg mx-auto w-full space-y-4">
          <h3 className="text-2xl font-bold text-white tracking-tight">
            What your agency gets out-of-the-box:
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">10 Autonomous AI Agents</h4>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  Specialized roles for post scheduling, lead qualification, sentiment analysis, CRM sync, and tool execution.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Postgres Row-Level Security</h4>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  Your tenant data, credentials, and leads are isolated in an encrypted enclave accessible solely by your team.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">hub</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Direct Social Channel Integrations</h4>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  Connect LinkedIn, Meta, X, and WhatsApp Business credentials with automatic token rotation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60">
          <span>Deployment Ready: Next.js + Express Node</span>
          <span className="text-emerald-400 font-mono">Zero Config Required</span>
        </div>
      </div>
    </div>
  );
}
