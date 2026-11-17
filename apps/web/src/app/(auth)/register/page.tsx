'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bolt, ArrowRight, Eye, EyeOff, Building, Mail, User, Lock, Loader2 } from 'lucide-react';
import { useSignupMutation } from '@/redux/api/authApi';
import { ApiError } from '@/services/api';

/**
 * Public signup = Company Admin only (the recommended SaaS flow).
 * Managers/employees join via admin invite (/accept-invite); super_admin is
 * seeded — neither can self-register here.
 *
 * On success the session is established (onQueryStarted) and the new admin
 * lands on /credits with 0 credits → purchase flow = subscription gate.
 */
export default function RegisterPage() {
 const router = useRouter();
 const [signup, { isLoading }] = useSignupMutation();

 const [name, setName] = useState('');
 const [companyName, setCompanyName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);

 const [isNavigating, setIsNavigating] = useState(false);

 const isBusy = isLoading || isNavigating;

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isBusy) return;

  if (!name.trim() || !companyName.trim() || !email.trim() || !password) {
   toast.error('Please fill in all fields');
   return;
  }
  if (password.length < 6) {
   toast.error('Password must be at least 6 characters');
   return;
  }

  try {
   await signup({
    name: name.trim(),
    email: email.trim(),
    password,
    companyName: companyName.trim(),
   }).unwrap();
   setIsNavigating(true);
   toast.success('Company created! Redirecting to setup billing...');
   router.replace('/credits');
  } catch (err) {
   setIsNavigating(false);
   const apiErr = err as ApiError;
   toast.error(apiErr?.message || 'Sign up failed. Please try again.');
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
  <h1 className="text-xl font-bold tracking-tight text-on-surface mb-1.5">Create your workspace</h1>
  <p className="text-xs text-secondary">Start your company account — it&apos;s free to set up</p>
  </div>

  {/* Form */}
  <form onSubmit={handleSubmit} className="w-full space-y-4">
  <div>
  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full name</label>
  <div className="relative">
  <User className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
  <input
   type="text"
   value={name}
   onChange={(e) => setName(e.target.value)}
   placeholder="Alex Morgan"
   className="w-full h-10 pl-9 pr-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
  />
  </div>
  </div>

  <div>
  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Company name</label>
  <div className="relative">
  <Building className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
  <input
   type="text"
   value={companyName}
   onChange={(e) => setCompanyName(e.target.value)}
   placeholder="Apex Growth Partners, LLC"
   className="w-full h-10 pl-9 pr-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
  />
  </div>
  </div>

  <div>
  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Work email</label>
  <div className="relative">
  <Mail className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
  <input
   type="email"
   value={email}
   onChange={(e) => setEmail(e.target.value)}
   placeholder="name@company.com"
   className="w-full h-10 pl-9 pr-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
  />
  </div>
  </div>

  <div>
  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Password</label>
  <div className="relative">
  <Lock className="w-3.5 h-3.5 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
  <input
   type={showPassword ? 'text' : 'password'}
   value={password}
   onChange={(e) => setPassword(e.target.value)}
   placeholder="Minimum 6 characters"
   className="w-full h-10 pl-9 pr-10 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

  <div className="pt-2">
  <button
   type="submit"
   disabled={isBusy}
   className="w-full h-10 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg shadow-sm shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
  >
   {isBusy ? (
    <>
     <Loader2 className="w-4 h-4 animate-spin text-white" />
     <span>{isNavigating ? 'Redirecting to setup billing…' : 'Creating workspace…'}</span>
    </>
   ) : (
    <>
     <span>Create workspace</span>
     <ArrowRight className="w-4 h-4" />
    </>
   )}
  </button>
  </div>
  </form>

  <div className="mt-6 text-center">
  <p className="text-[11px] text-outline">
  Already have an account?{' '}
  <Link href="/login" className="font-semibold text-primary hover:underline">
   Sign in
  </Link>
  </p>
  <p className="text-[11px] text-outline mt-2">
  Team members are invited by your workspace admin — they don&apos;t sign up here.
  </p>
  </div>
  </div>
  </div>
 );
}
