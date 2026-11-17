'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bolt, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useGetInviteQuery as useAcceptInviteQuery, useAcceptInviteMutation } from '@/redux/api/authApi';

function InviteForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const token = searchParams.get('token') ?? '';

 const {
  data: inviteData,
  isLoading: inviteLoading,
  isError: inviteError,
 } = useAcceptInviteQuery(token, { skip: !token });
 const [accept, { isLoading: accepting }] = useAcceptInviteMutation();

 const invite = inviteData?.invite;
 const invalid = !token || inviteError;

 const [fullName, setFullName] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);

 const [isNavigating, setIsNavigating] = useState(false);

 const pwdLength = password.length;
 const strengthLevel = pwdLength === 0 ? 'Empty' : pwdLength < 6 ? 'Weak' : pwdLength < 10 ? 'Medium' : 'Strong';

 const isBusy = accepting || isNavigating;

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isBusy) return;

  if (invalid) {
   toast.error('This invitation has expired or is invalid.');
   return;
  }
  if (!fullName || !password) {
   toast.error('Please fill in all required fields');
   return;
  }
  if (password !== confirmPassword) {
   toast.error('Passwords do not match');
   return;
  }
  try {
   await accept({ token, name: fullName, password }).unwrap();
   setIsNavigating(true);
   toast.success('Account created! Redirecting to sign in...');
   router.replace('/login');
  } catch (err) {
   setIsNavigating(false);
   const message =
    (err as { data?: { message?: string } })?.data?.message ||
    'This invitation is invalid, expired, or already redeemed.';
   toast.error(message);
  }
 };

 if (inviteLoading && token) {
  return (
   <div className="w-full max-w-md mx-auto">
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/80 shadow-[0_4px_24px_rgba(6,60,188,0.06)] p-8 text-center text-xs text-secondary">
     Checking invitation…
    </div>
   </div>
  );
 }

 return (
 <div className="w-full max-w-md mx-auto">
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

 {invalid ? (
 <div className="w-full text-center space-y-4">
 <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
 <AlertCircle className="w-6 h-6" />
 </div>
 <div>
 <h1 className="text-xl font-bold tracking-tight text-on-surface">Invitation Invalid or Expired</h1>
 <p className="text-xs text-secondary mt-1.5 leading-relaxed">
 This invitation link has expired or has already been redeemed. Please ask your administrator to send a new invite.
 </p>
 </div>
 <div className="pt-2">
 <Link
 href="/login"
 className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-lg shadow transition-all flex items-center justify-center gap-2"
 >
 <span>Return to sign in</span>
 </Link>
 </div>
 </div>
 ) : (
 <>
 {/* Heading & Subtitle */}
 <div className="text-center w-full mb-4">
 <h1 className="text-xl font-bold tracking-tight text-on-surface mb-1">
 Join {invite?.companyName ?? 'your workspace'}
 </h1>
 <p className="text-xs text-secondary">Create your workspace profile to get started</p>
 </div>

 {/* Context Callout Box */}
 <div className="w-full bg-surface-container-lowest border border-outline-variant/70 rounded-xl p-3 mb-5 space-y-2 text-xs">
 <div className="flex items-center justify-between">
 <span className="text-secondary">Assigned Role</span>
 <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-bold text-[10px] uppercase">
 {(invite?.role ?? '').replace('_', ' ')}
 </span>
 </div>
 {invite?.companyName && (
 <div className="flex items-center justify-between">
 <span className="text-secondary">Workspace</span>
 <span className="font-semibold text-on-surface">{invite.companyName}</span>
 </div>
 )}
 </div>

 <form onSubmit={handleSubmit} className="w-full space-y-4">
 <div>
 <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full name</label>
 <input
 type="text"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 placeholder="e.g. Sarah Jenkins"
 className="w-full h-10 px-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
 <input
 type="email"
 value={invite?.email ?? ''}
 disabled
 className="w-full h-10 px-3.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-secondary cursor-not-allowed select-all"
 />
 </div>

 <div>
 <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Create password</label>
 <div className="relative">
 <input
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Enter passphrase"
 className="w-full h-10 pl-3.5 pr-10 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors"
 >
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>

 {/* Strength Meter */}
 <div className="mt-1.5 space-y-1">
 <div className="flex items-center justify-between text-[10px]">
 <span className="text-outline">Strength</span>
 <span className="font-semibold text-on-surface-variant">{strengthLevel}</span>
 </div>
 <div className="grid grid-cols-4 gap-1 h-1">
 <div className={`rounded-full ${pwdLength > 0 ? 'bg-amber-400' : 'bg-surface-container'}`} />
 <div className={`rounded-full ${pwdLength >= 6 ? 'bg-amber-400' : 'bg-surface-container'}`} />
 <div className={`rounded-full ${pwdLength >= 8 ? 'bg-emerald-500' : 'bg-surface-container'}`} />
 <div className={`rounded-full ${pwdLength >= 10 ? 'bg-emerald-500' : 'bg-surface-container'}`} />
 </div>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Confirm password</label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="Repeat passphrase"
 className="w-full h-10 px-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>

 <div className="pt-2">
 <button
  type="submit"
  disabled={isBusy}
  className="w-full h-10 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg shadow-sm shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
 >
  {isBusy ? (
   <>
    <Loader2 className="w-4 h-4 animate-spin text-white" />
    <span>{isNavigating ? 'Redirecting to sign in…' : 'Activating account…'}</span>
   </>
  ) : (
   <>
    <span>Activate account & join</span>
    <ArrowRight className="w-4 h-4" />
   </>
  )}
 </button>
 </div>
 </form>
 </>
 )}
 </div>
 </div>
 );
}

export default function AcceptInvitePage() {
 return (
  <Suspense>
   <InviteForm />
  </Suspense>
 );
}
