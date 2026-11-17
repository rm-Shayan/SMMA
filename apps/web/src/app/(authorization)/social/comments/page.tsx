"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Search,
  Send,
  Sliders,
  Bot,
} from "lucide-react";
import toast from "react-hot-toast";
import { useGetCommentsQuery } from "@/redux/api/socialApi";
import { useWebSocketTopic } from "@/shared/hooks/useWebSocketTopic";

interface SocialComment {
  id: string;
  author: string;
  avatar: string;
  platform: "instagram" | "linkedin" | "twitter" | "facebook";
  postTitle: string;
  commentText: string;
  sentiment: "positive" | "question" | "negative" | "neutral";
  suggestedReply: string;
  time: string;
  status: "pending" | "resolved" | "flagged";
}

const MOCK_COMMENTS: SocialComment[] = [
  {
    id: "c-1",
    author: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    platform: "instagram",
    postTitle: "Summer Product Launch Campaign #2026",
    commentText: "Does this integrate natively with HubSpot or do we need Make.com webhooks?",
    sentiment: "question",
    suggestedReply: "Hey Elena! Yes, Styre AI has a native 1-click HubSpot connector. You can sync leads and deal stages in real time without any external webhooks. Let us know if you'd like a quick demo!",
    time: "10 mins ago",
    status: "pending",
  },
  {
    id: "c-2",
    author: "Marcus Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    platform: "linkedin",
    postTitle: "How Autonomous AI Agents are replacing B2B SDR teams",
    commentText: "Brilliant insights on Human-in-the-Loop oversight. Our agency scaled from 40 to 120 client outreach campaigns this quarter using similar architectures.",
    sentiment: "positive",
    suggestedReply: "Appreciate the feedback, Marcus! Scaling client campaigns while preserving human quality control is exactly why we designed the supervisory layer. Cheers to your agency's momentum! 🚀",
    time: "24 mins ago",
    status: "pending",
  },
  {
    id: "c-3",
    author: "Sarah O'Connor",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    platform: "twitter",
    postTitle: "Daily Agency Growth Tip #44",
    commentText: "We had an issue with API limits yesterday on the Twitter connector. Is that resolved?",
    sentiment: "negative",
    suggestedReply: "Hi Sarah, thanks for flagging! X/Twitter refreshed their tier quotas at 06:00 UTC and our dynamic token bucket algorithm has auto-adjusted. All queues are processing normally now.",
    time: "1 hour ago",
    status: "pending",
  },
  {
    id: "c-4",
    author: "David Miller",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    platform: "facebook",
    postTitle: "Client Onboarding SOP Checklist",
    commentText: "Downloaded the PDF guide, super thorough checklist!",
    sentiment: "positive",
    suggestedReply: "Awesome to hear, David! Glad the checklist was helpful for your onboarding workflow. Let us know if there's any other SOP you'd like to see covered next!",
    time: "3 hours ago",
    status: "resolved",
  },
];

export default function SocialCommentsPage() {
  const { data: commentsResponse, refetch } = useGetCommentsQuery();
  const [comments, setComments] = useState<SocialComment[]>(MOCK_COMMENTS);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");

  useWebSocketTopic("outbox", () => {
    void refetch();
  });

  const handleApproveReply = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "resolved" } : c))
    );
    toast.success("AI response approved and dispatched to social channel!");
  };

  const handleSaveCustomReply = (id: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, suggestedReply: editedText, status: "resolved" } : c
      )
    );
    setEditingReplyId(null);
    toast.success("Custom response sent!");
  };

  const filteredComments = comments.filter((c) => {
    const matchesPlatform = platformFilter === "all" || c.platform === platformFilter;
    const matchesSentiment = sentimentFilter === "all" || c.sentiment === sentimentFilter;
    const matchesSearch =
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.commentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.postTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSentiment && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Social Engine</span>
            <span>/</span>
            <span className="text-primary font-semibold">Omnichannel Engagement</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Comment Moderation</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live Sync
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Triage inbound comments, analyze tone, and approve automated AI brand replies across all channels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success("Auto-reply guardrails configured (Score &gt; 90% auto-dispatched)")}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card text-foreground font-medium text-xs hover:bg-muted transition-colors"
          >
            <Sliders className="w-4 h-4 text-muted-foreground" />
            <span>Auto-Pilot Rules</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Comments (30d)</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">1,482</div>
          <span className="text-xs text-emerald-600 font-medium">+24% engagement</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Needs Review</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums text-amber-600">3</div>
          <span className="text-xs text-amber-600 font-medium">Pending manual approval</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">AI Auto-Resolved</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">1,410</div>
          <span className="text-xs text-muted-foreground font-medium">95.1% automation rate</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Avg Response Time</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">1m 12s</div>
          <span className="text-xs text-emerald-600 font-medium">Fastest in industry</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-3 rounded-xl bg-card border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments, users, or posts..."
              className="w-full h-8 pl-9 pr-3 rounded-md bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-8 px-2.5 rounded-md bg-muted/50 border border-border text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter / X</option>
            <option value="facebook">Facebook</option>
          </select>

          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="h-8 px-2.5 rounded-md bg-muted/50 border border-border text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Sentiments</option>
            <option value="question">Questions & Inquiries</option>
            <option value="positive">Positive Feedback</option>
            <option value="negative">Complaints / Issues</option>
          </select>
        </div>
      </div>

      {/* Comments Feed */}
      <div className="space-y-4">
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className={`p-5 rounded-2xl bg-card border transition-all duration-200 shadow-xs space-y-4 ${
              comment.status === "pending"
                ? "border-primary/40 bg-card"
                : "border-border opacity-85"
            }`}
          >
            {/* Header / Author row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comment.avatar}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">{comment.author}</span>
                    <span className="text-[11px] text-muted-foreground">on</span>
                    <span className="capitalize font-medium text-[11px] text-primary">{comment.platform}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-md">
                    Post: &quot;{comment.postTitle}&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    comment.sentiment === "positive"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : comment.sentiment === "question"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-red-500/10 text-red-600"
                  }`}
                >
                  {comment.sentiment}
                </span>
                <span className="text-[11px] text-muted-foreground">{comment.time}</span>
              </div>
            </div>

            {/* Comment Text */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-foreground leading-relaxed">
              &quot;{comment.commentText}&quot;
            </div>

            {/* AI Suggested Response Box */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Bot className="w-4 h-4" />
                  <span>Agent #7 Community Concierge (Suggested Reply)</span>
                </div>
                {comment.status === "resolved" && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sent & Resolved
                  </span>
                )}
              </div>

              {editingReplyId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingReplyId(null)}
                      className="px-3 py-1 rounded text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveCustomReply(comment.id)}
                      className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                    >
                      Send Custom Reply
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-foreground leading-relaxed italic bg-card/60 p-3 rounded-lg border border-border/50">
                  {comment.suggestedReply}
                </p>
              )}

              {/* Action Buttons if still pending */}
              {comment.status === "pending" && editingReplyId !== comment.id && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditingReplyId(comment.id);
                      setEditedText(comment.suggestedReply);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Edit Reply
                  </button>
                  <button
                    onClick={() => handleApproveReply(comment.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve & Dispatch</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
