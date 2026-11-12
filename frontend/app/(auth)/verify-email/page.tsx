"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmailApi, resendVerificationApi } from "@/services/authService";
import { ApiError } from "@/services/api";
import Logo from "@/components/Logo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [manualToken, setManualToken] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    verifyEmailApi(token)
      .then((res) => {
        setLoading(false);
        if (res.success) setVerified(true);
        else setError(res.message || "Verification failed.");
      })
      .catch((err) => {
        setLoading(false);
        if (err instanceof ApiError) setError(err.message);
        else setError("Verification failed. The token may be invalid or expired.");
      });
  }, [token]);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyEmailApi(manualToken.trim());
      setLoading(false);
      if (res.success) setVerified(true);
      else setError(res.message || "Invalid verification token.");
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Verification failed.");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    setError(null);
    try {
      await resendVerificationApi(resendEmail.trim());
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] relative z-10 flex flex-col">
      {/* Header */}
      <div className="text-center mb-6">
        <Link href="/login" className="inline-block transition-transform hover:scale-[1.02] mb-3">
          <Logo size="lg" showText={true} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {verified ? "Email Verified Successfully!" : "Verify Your Account"}
        </h1>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          {verified
            ? "Your credentials are confirmed. You can now access your agency enclave."
            : "Confirm your corporate email address to unlock your agency workspace."}
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-9 border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.08),0_4px_16px_rgba(0,0,0,0.02)]">
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
              error
            </span>
            <div>
              <p className="font-semibold text-rose-800">Verification Notice</p>
              <p className="mt-0.5 leading-relaxed text-rose-600">{error}</p>
            </div>
          </div>
        )}

        {verified ? (
          <div className="p-4 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[30px]">verified</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Account Active &amp; Verified
              </h2>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Your email address has been confirmed on the identity ledger.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Sign In</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        ) : token ? (
          <div className="p-6 text-center space-y-3">
            <span className="material-symbols-outlined text-[32px] animate-spin text-indigo-600">
              progress_activity
            </span>
            <h2 className="text-base font-bold text-slate-900">Validating Enclave Token...</h2>
            <p className="text-xs text-slate-500">
              Please wait while our security ledger verifies your token.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Manual Token Input Form */}
            <form onSubmit={handleManualVerify} className="space-y-3">
              <label
                htmlFor="manualToken"
                className="block text-xs font-semibold tracking-wide uppercase text-slate-600"
              >
                Verification Token
              </label>
              <div className="relative">
                <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  key
                </span>
                <input
                  type="text"
                  id="manualToken"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste token from verification email"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 font-mono outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !manualToken.trim()}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Validating..." : "Confirm Token"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                or request new token
              </span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            {/* Resend Form */}
            {resendSuccess ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs">
                A new verification email has been dispatched to <strong>{resendEmail}</strong>.
              </div>
            ) : (
              <form onSubmit={handleResend} className="space-y-3">
                <label
                  htmlFor="resendEmail"
                  className="block text-xs font-semibold tracking-wide uppercase text-slate-600"
                >
                  Work Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    id="resendEmail"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="alex.morgan@agency.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {resendLoading ? "Sending Link..." : "Resend Verification Email"}
                </button>
              </form>
            )}

            <div className="pt-2 text-center text-xs text-slate-500">
              <Link
                href="/login"
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors underline-offset-4 hover:underline"
              >
                &larr; Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-[11px] text-slate-400">
        <p>&copy; 2026 SMMA AI Systems &middot; Multi-Tenant Enclave</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100/90 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-slate-800 antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/30 blur-[130px] rounded-full pointer-events-none" />
      <Suspense fallback={<div className="p-12 text-slate-500 text-sm">Validating security context...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
