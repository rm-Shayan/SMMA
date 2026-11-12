"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { resendVerificationApi } from "@/services/authService";
import { ApiError } from "@/services/api";

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
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
      else setError("Resend failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>
      <div className="w-full max-w-[440px] relative z-10 flex flex-col">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white"><span className="material-symbols-outlined text-[22px]">email</span></div>
            <div className="text-left"><div className="text-xl font-bold text-on-surface">SMMA AI</div><div className="text-[10px] font-semibold text-primary-container uppercase">Autonomous Platform</div></div>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Resend verification email</h1>
          <p className="text-xs text-secondary mt-1">Enter your email address and we'll send a new verification link.</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-error-container/40 border border-error/20 text-xs">
              <p className="font-semibold text-error">Resend Failed</p>
              <p className="mt-0.5 text-secondary">{error}</p>
            </div>
          )}

          {sent ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">Verification email sent</h2>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
                A new verification link has been sent to <strong>{email}</strong>. Please check your inbox.
              </p>
              <div className="mt-5 flex justify-center">
                <Link href="/login" className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-container text-white hover:bg-primary-container/90 transition-colors">Sign In</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase text-secondary mb-1.5">Email Address <span className="text-error">*</span></label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@agency.com" required className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary-container hover:bg-primary-container/90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
                {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Sending Verification Email...</span></> : <><span>Resend Verification Email</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary">
            <span>Already verified? </span><Link href="/login" className="text-primary-container font-semibold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
