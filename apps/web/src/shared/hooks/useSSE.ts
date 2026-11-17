"use client";

import { useState, useCallback, useRef } from "react";

export interface UseSSEOptions {
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const [data, setData] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (url: string, body?: unknown, headers: Record<string, string> = {}) => {
      setIsStreaming(true);
      setError(null);
      setData("");

      abortControllerRef.current = new AbortController();

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("auth_token") || localStorage.getItem("token")
            : null;

        const response = await fetch(url, {
          method: body ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE stream failed with status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (!reader) {
          throw new Error("Unable to read streaming response body");
        }

        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setData(accumulated);
          options.onToken?.(chunk);
        }

        options.onComplete?.(accumulated);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        const streamError = err instanceof Error ? err : new Error(String(err));
        setError(streamError);
        options.onError?.(streamError);
      } finally {
        setIsStreaming(false);
      }
    },
    [options]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return {
    data,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
}
