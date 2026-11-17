import type { ReactNode } from "react";
import AuthorizationGuard from "@/components/AuthorizationGuard";
import AppShell from "@/components/AppShell";

export default function AuthorizationLayout({ children }: { children: ReactNode }) {
    return (
        <AuthorizationGuard>
            <AppShell>{children}</AppShell>
        </AuthorizationGuard>
    );
}
