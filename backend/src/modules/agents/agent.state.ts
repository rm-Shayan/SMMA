import { Annotation } from '@langchain/langgraph';

export interface AgentContact {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  crmStage?: string;
}

export interface AgentHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AgentStateAnnotation = Annotation.Root({
  tenantId: Annotation<string>(),
  brandVoice: Annotation<string>(),
  channel: Annotation<string>(),
  bookingCalendarUrl: Annotation<string>({
    reducer: (_curr, update) => update,
    default: () => '',
  }),
  contact: Annotation<AgentContact>(),
  incomingMessage: Annotation<string>(),
  conversationHistory: Annotation<AgentHistoryMessage[]>({
    reducer: (curr: AgentHistoryMessage[], update: AgentHistoryMessage[]) => curr.concat(update),
    default: () => [],
  }),
  targetAgent: Annotation<string>({
    reducer: (_curr, update) => update,
    default: () => '',
  }),
  intent: Annotation<string>({
    reducer: (_curr, update) => update,
    default: () => '',
  }),
  retrievedContext: Annotation<string[]>({
    reducer: (_curr: string[], update: string[]) => update,
    default: () => [],
  }),
  generatedResponse: Annotation<string>({
    reducer: (_curr, update) => update,
    default: () => '',
  }),
  leadScore: Annotation<number>({
    reducer: (_curr, update) => update,
    default: () => 50,
  }),
  suggestedPipelineStage: Annotation<string>({
    reducer: (_curr, update) => update,
    default: () => 'NEW_LEAD',
  }),
  crmContactUpdates: Annotation<Record<string, any>>({
    reducer: (_curr, update) => update,
    default: () => ({}),
  }),
  requiresHumanReview: Annotation<boolean>({
    reducer: (_curr, update) => update,
    default: () => false,
  }),
  confidenceScore: Annotation<number>({
    reducer: (_curr, update) => update,
    default: () => 0.8,
  }),
  executionTrace: Annotation<string[]>({
    reducer: (curr: string[], update: string[]) => curr.concat(update),
    default: () => [],
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;

