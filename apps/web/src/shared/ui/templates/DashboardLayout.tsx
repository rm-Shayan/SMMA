"use client";

import React from "react";
import { Sidebar } from "../organisms/Sidebar";
import { TopNavbar } from "../organisms/TopNavbar";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  userName?: string;
  userRole?: string;
}

export function DashboardLayout({
  children,
  breadcrumbs,
  userName,
  userRole,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNavbar
          breadcrumbs={breadcrumbs}
          userName={userName}
          userRole={userRole}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
