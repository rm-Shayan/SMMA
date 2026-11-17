import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CopilotMessage, CopilotState } from "@/types/copilot";

const initialGreeting: CopilotMessage = {
  id: "msg_init_1",
  sender: "supervisor",
  agentNumber: 12,
  agentName: "Styre Bot",
  text: "Assalam o Alaikum! I am Styre Bot, your autonomous fleet master assistant. I coordinate the 11 specialized agents across your outbound pipelines, leads CRM, omnichannel inbox, and content publishing. How can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const initialState: CopilotState = {
  isOpen: false,
  isMinimized: false,
  isTyping: false,
  messages: [initialGreeting],
};

export const copilotSlice = createSlice({
  name: "copilot",
  initialState,
  reducers: {
    toggleCopilot: (state) => {
      state.isOpen = !state.isOpen;
      if (state.isOpen) state.isMinimized = false;
    },
    setCopilotOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
      if (action.payload) state.isMinimized = false;
    },
    toggleMinimize: (state) => {
      state.isMinimized = !state.isMinimized;
    },
    addUserMessage: (state, action: PayloadAction<string>) => {
      state.messages.push({
        id: "msg_" + Math.random().toString(36).substring(2, 9),
        sender: "user",
        text: action.payload,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    },
    addSupervisorMessage: (state, action: PayloadAction<Omit<CopilotMessage, "id" | "sender" | "timestamp">>) => {
      state.messages.push({
        id: "msg_" + Math.random().toString(36).substring(2, 9),
        sender: "supervisor",
        agentNumber: action.payload.agentNumber || 12,
        agentName: action.payload.agentName || "Styre Bot",
        text: action.payload.text,
        actionCard: action.payload.actionCard,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    markActionExecuted: (state, action: PayloadAction<{ messageId: string; executedLabel?: string }>) => {
      const msg = state.messages.find((m) => m.id === action.payload.messageId);
      if (msg && msg.actionCard) {
        msg.actionCard.executed = true;
        if (action.payload.executedLabel) {
          msg.actionCard.executedLabel = action.payload.executedLabel;
        }
      }
    },
    clearHistory: (state) => {
      state.messages = [initialGreeting];
    },
  },
});

export const {
  toggleCopilot,
  setCopilotOpen,
  toggleMinimize,
  addUserMessage,
  addSupervisorMessage,
  setTyping,
  markActionExecuted,
  clearHistory,
} = copilotSlice.actions;

export default copilotSlice.reducer;

