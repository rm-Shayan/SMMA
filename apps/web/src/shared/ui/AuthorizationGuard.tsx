"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/redux/hooks";
import { isPublicPath, isRouteAllowed } from "@/store/route-access";
import { Loader2 } from "lucide-react";

export default function AuthorizationGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, status } = useAppSelector((state) => state.auth);

  const hasSession = Boolean(token && user);

  useEffect(() => {
    if (isPublicPath(pathname)) return;

    // Let AuthInitializer hydrate before deciding (one render tick).
    if (status === "idle" && !hasSession) return;

    if (!hasSession) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return;
    }

    if (user && !isRouteAllowed(pathname, user.role)) {
      router.replace("/forbidden");
    }
  }, [pathname, hasSession, status, user, router]);

  if (isPublicPath(pathname)) return <>{children}</>;

  // Session check in progress (hydration) — show smooth branded loader
  if (!hasSession && status === "idle") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shadow-primary/20 flex items-center justify-center">
          <Image src="/brand/icon.png" alt="Styre-Bot" width={48} height={48} className="rounded-xl object-contain animate-pulse" priority />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>Verifying workspace session…</span>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shadow-primary/20 flex items-center justify-center">
          <Image src="/brand/icon.png" alt="Styre-Bot" width={48} height={48} className="rounded-xl object-contain" priority />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>Redirecting to login…</span>
        </div>
      </div>
    );
  }

  if (user && !isRouteAllowed(pathname, user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shadow-primary/20 flex items-center justify-center">
          <Image src="/brand/icon.png" alt="Styre-Bot" width={48} height={48} className="rounded-xl object-contain" priority />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span>Redirecting to authorized workspace…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
