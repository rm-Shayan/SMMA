"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/services/api";
import { getActiveTenantId, getSession } from "@/services/session";

const WS_BASE = API_BASE.replace(/^http/i, "ws");
const RECONNECT_BASE_DELAY = 1_000;
const RECONNECT_MAX_DELAY = 30_000;

export interface WebSocketTopicOptions {
  /** Skip connecting (e.g. no session yet, or realtime disabled for the page). */
  enabled?: boolean;
}

export interface WebSocketTopicState {
  isConnected: boolean;
}

/**
 * Subscribes to a tenant WebSocket topic (`/api/v1/ws/{topic}/{company_id}`).
 *
 * Backend contract (`apps/api/app/modules/events/ws.py`):
 *   - the JWT is passed as `?token=`, the token's company must match `company_id`;
 *   - heartbeat frames are the plain string `"ping"` (answered by the server with `"pong"`);
 *   - data frames are `{ company_id, event_type, topic, payload }`.
 *
 * Reconnects automatically with capped exponential backoff.
 */
export function useWebSocketTopic<T = unknown>(
  topic: string,
  onMessage: (data: T) => void,
  options: WebSocketTopicOptions = {},
): WebSocketTopicState {
  const { enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);

  // Keep the latest callback without tearing down the socket on every render.
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const session = getSession();
    const token = session?.token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null);
    const companyId =
      getActiveTenantId() ??
      session?.user?.tenantId ??
      (session?.user as { company_id?: string })?.company_id ??
      (typeof window !== "undefined" ? localStorage.getItem("companyId") : null);

    if (!token || !companyId) return;

    let disposed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let attempt = 0;

    const connect = () => {
      if (disposed) return;
      const url =
        topic === "all"
          ? `${WS_BASE}/ws/${encodeURIComponent(companyId)}?token=${encodeURIComponent(token)}`
          : `${WS_BASE}/ws/${encodeURIComponent(topic)}/${encodeURIComponent(companyId)}?token=${encodeURIComponent(token)}`;

      socket = new WebSocket(url);

      socket.onopen = () => {
        attempt = 0;
        setIsConnected(true);
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, 25_000);
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        // Heartbeat frames are not JSON payloads.
        if (event.data === "ping" || event.data === "pong") return;
        try {
          onMessageRef.current(JSON.parse(event.data) as T);
        } catch (err) {
          console.error(`WS parse error on topic "${topic}"`, err);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (pingInterval) clearInterval(pingInterval);
        if (disposed) return;
        const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** attempt, RECONNECT_MAX_DELAY);
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.close();
      }
      setIsConnected(false);
    };
  }, [topic, enabled]);

  return { isConnected };
}
