"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginApi } from "@/services/authService";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import { ApiError } from "@/services/api";

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Please enter an email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address format.";
    if (!password) errors.password = "Password is required to decrypt your agency enclave.";
    if (Object.keys(errors).length > 0) { setValidationErrors(errors); return; }

    setValidationErrors({}); setErrorState(null); setLoading(true);
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
          setErrorState(err.message || "Invalid email or password. If your email is not verified, use Resend Verification below.");
        } else {
          setErrorState(err.message);
        }
      } else {
        setErrorState("Something went wrong while signing in. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>
      <div className="w-full max-w-[440px] relative z-10 flex flex-col">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white"><span className="material-symbols-outlined text-[22px]">neurology</span></div>
            <div className="text-left"><div className="text-xl font-bold text-on-surface">SMMA AI</div><div className="text-[10px] font-semibold text-primary-container uppercase">Autonomous Platform</div></div>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Sign in to your enclave</h1>
          <p className="text-xs text-secondary mt-1">Enter your verified credentials to access your agency operations console.</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8">
          {errorState && (
            <div className="mb-5 p-3.5 rounded-xl bg-error-container/40 border border-error/20 text-xs">
              <p className="font-semibold text-error">Authentication Failed</p>
              <p className="mt-0.5 text-secondary">{errorState}</p>
            </div>
          )}
          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase text-secondary mb-1.5">Email Address <span className="text-error">*</span></label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@agency.com" required className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
              {validationErrors.email && <p className="text-xs text-error mt-1.5">{validationErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase text-secondary mb-1.5">Password <span className="text-error">*</span></label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required className="w-full px-3.5 pr-11 py-2.5 text-sm rounded-xl border border-outline-variant/50 focus:border-primary-container outline-none bg-surface-container-low/40" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 text-secondary" aria-label="Toggle password visibility"><span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span></button>
              </div>
              {validationErrors.password && <p className="text-xs text-error mt-1.5">{validationErrors.password}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-primary-container hover:bg-primary-container/90 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer">
              {loading ? <><span className="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Authenticating...</span></> : <><span>Sign In</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary space-y-2">
            <span>Need an organization enclave? </span><Link href="/register" className="text-primary-container font-semibold hover:underline">Register Tenant Record</Link>
            <span>Forgot your password? </span><Link href="/forgot-password" className="text-primary-container font-semibold hover:underline">Reset Password</Link>
            <div><span>Didn't receive a verification email? </span><Link href="/verify-email" className="text-primary-container font-semibold hover:underline">Verify / Resend</Link></div>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-secondary"><p>&copy; {copyrightYear} SMMA AI Platform. All rights reserved.</p></div>
      </div>
    </div>
  );
}
