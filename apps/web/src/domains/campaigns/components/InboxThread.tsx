import React from "react";
import { formatRelativeTime } from "@/shared/utils/formatDate";
import type { InboxMessage } from "../types";

export interface InboxThreadProps {
  messages: InboxMessage[];
}

export function InboxThread({ messages }: InboxThreadProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border flex flex-col gap-3 max-h-[500px] overflow-y-auto">
      {messages.map((msg) => {
        const isInbound = msg.direction === "inbound";
        return (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[80%] ${
              isInbound ? "self-start" : "self-end items-end"
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{msg.senderName}</span>
              <span>{formatRelativeTime(msg.receivedAt)}</span>
            </div>

            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                isInbound
                  ? "bg-muted text-foreground rounded-tl-xs"
                  : "bg-primary text-primary-foreground rounded-tr-xs"
              }`}
            >
              {msg.content}
            </div>
          </div>
        );
      })}

      {messages.length === 0 && (
        <div className="p-8 text-center text-xs text-muted-foreground">
          No messages in this conversation thread yet.
        </div>
      )}
    </div>
  );
}
