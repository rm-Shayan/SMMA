"use client";

import React, { useState } from "react";
import { FileUp, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/atoms/Button";
import toast from "react-hot-toast";

export interface DocUploaderProps {
  onSuccess?: () => void;
}

export function DocUploader({ onSuccess }: DocUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Document uploaded & queued for vector chunking!");
      onSuccess?.();
    }, 1200);
  };

  return (
    <div className="p-6 rounded-xl bg-card border-2 border-dashed border-border text-center space-y-3 hover:border-primary/60 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <FileUp className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-foreground">Upload Knowledge & SOP Docs</h4>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, TXT, Markdown files for Autonomous Agent training
        </p>
      </div>

      <Button
        variant="primary"
        size="sm"
        isLoading={isUploading}
        leftIcon={<BookOpen className="w-3.5 h-3.5" />}
        onClick={handleSimulateUpload}
      >
        Ingest Document
      </Button>
    </div>
  );
}
