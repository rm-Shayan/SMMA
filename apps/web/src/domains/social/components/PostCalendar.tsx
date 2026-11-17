import React from "react";
import { Calendar as CalendarIcon, Clock, Share2 } from "lucide-react";
import { Badge } from "@/shared/ui/atoms/Badge";
import { formatDate } from "@/shared/utils/formatDate";
import type { SocialPost } from "../types";

export interface PostCalendarProps {
  posts: SocialPost[];
  onSelectPost?: (post: SocialPost) => void;
}

export function PostCalendar({ posts, onSelectPost }: PostCalendarProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Scheduled Content Pipeline</h3>
        </div>
        <span className="text-xs text-muted-foreground">{posts.length} posts scheduled</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => onSelectPost?.(post)}
            className="p-3.5 rounded-lg border border-border bg-muted/20 hover:border-primary/50 transition-all cursor-pointer space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary capitalize flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                {post.channel}
              </span>
              <Badge
                variant={
                  post.status === "published"
                    ? "active"
                    : post.status === "scheduled"
                    ? "warning"
                    : "neutral"
                }
                size="sm"
              >
                {post.status}
              </Badge>
            </div>

            <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
              {post.content}
            </p>

            {post.scheduledAt && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <Clock className="w-3 h-3" />
                <span>{formatDate(post.scheduledAt, "full")}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
