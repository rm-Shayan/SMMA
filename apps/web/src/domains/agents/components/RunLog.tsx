import React from "react";
import { Terminal } from "lucide-react";

export interface RunLogProps {
  logs: string[];
  streamingText?: string;
  isStreaming?: boolean;
}

export function RunLog({ logs, streamingText, isStreaming }: RunLogProps) {
  return (
    <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-xs text-neutral-300 space-y-2 shadow-inner">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span>Execution Output Log</span>
        </div>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            STREAMING
          </span>
        )}
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin text-[11px]">
        {logs.map((log, idx) => (
          <div key={idx} className="leading-relaxed">
            <span className="text-neutral-500 mr-2">[{idx + 1}]</span>
            {log}
          </div>
        ))}
        {streamingText && (
          <div className="text-primary font-medium leading-relaxed whitespace-pre-wrap">
            {streamingText}
          </div>
        )}
        {logs.length === 0 && !streamingText && (
          <div className="text-neutral-600 italic">No output logged yet. Trigger an execution to view logs.</div>
        )}
      </div>
    </div>
  );
}
