export interface Prospect {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: "verified" | "contacted" | "replied" | "bounced" | "unsubscribed";
  leadScore?: number;
}

export interface SequenceStage {
  id: string;
  stepNumber: number;
  channel: "email" | "linkedin" | "sms";
  template: string;
  delayDays: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  prospectsCount: number;
  openRate?: number;
  replyRate?: number;
  stages: SequenceStage[];
}

export interface InboxMessage {
  id: string;
  threadId: string;
  senderName: string;
  senderEmail: string;
  content: string;
  receivedAt: string;
  direction: "inbound" | "outbound";
}
