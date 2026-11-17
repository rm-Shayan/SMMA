export type CopilotActionType = 
  | "schedule_post" 
  | "view_lead" 
  | "approve_inbox" 
  | "check_credits" 
  | "navigate";

export interface CopilotActionCard {
  type: CopilotActionType;
  title: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  executed?: boolean;
  executedLabel?: string;
}

export interface CopilotMessage {
  id: string;
  sender: "user" | "supervisor";
  agentNumber?: number; // 1 to 12
  agentName?: string;
  text: string;
  actionCard?: CopilotActionCard;
  timestamp: string;
}

export interface CopilotState {
  isOpen: boolean;
  isMinimized: boolean;
  isTyping: boolean;
  messages: CopilotMessage[];
}

