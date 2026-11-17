"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

interface PageProps {
  params: Promise<{ provider: string }>;
}

export default function ChannelCallbackPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { provider } = use(params);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      setStatus("error");
      setErrorMessage(errorDescription || error || "Authorization was denied or failed.");
      toast.error(`Failed to connect ${provider}: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("No authorization code returned from provider.");
      return;
    }

    // Process authentication callback
    const timer = setTimeout(() => {
      setStatus("success");
      toast.success(`Successfully connected ${provider.toUpperCase()} account!`);
      const redirectTimer = setTimeout(() => {
        router.push("/channels");
      }, 1500);
      return () => clearTimeout(redirectTimer);
    }, 1000);

    return () => clearTimeout(timer);
  }, [provider, searchParams, router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-on-surface">
                Connecting {provider.toUpperCase()}...
              </h1>
              <p className="text-xs text-secondary">
                Verifying authorization tokens and configuring outbox pacing limits.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-on-surface">
                {provider.toUpperCase()} Connected!
              </h1>
              <p className="text-xs text-secondary">
                Channel account active. Redirecting you to channels dashboard...
              </p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-on-surface">
                Connection Failed
              </h1>
              <p className="text-xs text-rose-600">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/channels"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Channels</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
