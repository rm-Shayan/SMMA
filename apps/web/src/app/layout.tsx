import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import AuthInitializer from "@/components/auth/AuthInitializer";
import ToastProvider from "@/components/providers/ToastProvider";

// Self-hosted at build time: no external stylesheet request, no layout shift.
const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const metadata: Metadata = {
    title: {
        default: "Styre-Bot | Autonomous Enterprise AI Platform",
        template: "%s | Styre-Bot",
    },
    description: "Styre-Bot — Autonomous enterprise agentic AI, multi-tenant workforce automation, and intelligence platform by Styre Tech.",
    icons: {
        icon: [
            { url: "/brand/icon.png", sizes: "512x512", type: "image/png" },
            { url: "/favicon.ico" },
        ],
        apple: [{ url: "/brand/icon.png", sizes: "180x180", type: "image/png" }],
        shortcut: ["/brand/icon.png"],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`h-full antialiased ${inter.variable}`}>
            <head>
                {/* Full Google Material Symbols Outlined font */}
                {/* eslint-disable-next-line @next/next/no-page-custom-font */}
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
                />
            </head>
            <body className="min-h-full flex flex-col bg-surface text-on-surface">
                <ReduxProvider>
                    <AuthInitializer />
                    <ToastProvider />
                    {children}
                </ReduxProvider>
            </body>
        </html>
    );
}
