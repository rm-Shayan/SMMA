"use client";

import { useState, useEffect, useCallback } from "react";
import { socialApi } from "../api/social.api";
import type { SocialPost } from "../types";
import { useWebSocket } from "@/shared/hooks/useWebSocket";

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await socialApi.getPosts();
      setPosts(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useWebSocket("outbox", () => {
    fetchPosts();
  });

  return { posts, isLoading, refetch: fetchPosts };
}
