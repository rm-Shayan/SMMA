"use client";

import { useState } from "react";
import Link from "next/link";
import { resendVerificationApi } from "@/services/authService";
import { ApiError } from "@/services/api";
import Logo from "@/components/Logo";

export default function ResendVerificationPage() {
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
      const res = await resendVerificationApi(email.trim());
      setLoading(false);
      if (res.sent) setSent(true);
      else setError(res.message || "No unverified account found for this email.");
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) setError(err.message);
      else setError("Resend failed. Please check your network and try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100/90 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-slate-800 antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/30 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10 flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block transition-transform hover:scale-[1.02] mb-3">
            <Logo size="lg" showText={true} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Resend Email Token
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Didn&apos;t receive your verification email? Enter your work email to re-issue.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-9 border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.08),0_4px_16px_rgba(0,0,0,0.02)]">
          {sent ? (
            <div className="p-4 text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[30px]">mark_email_read</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Verification Dispatched!</h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  A fresh verification token was sent to <strong className="text-slate-900 font-mono">{email}</strong>.
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Please click the link in your email to activate your account.
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Return to Sign In</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
                    error
                  </span>
                  <div>
                    <p className="font-semibold text-rose-800">Re-issuance Notice</p>
                    <p className="mt-0.5 leading-relaxed text-rose-600">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1.5"
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
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
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
                      <span>Dispatching Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Re-issue Verification Email</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                <span>Already verified? </span>
                <Link
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors underline-offset-4 hover:underline"
                >
                  Sign In &rarr;
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400">
          <p>&copy; 2026 SMMA AI Systems &middot; Multi-Tenant Enclave</p>
        </div>
      </div>
    </div>
  );
}
