"use client";

import React from "react";
import { Bot, Play, Pause, Zap } from "lucide-react";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import type { AgentCode, AgentStatus } from "../types";

export interface AgentCardProps {
  id: string;
  name: string;
  agentCode: AgentCode;
  description: string;
  status: AgentStatus;
  runsCount: number;
  tokensTotal?: number;
  onTrigger?: (id: string) => void;
  onPause?: (id: string) => void;
}

export function AgentCard({
  id,
  name,
  description,
  status,
  runsCount,
  onTrigger,
  onPause,
}: AgentCardProps) {
  const badgeVariant =
    status === "active" || status === "running"
      ? "active"
      : status === "paused"
      ? "warning"
      : status === "failed"
      ? "danger"
      : "neutral";

  return (
    <div className="p-4 rounded-xl bg-card border border-border flex flex-col justify-between gap-4 shadow-xs hover:border-primary/50 transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">{name}</h3>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{description}</p>
            </div>
          </div>
          <Badge variant={badgeVariant} dot size="sm">
            {status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 border-t border-border">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>{runsCount} executions</span>
          </div>
          <span>Autonomous Worker</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          leftIcon={<Play className="w-3 h-3" />}
          onClick={() => onTrigger?.(id)}
        >
          Execute Run
        </Button>
        {status === "active" && onPause && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPause(id)}
            title="Pause Agent"
          >
            <Pause className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
