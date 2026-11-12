import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import AuthInitializer from "@/components/auth/AuthInitializer";

// Self-hosted at build time: no external stylesheet request, no layout shift.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SMMA AI - Agency Operations Platform",
  description: "Multi-tenant autonomous agency operations, inbound AI sales, and engagement platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable}`}>
      <head>
        {/* Icon font is served from /public so symbols never wait on fonts.gstatic.com. */}
        <link
          rel="preload"
          href="/fonts/material-symbols-outlined.woff2?v=4"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <ReduxProvider>
          <AuthInitializer />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
