"use client";

import { useState, useEffect, useCallback } from "react";
import { campaignsApi } from "../api/campaigns.api";
import type { Campaign } from "../types";
import { useWebSocket } from "@/shared/hooks/useWebSocket";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await campaignsApi.getCampaigns();
      setCampaigns(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useWebSocket("campaigns", () => {
    fetchCampaigns();
  });

  return { campaigns, isLoading, refetch: fetchCampaigns };
}
