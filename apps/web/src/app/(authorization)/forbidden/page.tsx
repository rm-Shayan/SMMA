'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, Home } from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import { ROLE_LABEL } from '@/store/role-labels';

export default function ForbiddenPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);
  const roleLabel = user?.role ? (ROLE_LABEL[user.role] || user.role) : 'Unknown';

  return (
    <div className="w-full flex flex-col items-center justify-center pt-12 pb-16 min-h-[calc(100vh-140px)]">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/80 shadow-[0_4px_24px_rgba(6,60,188,0.06)] p-8 flex flex-col text-center">
        <div className="w-12 h-12 rounded-full bg-surface-container-low text-primary flex items-center justify-center mx-auto mb-4 border border-primary">
          <Lock className="w-6 h-6" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-outline mb-2">Error 403</span>
        <h1 className="text-xl font-bold tracking-tight text-on-surface mb-2.5">Access Restricted</h1>
        <p className="text-xs text-secondary leading-relaxed max-w-xs mx-auto mb-6">
          Your current role does not have permission to view this page. If you need access, contact a workspace administrator.
        </p>

        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3.5 mb-6 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-secondary">Current role</span>
            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 w-full">
          <Link
            href="/dashboard"
            className="flex-1 h-10 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Dashboard</span>
          </Link>
          <button
            onClick={() => router.back()}
            type="button"
            className="flex-1 h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
