"use client";

import { useState, useEffect, useCallback } from "react";
import { campaignsApi } from "../api/campaigns.api";
import type { InboxMessage } from "../types";
import { useWebSocket } from "@/shared/hooks/useWebSocket";

export function useInboxMessages(threadId?: string) {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await campaignsApi.getInboxMessages(threadId);
      setMessages(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useWebSocket("inbox", () => {
    fetchMessages();
  });

  return { messages, isLoading, refetch: fetchMessages };
}
