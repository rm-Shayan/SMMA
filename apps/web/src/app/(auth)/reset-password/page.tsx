'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bolt, Eye, EyeOff, CheckCircle2, Circle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useResetPasswordMutation } from '@/redux/api/authApi';
import { ApiError } from '@/services/api';

function ResetPasswordForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const token = searchParams.get('token') ?? '';
 const [resetPassword, { isLoading }] = useResetPasswordMutation();

 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);

 // Requirements checks
 const hasMinLength = password.length >= 8;
 const hasUppercase = /[A-Z]/.test(password);
 const hasNumber = /[0-9]/.test(password);
 const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

 const passedCount = [hasMinLength, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!token) {
 toast.error('This reset link is invalid. Please request a new one.');
 return;
 }
 if (passedCount < 3) {
 toast.error('Please fulfill at least 3 password requirements');
 return;
 }
 if (password !== confirmPassword) {
 toast.error('Passwords do not match');
 return;
 }
 try {
 await resetPassword({ token, password }).unwrap();
 toast.success('Password updated successfully! Please sign in.');
 router.push('/login');
 } catch (err) {
 const apiErr = err as ApiError;
 toast.error(apiErr?.message || 'This reset link is invalid or has expired.');
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

 {/* Heading */}
 <div className="text-center w-full mb-6">
 <h1 className="text-xl font-bold tracking-tight text-on-surface mb-1.5">Set a new password</h1>
 <p className="text-xs text-secondary">Choose a robust passphrase for your account</p>
 </div>

 <form onSubmit={handleSubmit} className="w-full space-y-4">
 <div>
 <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">New password</label>
 <div className="relative">
 <input
 type={showPassword ? 'text' : 'password'}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••••••"
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
 </div>

 {/* Strength Bar */}
 <div className="space-y-1.5">
 <div className="flex items-center justify-between text-[11px]">
 <span className="font-semibold text-secondary uppercase tracking-wider">Complexity</span>
 <span className="font-bold text-emerald-600">
 {passedCount <= 1 ? 'Weak' : passedCount <= 3 ? 'Good' : 'Strong'}
 </span>
 </div>
 <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
 <div className={`rounded-full transition-colors ${passedCount >= 1 ? 'bg-emerald-500' : 'bg-surface-container'}`} />
 <div className={`rounded-full transition-colors ${passedCount >= 2 ? 'bg-emerald-500' : 'bg-surface-container'}`} />
 <div className={`rounded-full transition-colors ${passedCount >= 3 ? 'bg-emerald-500' : 'bg-surface-container'}`} />
 <div className={`rounded-full transition-colors ${passedCount >= 4 ? 'bg-emerald-500' : 'bg-surface-container'}`} />
 </div>
 </div>

 {/* Requirements Checklist */}
 <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container space-y-1.5 text-xs text-on-surface-variant">
 <div className="flex items-center gap-2">
 {hasMinLength ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 ) : (
 <Circle className="w-3.5 h-3.5 text-outline-variant shrink-0" />
 )}
 <span className={hasMinLength ? 'text-on-surface font-medium' : 'text-secondary'}>
 At least 8 characters
 </span>
 </div>
 <div className="flex items-center gap-2">
 {hasUppercase ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 ) : (
 <Circle className="w-3.5 h-3.5 text-outline-variant shrink-0" />
 )}
 <span className={hasUppercase ? 'text-on-surface font-medium' : 'text-secondary'}>
 One uppercase letter
 </span>
 </div>
 <div className="flex items-center gap-2">
 {hasNumber ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 ) : (
 <Circle className="w-3.5 h-3.5 text-outline-variant shrink-0" />
 )}
 <span className={hasNumber ? 'text-on-surface font-medium' : 'text-secondary'}>
 One number
 </span>
 </div>
 <div className="flex items-center gap-2">
 {hasSymbol ? (
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
 ) : (
 <Circle className="w-3.5 h-3.5 text-outline-variant shrink-0" />
 )}
 <span className={hasSymbol ? 'text-on-surface font-medium' : 'text-secondary'}>
 One symbol (!@#$%^&*)
 </span>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Confirm password</label>
 <div className="relative">
 <input
 type={showConfirm ? 'text' : 'password'}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="••••••••••••"
 className="w-full h-10 pl-3.5 pr-10 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
 />
 <button
 type="button"
 onClick={() => setShowConfirm(!showConfirm)}
 className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface-variant transition-colors"
 >
 {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>

 <div className="pt-2">
 <button
 type="submit"
 disabled={isLoading}
 className="w-full h-10 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
 >
 <span>{isLoading ? 'Updating...' : 'Update password'}</span>
 <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </form>

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

export default function ResetPasswordPage() {
 return (
 <Suspense>
 <ResetPasswordForm />
 </Suspense>
 );
}
