import { api, ApiError } from "./api";
import type { ConversationDto, EscalateResponse, ReplyResponse } from "@/types/inbox";

export async function getConversationsApi(platform?: string, tenantId?: string): Promise<ConversationDto[]> {
  try {
    const res = await api.get<ConversationDto[]>("/inbox/conversations", {
      params: platform ? { platform } : undefined,
      tenantId,
    });
    return res.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Failed to load conversations.");
  }
}

export async function sendReplyApi(
  conversationId: string,
  replyText: string,
  tenantId?: string
): Promise<ReplyResponse> {
  try {
    const res = await api.post<ReplyResponse>(
      `/inbox/conversations/${conversationId}/reply`,
      { replyText },
      { tenantId }
    );
    return res.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Failed to send message.");
  }
}

export async function toggleEscalationApi(
  conversationId: string,
  isEscalated: boolean,
  tenantId?: string
): Promise<EscalateResponse> {
  try {
    const res = await api.patch<EscalateResponse>(
      `/inbox/conversations/${conversationId}/escalate`,
      { isEscalated },
      { tenantId }
    );
    return res.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Failed to update escalation status.");
  }
}
