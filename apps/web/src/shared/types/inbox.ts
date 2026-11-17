export interface ConversationDto {
  id: string;
  platform: string;
  sender_id: string;
  incoming_text: string;
  intent_category: string | null;
  agent_response: string | null;
  is_escalated: boolean;
  created_at: string;
}

export interface ConversationsResponse {
  success: boolean;
  count: number;
  conversations: ConversationDto[];
}

export interface ReplyResponse {
  success: boolean;
  message: string;
}

export interface EscalateResponse {
  success: boolean;
  isEscalated: boolean;
}

