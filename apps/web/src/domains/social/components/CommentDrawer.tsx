"use client";

import React, { useState } from "react";
import { MessageSquare, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/shared/ui/atoms/Button";
import { formatRelativeTime } from "@/shared/utils/formatDate";
import type { SocialComment } from "../types";

export interface CommentDrawerProps {
  isOpen: boolean;
  comments: SocialComment[];
  onReply: (commentId: string, text: string) => Promise<void>;
  onClose: () => void;
}

export function CommentDrawer({
  isOpen,
  comments,
  onReply,
  onClose,
}: CommentDrawerProps) {
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(commentId, replyText);
      setReplyText("");
      setSelectedCommentId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Inbound Comments</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{c.authorName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(c.createdAt)}
                </span>
              </div>
              <p className="text-foreground leading-relaxed">{c.content}</p>

              {c.aiReplyDraft && (
                <div className="p-2 rounded bg-primary/10 border border-primary/20 text-[11px] text-primary space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-[10px] uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>Agent Suggested Reply</span>
                  </div>
                  <p>{c.aiReplyDraft}</p>
                </div>
              )}

              {selectedCommentId === c.id ? (
                <div className="pt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type reply or accept AI draft..."
                    className="w-full p-2 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setSelectedCommentId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      isLoading={isSubmitting}
                      leftIcon={<Send className="w-3 h-3" />}
                      onClick={() => handleSendReply(c.id)}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-1 flex justify-end">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setSelectedCommentId(c.id);
                      setReplyText(c.aiReplyDraft || "");
                    }}
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
