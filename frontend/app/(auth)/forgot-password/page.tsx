"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordApi } from "@/services/authService";
import { ApiError } from "@/services/api";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid work email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPasswordApi(email.trim());
      setLoading(false);
      setSent(true);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) setError(err.message);
      else setError("Password reset request failed. Please check your network and try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* FORM PANE */}
      <div className="w-full lg:w-[50%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative z-10 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link href="/login" className="transition-transform hover:scale-[1.02]">
            <Logo size="md" showText={true} />
          </Link>
          <Link
            href="/login"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-indigo-300 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>

        <div className="my-auto py-8 max-w-md w-full mx-auto">
          {sent ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-emerald-500/30 text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950">
                <span className="material-symbols-outlined text-[32px]">mark_email_read</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Check Your Inbox</h2>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  We sent a secure password reset token to{" "}
                  <strong className="text-white font-mono">{email}</strong>.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  The reset token will expire in 60 minutes for security compliance.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/reset-password"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Enter Token Now</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Self-Service Key Recovery
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Reset Enclave Password
                </h1>
                <p className="mt-1.5 text-sm text-slate-400">
                  Enter your registered work email to receive a single-use password reset token.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-3 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-400 shrink-0 mt-0.5">
                    error
                  </span>
                  <div>
                    <p className="font-semibold text-rose-200">Recovery Failed</p>
                    <p className="mt-0.5 leading-relaxed text-rose-300/90">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium tracking-wide uppercase text-slate-300 mb-1.5"
                  >
                    Registered Work Email
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
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-slate-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      <span>Dispatching Secure Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Token</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>Remember your password? </span>
                <Link
                  href="/login"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors underline-offset-4 hover:underline"
                >
                  Return to Sign In &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <p>&copy; 2026 SMMA AI Systems.</p>
          <span>Time-Bound PBKDF2 Token Invalidation</span>
        </div>
      </div>

      {/* RIGHT AMBIENT SHOWCASE PANEL */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-l border-indigo-900/30">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/30 text-xs font-medium text-indigo-300 shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Zero-Knowledge Architecture</span>
          </div>
          <span className="text-xs font-mono text-slate-400">Auth Token v2.4</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg mx-auto w-full space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-indigo-500/30 backdrop-blur-md shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <span className="material-symbols-outlined text-[20px] text-indigo-400">lock_clock</span>
              <span>Hardware-Grade Token Expiration</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Password reset requests generate high-entropy 64-byte cryptographic tokens stored with PBKDF2 hashing. All existing sessions are automatically terminated upon successful reset.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/60">
          <span>Multi-Tenant Enclave Node</span>
          <span className="text-indigo-400 font-mono">Status: Secure</span>
        </div>
      </div>
    </div>
  );
}
