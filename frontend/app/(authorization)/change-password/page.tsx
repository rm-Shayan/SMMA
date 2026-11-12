"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { changePasswordApi } from "@/services/authService";
import { ApiError } from "@/services/api";

export default function ChangePasswordPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!oldPassword) { setError("Please enter your current password."); return; }
    if (!newPassword || newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (!confirmPassword || confirmPassword !== newPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await changePasswordApi(oldPassword, newPassword);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => dispatch(logout()), 1500);
    } catch (err) {
      setLoading(false);
      if (err instanceof ApiError) setError(err.message);
      else setError("Password change failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface">
      <div className="max-w-[480px] mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface">Change Password</h1>
          <p className="text-xs text-secondary mt-1">Change your account password. All other active sessions will be revoked.</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-error-container/40 border border-error/20 text-xs">
              <p className="font-semibold text-error">Change Failed</p>
              <p className="mt-0.5 text-secondary">{error}</p>
            </div>
          )}

          {success ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                <span className="material-symbols-outlined text-[24px]">check_circle</span>
              </div>
              <h2 className="text-lg font-bold text-on-surface">Password changed</h2>
              <p className="text-xs text-secondary mt-1">Your password has been updated and you'll be signed out of all other sessions shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="oldPassword" className="block text-xs font-semibold uppercase text-secondary mb-1.5">Current Password <span className="text-error">*</span></label>
                <div className="relative">
                  <input type={showOld ? "text" : "password"} id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter your current password" required className="w-full pr-11 px-3.5 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute inset-y-0 right-0 pr-3.5 text-secondary" aria-label="Toggle password visibility"><span className="material-symbols-outlined text-[18px]">{showOld ? "visibility_off" : "visibility"}</span></button>
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-xs font-semibold uppercase text-secondary mb-1.5">New Password <span className="text-error">*</span></label>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required className="w-full pr-11 px-3.5 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3.5 text-secondary" aria-label="Toggle password visibility"><span className="material-symbols-outlined text-[18px]">{showNew ? "visibility_off" : "visibility"}</span></button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase text-secondary mb-1.5">Confirm New Password <span className="text-error">*</span></label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your new password" required className="w-full pr-11 px-3.5 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3.5 text-secondary" aria-label="Toggle password visibility"><span className="material-symbols-outlined text-[18px]">{showConfirm ? "visibility_off" : "visibility"}</span></button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary-container hover:bg-primary-container/90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
                {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Changing Password...</span></> : <><span>Change Password</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary">
            <span>Signed in as {user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
