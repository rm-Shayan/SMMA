'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bolt, Eye, EyeOff, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { useLoginMutation } from '@/redux/api/authApi';
import { ApiError } from '@/services/api';
import { normalizeRole } from '@/services/authService';
import type { UserRole } from '@/types/auth';

/** Role-based landing after sign in (unless ?next= is present). */
function homeFor(role: UserRole): string {
  switch (role) {
    case 'SUPERADMIN':
      return '/tenant-director';
    case 'COMPANY_ADMIN':
      return '/dashboard';
    case 'MANAGER':
      return '/dashboard';
    case 'EMPLOYEE':
      return '/workspace';
    default:
      return '/dashboard';
  }
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const isBusy = isLoading || isNavigating || isRateLimited;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      const res = await login({ email, password }).unwrap();
      setIsNavigating(true);
      // establishSession() already persisted token + user via onQueryStarted.
      const rawRole = (res as unknown as { user?: { role?: string } })?.user?.role;
      const next = searchParams.get('next');
      const target =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : homeFor(normalizeRole(rawRole));
      toast.success('Signed in! Redirecting to workspace...');
      router.replace(target);
    } catch (err) {
      setIsNavigating(false);
      const apiErr = err as ApiError;
      if (apiErr?.status === 429) {
        setIsRateLimited(true);
        return;
      }
      toast.error(apiErr?.message || 'Sign in failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Main Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 shadow-[0_4px_24px_rgba(6,60,188,0.06)] p-8 flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shadow-primary/20 flex items-center justify-center shrink-0">
            <Image
              src="/brand/icon.png"
              alt="Styre-Bot"
              width={40}
              height={40}
              className="rounded-xl object-contain"
              priority
            />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-lg font-bold tracking-tight text-on-surface">Styre-Bot</span>
            <span className="text-[11px] font-semibold text-primary">AI Fleet Platform</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center w-full mb-6">
          <h1 className="text-xl font-bold tracking-tight text-on-surface mb-1.5">Sign in</h1>
          <p className="text-xs text-secondary">Use your workspace credentials to continue</p>
        </div>

        {/* Rate Limited Banner */}
        {isRateLimited && (
          <div className="w-full mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Account temporarily locked</span>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Too many unsuccessful sign in attempts. Please wait 14 minutes or reset your password.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled={isBusy}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full h-10 px-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                disabled={isBusy}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 pl-3.5 pr-10 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
              />
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isBusy}
              className="w-full h-10 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg shadow-sm shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              {isBusy && !isRateLimited ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isNavigating ? 'Redirecting to workspace…' : 'Signing in…'}</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Fill */}
          <div className="pt-3 border-t border-outline-variant/50 flex items-center justify-center gap-2">
            <span className="text-[11px] text-secondary font-medium">Quick sign-in:</span>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@styretech.com');
                setPassword('password123');
              }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-surface-container-high hover:bg-surface-container-highest text-primary border border-outline-variant rounded-md transition-colors"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('ahmer@northwind.io');
                setPassword('password123');
              }}
              className="px-2.5 py-1 text-[11px] font-semibold bg-surface-container-high hover:bg-surface-container-highest text-secondary border border-outline-variant rounded-md transition-colors"
            >
              Agency Admin
            </button>
          </div>
        </form>

        {/* Signup Link for new Agency / Company Admin */}
        <div className="mt-6 pt-5 border-t border-outline-variant/60 text-center w-full space-y-2">
          <p className="text-xs text-on-surface-variant">
            Don&apos;t have an agency workspace?{' '}
            <Link
              href="/register"
              className="font-bold text-primary hover:underline transition-colors"
            >
              Create Company
            </Link>
          </p>
          <p className="text-[11px] text-outline">
            Team members and employees join via email invitation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
