"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export interface WebSocketEvent<T = unknown> {
  topic?: string;
  type?: string;
  event?: string;
  data?: T;
  payload?: T;
  timestamp?: string;
}

export function useWebSocket<T = unknown>(
  topic: string = "all",
  onEvent?: (event: WebSocketEvent<T>) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketEvent<T> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  const authUser = useSelector((state: RootState) => state.auth?.user);

  const getCompanyId = useCallback(() => {
    if (authUser?.tenantId) return authUser.tenantId;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("company_id") || localStorage.getItem("tenant_id");
      if (stored) return stored;
    }
    return "00000000-0000-0000-0000-000000000001";
  }, [authUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const companyId = getCompanyId();
    const wsBaseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (window.location.protocol === "https:" ? "wss:" : "ws:") +
        `//${window.location.hostname}:8000/api/v1`;

    const endpoint =
      topic === "all"
        ? `${wsBaseUrl}/ws/${companyId}`
        : `${wsBaseUrl}/ws/${topic}/${companyId}`;

    let socket: WebSocket;
    let pingInterval: NodeJS.Timeout;

    try {
      socket = new WebSocket(endpoint);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        if (event.data === "pong") return;
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
          callbackRef.current?.(parsed);
        } catch {
          // Non-JSON or plaintext frame
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        clearInterval(pingInterval);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      // Ignored
    }

    return () => {
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [topic, getCompanyId]);

  return { isConnected, lastMessage };
}
