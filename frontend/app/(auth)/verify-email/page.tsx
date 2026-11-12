"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmailApi, resendVerificationApi } from "@/services/authService";
import { ApiError } from "@/services/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No verification token provided.");
      return;
    }
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
        else setError("Verification failed. Please try again.");
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await resendVerificationApi("");
      setLoading(false);
      if (res.sent) {
        setError(null);
        router.push("/login");
      } else {
        setError("No unverified account found for this email.");
      }
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) setError(err.message);
      else setError("Resend failed. Please try again.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 font-body-md text-on-surface">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-on-surface">Missing verification link</h1>
          <p className="text-xs text-secondary mt-1">Please check your email for the verification link or request a new one.</p>
          <div className="mt-5">
            <Link href="/login" className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-container text-white hover:bg-primary-container/90">Sign In</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>
      <div className="w-full max-w-[440px] relative z-10 flex flex-col">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white"><span className="material-symbols-outlined text-[22px]">verified</span></div>
            <div className="text-left"><div className="text-xl font-bold text-on-surface">SMMA AI</div><div className="text-[10px] font-semibold text-primary-container uppercase">Autonomous Platform</div></div>
          </div>
          {verified ? (
            <>
              <h1 className="text-2xl font-bold text-on-surface">Email verified!</h1>
              <p className="text-xs text-secondary mt-1">Your email address has been verified. You can now sign in to your account.</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-on-surface">Verify your email</h1>
              <p className="text-xs text-secondary mt-1">Click the link below to confirm your email address.</p>
            </>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-error-container/40 border border-error/20 text-xs">
              <p className="font-semibold text-error">Verification Failed</p>
              <p className="mt-0.5 text-secondary">{error}</p>
            </div>
          )}

          {verified ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">You're all set</h2>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto leading-relaxed">Your email is verified. Sign in to access your agency operations console.</p>
              <div className="mt-5 flex justify-center">
                <Link href="/login" className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-container text-white hover:bg-primary-container/90 transition-colors">Sign In</Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-secondary mb-4">Checking verification link...</p>
              {loading && <div className="flex justify-center"><span className="material-symbols-outlined text-[20px] animate-spin text-primary-container">progress_activity</span></div>}
            </div>
          )}
        </div>

        {!verified && (
          <div className="mt-5 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary space-y-2">
            <form onSubmit={handleResend} className="flex flex-col sm:flex-row gap-2 justify-center">
              <input type="email" placeholder="Enter your email to resend" className="flex-1 px-3 py-2 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" required />
              <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary-container text-white hover:bg-primary-container/90 disabled:opacity-70">Resend</button>
            </form>
            <p className="text-xs text-secondary">Already verified? </p>
            <Link href="/login" className="text-primary-container font-semibold hover:underline">Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
