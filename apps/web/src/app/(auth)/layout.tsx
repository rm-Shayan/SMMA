import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
            {/* Background Subtle Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

            {/* Main Auth Content Container */}
            <div className="w-full relative z-10 flex flex-col items-center">
                {children}
            </div>
        </div>
    );
}

