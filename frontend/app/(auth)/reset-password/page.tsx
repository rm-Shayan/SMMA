"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordApi } from "@/services/authService";
import { ApiError } from "@/services/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No reset token provided. Please request a password reset first.");
      router.replace("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password) { setError("Please enter a new password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!confirmPassword) { setError("Please confirm your new password."); return; }
    if (confirmPassword !== password) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) setError(err.message);
      else setError("Password reset failed. Please try again.");
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>
      <div className="w-full max-w-[440px] relative z-10 flex flex-col">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white"><span className="material-symbols-outlined text-[22px]">lock_reset</span></div>
            <div className="text-left"><div className="text-xl font-bold text-on-surface">SMMA AI</div><div className="text-[10px] font-semibold text-primary-container uppercase">Autonomous Platform</div></div>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Create new password</h1>
          <p className="text-xs text-secondary mt-1">Enter your new password below. Your session will be updated automatically.</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-error-container/40 border border-error/20 text-xs">
              <p className="font-semibold text-error">Reset Failed</p>
              <p className="mt-0.5 text-secondary">{error}</p>
            </div>
          )}

          {success ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">Password reset complete</h2>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto leading-relaxed">
                Your password has been changed and all other sessions were revoked for security. Please sign in with your new password.
              </p>
              <div className="mt-5 flex justify-center">
                <Link href="/login" className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-container text-white hover:bg-primary-container/90 transition-colors">Sign In</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase text-secondary mb-1.5">New Password <span className="text-error">*</span></label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required className="w-full pr-11 px-3.5 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 text-secondary" aria-label="Toggle password visibility"><span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span></button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase text-secondary mb-1.5">Confirm New Password <span className="text-error">*</span></label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your new password" required className="w-full pr-11 px-3.5 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3.5 text-secondary" aria-label="Toggle password visibility"><span className="material-symbols-outlined text-[18px]">{showConfirmPassword ? "visibility_off" : "visibility"}</span></button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary-container hover:bg-primary-container/90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
                {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Resetting Password...</span></> : <><span>Reset Password</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary">
            <span>Didn't receive a reset link? </span><Link href="/forgot-password" className="text-primary-container font-semibold hover:underline">Request again</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
