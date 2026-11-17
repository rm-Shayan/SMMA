"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { X, Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { useUploadDocumentMutation } from "@/redux/api/knowledgeApi";

interface UploadDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadDocumentDialog({ isOpen, onClose }: UploadDocumentDialogProps) {
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("upload");
  const [content, setContent] = useState("");
  const [createSop, setCreateSop] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDocument, { isLoading }] = useUploadDocumentMutation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const reset = () => {
    setTitle("");
    setSource("upload");
    setContent("");
    setCreateSop(false);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File exceeds the 50MB limit");
      return;
    }
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    const isPlainText = /\.(txt|csv|md|json)$/i.test(file.name) || file.type.startsWith("text/");
    if (isPlainText) {
      setContent(await file.text());
    } else {
      toast("PDF/DOCX text extraction runs server-side — paste the text below to index it.", {
        icon: "ℹ️",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 20) {
      toast.error("Document must contain at least 20 characters");
      return;
    }
    try {
      const result = await uploadDocument({
        title: title.trim(),
        text: content.trim(),
        source: source.trim() || "upload",
        createSop,
      }).unwrap();
      toast.success(`Indexed ${result.chunkCount} chunks into the knowledge base`);
      reset();
      onClose();
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? "Failed to index document");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="fixed inset-0 -z-10" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        <div className="p-5 sm:p-6 border-b border-outline-variant flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-secondary">
                Data Ingestion Pipeline
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-[11px] text-emerald-600 font-medium">RAG Indexing</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface">Upload document</h2>
            <p className="text-xs text-secondary">
              Content is chunked and embedded so agents can retrieve and cite it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label htmlFor="doc-title" className="text-xs font-semibold text-on-surface-variant">
              Document title
            </label>
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pricing Policy"
              minLength={2}
              required
              className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-[#063cbc]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="doc-source" className="text-xs font-semibold text-on-surface-variant">
              Source
            </label>
            <input
              id="doc-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="upload"
              className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-[#063cbc]"
            />
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl p-4 text-center bg-surface-container-lowest/70 border-2 border-dashed border-outline-variant hover:border-[#063cbc] transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-[#063cbc] mb-2">
              <Upload className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-on-surface">
              {fileName ?? "Choose a TXT, CSV, MD or JSON file"}
            </p>
            <p className="text-[11px] text-outline mt-0.5">
              Plain-text files are read automatically; paste other formats below.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.md,.json,.pdf,.docx"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="doc-content" className="text-xs font-semibold text-on-surface-variant">
                Content
              </label>
              <span className="text-[11px] text-outline">{content.length} chars</span>
            </div>
            <textarea
              id="doc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              minLength={20}
              required
              placeholder="Paste the document text that agents should learn from..."
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-[#063cbc] resize-y"
            />
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant cursor-pointer text-xs text-on-surface-variant">
            <input
              type="checkbox"
              checked={createSop}
              onChange={(e) => setCreateSop(e.target.checked)}
              className="mt-0.5 accent-[#063cbc]"
            />
            <span className="flex items-center gap-1.5 leading-snug">
              <Sparkles className="w-3.5 h-3.5 text-[#063cbc]" />
              Also generate a training SOP from this document
            </span>
          </label>

          <div className="pt-3 border-t border-outline-variant flex items-center justify-between">
            <span className="text-[11px] text-outline flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Indexed to vector store
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="h-9 px-4 rounded-lg bg-[#063cbc] hover:bg-[#00298a] text-white text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isLoading ? "Indexing..." : "Upload & index"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
