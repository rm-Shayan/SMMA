import { httpClient } from "@/shared/http/client";
import type { Campaign, Prospect, InboxMessage } from "../types";

export const campaignsApi = {
  getCampaigns: async (): Promise<Campaign[]> => {
    const res = await httpClient.get("/campaigns");
    return res.data;
  },

  createCampaign: async (payload: Partial<Campaign>): Promise<Campaign> => {
    const res = await httpClient.post("/campaigns", payload);
    return res.data;
  },

  getProspects: async (campaignId?: string): Promise<Prospect[]> => {
    const res = await httpClient.get("/leads/contacts", {
      params: campaignId ? { campaign_id: campaignId } : undefined,
    });
    return res.data;
  },

  getInboxMessages: async (threadId?: string): Promise<InboxMessage[]> => {
    const res = await httpClient.get("/inbox/messages", {
      params: threadId ? { thread_id: threadId } : undefined,
    });
    return res.data;
  },
};
