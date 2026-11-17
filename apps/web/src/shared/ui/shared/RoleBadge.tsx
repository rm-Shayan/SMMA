import React from "react";
import { ShieldAlert, ShieldCheck, UserCheck, Bot, GraduationCap } from "lucide-react";
import type { UserRole } from "@/types/auth";

interface RoleBadgeProps {
 role: UserRole | string;
 className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
 const normalized = (role || "").toUpperCase();

 if (normalized === "SUPERADMIN") {
 return (
 <span
 className={`font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-indigo-900 text-indigo-100 font-semibold flex items-center gap-1 w-max ${className}`}
 >
 <ShieldAlert size={12} className="text-amber-400" />
 Super Admin
 </span>
 );
 }

 if (normalized === "CLIENT_OWNER" || normalized === "COMPANY_ADMIN") {
 return (
 <span
 className={`font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-semibold flex items-center gap-1 w-max ${className}`}
 >
 <ShieldCheck size={12} className="text-primary-container" />
 Company Admin
 </span>
 );
 }

 if (normalized === "MANAGER") {
 return (
 <span
 className={`font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-semibold flex items-center gap-1 w-max ${className}`}
 >
 <UserCheck size={12} className="text-primary-container" />
 Manager
 </span>
 );
 }

 if (normalized === "AGENT_OPERATOR" || normalized === "OPERATOR") {
 return (
 <span
 className={`font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-semibold flex items-center gap-1 w-max ${className}`}
 >
 <Bot size={12} className="text-secondary" />
 Operator
 </span>
 );
 }

 if (normalized === "TRAINEE") {
 return (
 <span
 className={`font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-surface-container text-secondary font-semibold flex items-center gap-1 w-max ${className}`}
 >
 <GraduationCap size={12} className="text-secondary" />
 Trainee
 </span>
 );
 }

 return (
 <span
 className={`font-label-xs text-label-xs px-2.5 py-1 rounded-full bg-surface-container text-secondary font-medium w-max ${className}`}
 >
 {role}
 </span>
 );
}
