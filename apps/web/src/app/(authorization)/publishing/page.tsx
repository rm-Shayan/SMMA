"use client";

import React, { useState } from "react";
import {
  Share2,
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Send,
  MessageSquare,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  useSocialPosts,
  useApprovePost,
  PostCalendar,
  CommentDrawer,
  type SocialPost,
  type SocialComment,
} from "@/domains/social";
import { Button } from "@/shared/ui/atoms/Button";
import { Badge } from "@/shared/ui/atoms/Badge";
import { MetricBadge } from "@/shared/ui/molecules/MetricBadge";
import toast from "react-hot-toast";

const MOCK_COMMENTS: SocialComment[] = [
  {
    id: "cm-1",
    postId: "p-1",
    authorName: "Sarah Jenkins, VP Marketing",
    content: "How does your multi-agent architecture handle token rate limits during peak traffic?",
    sentiment: "positive",
    aiReplyDraft: "Hey Sarah! We implement an RFC sliding-window retry-after backoff in Redis so agents queue gracefully without table locks.",
    status: "unanswered",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "cm-2",
    postId: "p-2",
    authorName: "David Zhao, Founder",
    content: "Would love to see a live demo of the supervisor DAG in action.",
    sentiment: "positive",
    aiReplyDraft: "Thanks David! Sending you an invite to our interactive sandbox environment right now.",
    status: "unanswered",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function PublishingPage() {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [composerContent, setComposerContent] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("linkedin");
  const { posts, isLoading, refetch } = useSocialPosts();
  const { isApproving, approvePost } = useApprovePost();

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerContent.trim()) {
      toast.error("Please enter post content");
      return;
    }
    toast.success("Post drafted & submitted to Autonomous Fleet for QA!");
    setComposerContent("");
  };

  const activePosts: SocialPost[] = posts.length > 0 ? posts : [
    {
      id: "p-1",
      companyId: "comp-1",
      channel: "linkedin",
      content: "Why multi-agent workflows outperform single-prompt chatbots: Specialization beats generalism every time. Here is how our 12 agents cooperate.",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    },
    {
      id: "p-2",
      companyId: "comp-1",
      channel: "twitter",
      content: "Building a Styre-Bot autonomous operating system with zero-downtime database migrations. 3 key rules we learned scaling to 10k prospects.",
      status: "published",
      publishedAt: new Date(Date.now() - 43200000).toISOString(),
    },
    {
      id: "p-3",
      companyId: "comp-1",
      channel: "instagram",
      content: "Behind the scenes of our autonomous creative studio. From prompt to high-converting banner in under 8 seconds.",
      status: "pending_approval",
    },
  ];

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-primary font-semibold">Social Automation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Multi-Channel Publishing & Pacing
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Schedule, dispatch, and pace content across LinkedIn, Twitter, Instagram, and Meta.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Sync
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
            onClick={() => setIsCommentsOpen(true)}
          >
            Inbound Comments ({MOCK_COMMENTS.length})
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBadge
          label="Scheduled Queue"
          value={activePosts.length}
          trend="Pacing 2h intervals"
          isPositive={true}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricBadge
          label="Published This Week"
          value="18 Posts"
          trend="+32% engagement"
          isPositive={true}
          icon={<Share2 className="w-5 h-5 text-emerald-500" />}
        />
        <MetricBadge
          label="Channel Connectors"
          value="4 Connected"
          trend="LinkedIn, X, IG, Meta"
          isPositive={true}
          icon={<Send className="w-5 h-5 text-primary" />}
        />
        <MetricBadge
          label="AI Engager"
          value="Active"
          trend="15m reply window"
          isPositive={true}
          icon={<Sparkles className="w-5 h-5 text-purple-500" />}
        />
      </div>

      {/* Split: Post Composer & Scheduled Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <form
            onSubmit={handleCreatePost}
            className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Autonomous Post Composer</h3>
              <Badge variant="active" size="sm">
                Fleet QA Guard Active
              </Badge>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Target Channel</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="linkedin">LinkedIn Post</option>
                <option value="twitter">X / Twitter</option>
                <option value="instagram">Instagram Carousel / Caption</option>
                <option value="meta">Meta Business Page</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Content Draft</label>
              <textarea
                rows={4}
                value={composerContent}
                onChange={(e) => setComposerContent(e.target.value)}
                placeholder="Draft copy or ask Agent #2 Content Creator to write high-converting copy..."
                className="w-full p-3 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-3 h-3" />}
              >
                Schedule & Pace
              </Button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-7">
          <PostCalendar posts={activePosts} />
        </div>
      </div>

      {/* Inbound Comment Drawer */}
      <CommentDrawer
        isOpen={isCommentsOpen}
        comments={MOCK_COMMENTS}
        onReply={async (commentId, text) => {
          toast.success("AI Comment response dispatched!");
        }}
        onClose={() => setIsCommentsOpen(false)}
      />
    </div>
  );
}
