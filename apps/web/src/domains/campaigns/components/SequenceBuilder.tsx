"use client";

import React from "react";
import { Plus, Trash2, Mail, Send, Clock } from "lucide-react";
import { Button } from "@/shared/ui/atoms/Button";
import type { SequenceStage } from "../types";

export interface SequenceBuilderProps {
  stages: SequenceStage[];
  onChange: (stages: SequenceStage[]) => void;
}

export function SequenceBuilder({ stages, onChange }: SequenceBuilderProps) {
  const addStage = () => {
    const newStage: SequenceStage = {
      id: `stage-${Date.now()}`,
      stepNumber: stages.length + 1,
      channel: "email",
      template: "Hi {{firstName}}, noticed your work at {{company}}...",
      delayDays: 2,
    };
    onChange([...stages, newStage]);
  };

  const removeStage = (id: string) => {
    onChange(stages.filter((s) => s.id !== id));
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Multi-Stage Outreach Sequence</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Automated sequence delivered across channels</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={addStage}
        >
          Add Step
        </Button>
      </div>

      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <div
            key={stage.id}
            className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <span className="text-xs font-semibold text-foreground capitalize flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {stage.channel} outreach
                </span>
              </div>
              <button
                onClick={() => removeStage(stage.id)}
                className="p-1 text-muted-foreground hover:text-destructive rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              rows={2}
              value={stage.template}
              onChange={(e) => {
                const next = [...stages];
                next[idx] = { ...stage, template: e.target.value };
                onChange(next);
              }}
              className="w-full p-2 rounded-lg bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary resize-none"
            />

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Wait {stage.delayDays} days before sending this step</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
