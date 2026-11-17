import React from "react";
import { Database, Hash } from "lucide-react";
import type { DocumentChunk } from "../types";

export interface ChunkViewerProps {
  chunks: DocumentChunk[];
}

export function ChunkViewer({ chunks }: ChunkViewerProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Vector Embedding Chunks
          </h4>
        </div>
        <span className="text-xs text-muted-foreground">{chunks.length} chunks indexed</span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
        {chunks.map((chunk) => (
          <div
            key={chunk.id}
            className="p-3 rounded-lg border border-border bg-muted/20 text-xs space-y-1.5"
          >
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Hash className="w-3 h-3 text-primary" />
                Chunk #{chunk.chunkIndex + 1}
              </span>
              <span>{chunk.tokensCount} tokens</span>
            </div>
            <p className="text-foreground leading-relaxed font-mono text-[11px] bg-card p-2 rounded border border-border/50">
              {chunk.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
