import { apiGet, apiPost, apiPatch } from "@/services/api";

export interface MessageDto {
  id: string;
  sender: "contact" | "agent" | "operator";
  senderName: string;
  text: string;
  time: string;
}

export interface ConversationDto {
  id: string;
  senderName: string;
  senderRole: string;
  platform: "linkedin" | "instagram" | "twitter" | "facebook" | "whatsapp";
  platformLabel: string;
  lastMessage: string;
  time: string;
  intent: string;
  score: number;
  escalated: boolean;
  avatarText: string;
  messages: MessageDto[];
}

export async function listConversationsApi(): Promise<ConversationDto[]> {
  try {
    const res = await apiGet<{ success: boolean; conversations?: ConversationDto[] }>("/inbox/conversations");
    return res.conversations || [];
  } catch {
    return [];
  }
}

export async function sendReplyApi(conversationId: string, replyText: string): Promise<any> {
  return await apiPost(`/inbox/conversations/${conversationId}/reply`, { replyText });
}

export async function toggleEscalationApi(conversationId: string, escalated: boolean): Promise<any> {
  return await apiPatch(`/inbox/conversations/${conversationId}/escalate`, { escalated });
}

