"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmailApi, resendVerificationApi } from "@/services/authService";
import { ApiError } from "@/services/api";
import Logo from "@/components/Logo";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
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
        else setError("Verification failed. Please try again.");
      });
  }, [token]);

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
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>

      <div className="w-full max-w-[440px] relative z-10 flex flex-col">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={true} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            {verified ? "Email Verified Successfully!" : "Account Email Verification"}
          </h1>
          <p className="text-xs text-secondary mt-1">
            {verified ? "Your credentials are confirmed. You can now access your agency enclave." : "Confirm your corporate email address to activate your access token."}
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-error-container/30 border border-error/20 text-xs text-error">
              {error}
            </div>
          )}

          {verified ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                <span className="material-symbols-outlined text-[32px]">verified</span>
              </div>
              <p className="text-xs text-secondary">Your account is fully verified and active.</p>
              <div>
                <Link href="/login" className="inline-block px-6 py-2.5 bg-primary-container text-white text-xs font-semibold rounded-xl hover:bg-primary-container/90">
                  Sign in to Dashboard
                </Link>
              </div>
            </div>
          ) : token ? (
            <div className="text-center py-6">
              {loading ? (
                <div className="space-y-3">
                  <span className="material-symbols-outlined text-[28px] animate-spin text-primary">progress_activity</span>
                  <p className="text-xs text-secondary">Validating verification token against security ledger...</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-secondary leading-relaxed">
                Enter your registered email address below to receive a new cryptographic verification link.
              </p>
              {resendSuccess ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium">
                  If an unverified account exists for this address, a new link has been dispatched.
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">Email Address</label>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="you@agency.com"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-outline-variant/50 focus:border-primary outline-none bg-surface"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full py-2.5 bg-primary-container text-white text-xs font-semibold rounded-xl hover:bg-primary-container/90 disabled:opacity-60 cursor-pointer"
                  >
                    {resendLoading ? "Sending Link..." : "Send Verification Email"}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary">
            <span>Ready to sign in? </span>
            <Link href="/login" className="text-primary-container font-semibold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
