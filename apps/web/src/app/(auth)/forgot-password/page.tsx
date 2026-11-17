'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Bolt, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
import { useForgotPasswordMutation } from '@/redux/api/authApi';
import { ApiError } from '@/services/api';

export default function ForgotPasswordPage() {
 const [email, setEmail] = useState('');
 const [isSubmitted, setIsSubmitted] = useState(false);
 const [resetUrl, setResetUrl] = useState<string | null>(null);
 const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email) {
 toast.error('Please enter your email address');
 return;
 }
 try {
 const res = await forgotPassword({ email }).unwrap();
 setIsSubmitted(true);
 // Dev mode: API returns the reset link directly (no SMTP yet).
 setResetUrl(res.resetUrl ?? null);
 toast.success(res.message || 'Password reset link sent to your email');
 } catch (err) {
 const apiErr = err as ApiError;
 toast.error(apiErr?.message || 'Could not process your request. Please try again.');
 }
 };

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

 {!isSubmitted ? (
 <>
 <div className="text-center w-full mb-6">
 <h1 className="text-xl font-bold tracking-tight text-on-surface mb-1.5">Reset your password</h1>
 <p className="text-xs text-secondary">
 Enter your work email and we will send you a recovery link
 </p>
 </div>

 <form onSubmit={handleSubmit} className="w-full space-y-4">
 <div>
 <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="name@company.com"
 className="w-full h-10 px-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 </div>

 <div className="pt-2">
 <button
 type="submit"
 disabled={isLoading}
 className="w-full h-10 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
 >
 <span>{isLoading ? 'Sending link...' : 'Send reset link'}</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </form>
 </>
 ) : (
 <div className="text-center w-full space-y-4">
 <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
 <MailCheck className="w-6 h-6" />
 </div>
 <div>
 <h2 className="text-lg font-bold text-on-surface">Check your email</h2>
 <p className="text-xs text-secondary mt-1 leading-relaxed">
 We sent a password reset link to <strong className="text-on-surface">{email}</strong>. The link expires in 60 minutes.
 </p>
 </div>

 {/* Dev mode: API returns the link directly since SMTP is not configured yet. */}
 {resetUrl && (
 <Link
 href={resetUrl}
 className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-lg shadow-sm shadow-primary/25 transition-all flex items-center justify-center gap-2"
 >
 <span>Open reset link (dev)</span>
 <ArrowRight className="w-4 h-4" />
 </Link>
 )}

 <div className="pt-2">
 <button
 type="button"
 onClick={async () => {
 try {
 const res = await forgotPassword({ email }).unwrap();
 setResetUrl(res.resetUrl ?? null);
 toast.success('New reset link dispatched');
 } catch {
 toast.error('Could not resend the link. Please try again.');
 }}
 }
 className="w-full h-10 bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-semibold text-xs rounded-lg transition-colors"
 >
 Resend email
 </button>
 </div>
 </div>
 )}

 <div className="mt-6 pt-4 border-t border-surface-container w-full text-center">
 <Link
 href="/login"
 className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors"
 >
 <ArrowLeft className="w-3.5 h-3.5" />
 <span>Back to sign in</span>
 </Link>
 </div>
 </div>
 </div>
 );
}
