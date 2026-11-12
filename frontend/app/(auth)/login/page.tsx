"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginApi } from "@/services/authService";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import { ApiError } from "@/services/api";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("admin@agency.com");
  const [password, setPassword] = useState("admin123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const setDemoAccount = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setErrorState(null);
    setValidationErrors({});
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Please enter your work email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email format.";
    if (!password) errors.password = "Password is required.";
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
          setErrorState(err.message || "Invalid email or password. Verify your credentials.");
        } else {
          setErrorState(err.message);
        }
      } else {
        setErrorState("Something went wrong while signing in. Please check your connection.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100/90 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans text-slate-800 antialiased">
      {/* Soft Ambient Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/30 blur-[130px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] relative z-10 flex flex-col">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block transition-transform hover:scale-[1.02] mb-3">
            <Logo size="lg" showText={true} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Welcome back! Access your autonomous sales operations workspace.
          </p>
        </div>

        {/* Floating Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-9 border border-slate-200/90 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.08),0_4px_16px_rgba(0,0,0,0.02)]">
          {/* Quick Demo Credentials Bar */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                1-Click Quick Demo Login:
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">Click to fill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount("admin@agency.com", "admin123456")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  email === "admin@agency.com"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                SuperAdmin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("owner@agency.com", "owner123456")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  email === "owner@agency.com"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                Agency Owner
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("operator@agency.com", "operator123456")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                  email === "operator@agency.com"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                Operator
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorState && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px] text-rose-500 shrink-0 mt-0.5">
                error
              </span>
              <div>
                <p className="font-semibold text-rose-800">Authentication Failed</p>
                <p className="mt-0.5 leading-relaxed text-rose-600">{errorState}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold tracking-wide uppercase text-slate-600 mb-1.5"
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
                  placeholder="name@agency.com"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    validationErrors.email
                      ? "border-rose-400 ring-2 ring-rose-100 bg-white"
                      : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                  }`}
                />
              </div>
              {validationErrors.email && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold tracking-wide uppercase text-slate-600"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
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
                  placeholder="Enter your password"
                  required
                  className={`w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none transition-all ${
                    validationErrors.password
                      ? "border-rose-400 ring-2 ring-rose-100 bg-white"
                      : "border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-md shadow-indigo-600/20 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Secondary Links */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
            <div>
              <span>Need a new organization? </span>
              <Link
                href="/register"
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors underline-offset-4 hover:underline"
              >
                Register Agency Enclave &rarr;
              </Link>
            </div>
            <div>
              <span>Didn&apos;t receive email? </span>
              <Link
                href="/verify-email"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Verify Token
              </Link>
              <span className="mx-1 text-slate-300">&bull;</span>
              <Link
                href="/resend-verification"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Resend Link
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-emerald-500">verified_user</span>
            SOC-2 Type II
          </span>
          <span>&bull;</span>
          <span>AES-256 Multi-Tenant Enclave</span>
        </div>
      </div>
    </div>
  );
}
