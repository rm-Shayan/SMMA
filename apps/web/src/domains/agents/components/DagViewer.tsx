import React from "react";
import { ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { TaskDag } from "../types";

export interface DagViewerProps {
  dag: TaskDag;
}

export function DagViewer({ dag }: DagViewerProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Workflow Execution DAG: {dag.title}
        </h4>
        <span className="text-xs font-semibold text-primary">{dag.progress}% Completed</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {dag.nodes.map((node, idx) => {
          const isDone = node.status === "completed";
          const isCurrent = node.status === "running";
          const isFailed = node.status === "failed";

          return (
            <React.Fragment key={node.id}>
              {idx > 0 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              <div
                className={`p-3 rounded-lg border text-xs min-w-[160px] shrink-0 transition-colors ${
                  isDone
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : isCurrent
                    ? "bg-primary/10 border-primary text-primary animate-pulse"
                    : isFailed
                    ? "bg-destructive/10 border-destructive text-destructive"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : isFailed ? (
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate">{node.title}</span>
                </div>
                <span className="text-[10px] uppercase font-semibold opacity-80">{node.agentCode}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
