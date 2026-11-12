"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginApi } from "@/services/authService";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import { ApiError } from "@/services/api";
import Logo from "@/components/Logo";

const subscribeNoop = () => () => {};

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("admin@agency.com");
  const [password, setPassword] = useState("admin123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const copyrightYear = useSyncExternalStore(subscribeNoop, () => new Date().getFullYear(), () => 2026);

  const setDemoAccount = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorState(null);
    setValidationErrors({});
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Please enter your work email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email format.";
    if (!password) errors.password = "Password is required to decrypt your agency enclave.";
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setErrorState(null);
    setLoading(true);

    try {
      const res = await loginApi({ email: email.trim(), password });
      dispatch(setCredentials({ token: res.token, refreshToken: res.refreshToken ?? null, user: res.user }));
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) {
        if (err.status === 429 && err.retryAfterSeconds) {
          setErrorState(`${err.message} Try again in ${err.retryAfterSeconds}s.`);
        } else if (err.status === 401) {
          setErrorState(err.message || "Invalid email or password. Verify your credentials or confirm your email.");
        } else {
          setErrorState(err.message);
        }
      } else {
        setErrorState("Something went wrong while signing in. Please check your network connection.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* LEFT FORM PANE */}
      <div className="w-full lg:w-[52%] xl:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link href="/login" className="transition-transform hover:scale-[1.02]">
            <Logo size="md" showText={true} />
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            All 10 Agents Operational
          </span>
        </div>

        {/* Center Auth Card */}
        <div className="my-auto py-8 max-w-md w-full mx-auto">
          {/* Welcome heading */}
          <div className="mb-6 text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Sign in to your enclave
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Welcome back. Enter your verified credentials to access your autonomous agency cockpit.
            </p>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mb-6 p-3 rounded-xl bg-slate-900/90 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                1-Click Quick Fill Demo Access:
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">dev / staging</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount("admin@agency.com", "admin123456")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  email === "admin@agency.com"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                SuperAdmin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("owner@agency.com", "owner123456")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  email === "owner@agency.com"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                Agency Owner
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("operator@agency.com", "operator123456")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  email === "operator@agency.com"
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm"
                    : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                Operator
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorState && (
            <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">
                error
              </span>
              <div>
                <p className="font-semibold text-rose-200">Authentication Alert</p>
                <p className="mt-0.5 leading-relaxed text-rose-300/90">{errorState}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium tracking-wide uppercase text-slate-300 mb-1.5"
              >
                Work Email Address
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
                  placeholder="alex.morgan@agency.com"
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium tracking-wide uppercase text-slate-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security token"
                  required
                  className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl bg-slate-900 border text-white placeholder-slate-500 transition-all outline-none ${
                    validationErrors.password
                      ? "border-rose-500 ring-1 ring-rose-500"
                      : "border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[18px]">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Navigation Links */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400 space-y-2.5">
            <div>
              <span>New Agency Owner? </span>
              <Link
                href="/register"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors underline-offset-4 hover:underline"
              >
                Provision New Agency Enclave &rarr;
              </Link>
            </div>
            <div>
              <span>Need to verify email? </span>
              <Link
                href="/verify-email"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Enter Token
              </Link>
              <span className="mx-1.5 text-slate-600">&bull;</span>
              <Link
                href="/resend-verification"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Resend Verification Link
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>&copy; {copyrightYear} SMMA AI Systems. Multi-Tenant Enterprise Edition.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-emerald-400">verified_user</span>
              SOC-2 Certified
            </span>
            <span>&bull;</span>
            <span>AES-256 GCM</span>
          </div>
        </div>
      </div>

      {/* RIGHT AMBIENT SHOWCASE PANEL */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-l border-indigo-900/30">
        {/* Background Decorative Mesh & Radial Lights */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        {/* Top Feature Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-xs font-medium text-indigo-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Engine v6.0 Autonomous SMMA Engine</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Cluster: us-east-multi-tenant</span>
        </div>

        {/* Interactive Center Mockup Card */}
        <div className="relative z-10 my-auto max-w-lg mx-auto w-full space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-indigo-500/30 backdrop-blur-md shadow-2xl shadow-indigo-950/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="text-xs font-mono text-slate-400 ml-2">agents.orchestration.live</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                99.98% Uptime
              </span>
            </div>

            {/* Agent Live Activity Rows */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">campaign</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">Post Orchestrator #4</div>
                    <div className="text-[11px] text-slate-400">Scheduled 48 posts across LinkedIn &amp; Meta</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  SYNCED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">contact_page</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">Lead Inbound Qualifier #2</div>
                    <div className="text-[11px] text-slate-400">Hot Lead (Score 94) routed to Calendly</div>
                  </div>
                </div>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  QUALIFIED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">RBAC Security Sentinel</div>
                    <div className="text-[11px] text-slate-400">Tenant cryptographic isolation verified</div>
                  </div>
                </div>
                <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  GUARDED
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-slate-200">
              &ldquo;We replaced 5 fractured marketing tools with SMMA AI. Our response time dropped from 4 hours to 9 seconds.&rdquo;
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Marcus Vance &mdash; Founder &amp; Managing Director
            </p>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60">
          <span>Enterprise Multi-Tenant Node 04</span>
          <span className="text-indigo-400 font-mono">Status: Green (Optimal)</span>
        </div>
      </div>
    </div>
  );
}
