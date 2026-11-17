import React from "react";

interface PageHeaderProps {
 title: string;
 badge?: React.ReactNode;
 description?: string;
 actions?: React.ReactNode;
 children?: React.ReactNode;
 className?: string;
}

export function PageHeader({
 title,
 badge,
 description,
 actions,
 children,
 className = "",
}: PageHeaderProps) {
 return (
 <div
 className={`flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-margin-lg pb-space-md border-b border-outline-variant ${className}`}
 >
 <div>
 <div className="flex items-center gap-space-sm mb-space-xs flex-wrap">
 <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
 {title}
 </h1>
 {badge}
 </div>
 {description && (
 <p className="font-body-md text-body-md text-secondary mt-0.5">
 {description}
 </p>
 )}
 </div>

 {(actions || children) && (
 <div className="flex items-center flex-wrap gap-space-sm shrink-0">
 {actions}
 {children}
 </div>
 )}
 </div>
 );
}
