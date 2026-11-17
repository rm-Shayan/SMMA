"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/ui/atoms/Button";
import toast from "react-hot-toast";

export interface ContactUploaderProps {
  onUploadSuccess?: (count: number) => void;
}

export function ContactUploader({ onUploadSuccess }: ContactUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setFileName("Target_Fintech_Founders_500.csv");
      toast.success("500 contacts parsed & deduplicated successfully!");
      onUploadSuccess?.(500);
    }, 1200);
  };

  return (
    <div className="p-6 rounded-xl bg-card border-2 border-dashed border-border text-center space-y-3 hover:border-primary/60 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <UploadCloud className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-bold text-foreground">Import Contact Lists</h4>
        <p className="text-xs text-muted-foreground">
          Upload CSV, XLSX, or Apollo / LinkedIn lead exports
        </p>
      </div>

      {fileName ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{fileName}</span>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          isLoading={isUploading}
          leftIcon={<FileText className="w-3.5 h-3.5" />}
          onClick={handleSimulateUpload}
        >
          Select File to Upload
        </Button>
      )}
    </div>
  );
}
