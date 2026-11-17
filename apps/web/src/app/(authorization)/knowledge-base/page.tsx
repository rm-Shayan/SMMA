"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Upload,
  Database,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
  FileText,
} from "lucide-react";
import {
  useKnowledgeDocs,
  useSlidingAnalyze,
  DocUploader,
  ChunkViewer,
  type KnowledgeDoc,
  type DocumentChunk,
} from "@/domains/knowledge";
import { Button } from "@/shared/ui/atoms/Button";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Input } from "@/shared/ui/atoms/Input";
import { MetricBadge } from "@/shared/ui/molecules/MetricBadge";

const MOCK_CHUNKS: DocumentChunk[] = [
  {
    id: "chk-1",
    docId: "doc-1",
    chunkIndex: 0,
    content: "Enterprise ICP: B2B SaaS companies with ARR > $5M and sales teams of 10-50 reps. Primary pain point is outbound reply rate fatigue.",
    tokensCount: 42,
  },
  {
    id: "chk-2",
    docId: "doc-1",
    chunkIndex: 1,
    content: "Tone Guidelines: Professional, concise, consultative. Never use buzzwords like 'synergy' or 'game-changer'. Use data-backed benchmarks.",
    tokensCount: 38,
  },
  {
    id: "chk-3",
    docId: "doc-1",
    chunkIndex: 2,
    content: "Objection Handling: For budget constraints, offer our 30-day proof-of-concept sprint with guaranteed 10 qualified demos.",
    tokensCount: 45,
  },
];

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const { docs, isLoading, refetch } = useKnowledgeDocs();
  const { isAnalyzing, analyzeDoc } = useSlidingAnalyze();

  const activeDocs: KnowledgeDoc[] = docs.length > 0 ? docs : [
    {
      id: "doc-1",
      title: "Agency_Standard_Operating_Procedure_2026.pdf",
      category: "SOP & Guidelines",
      chunksCount: 84,
      status: "indexed",
      uploadedAt: "Yesterday",
    },
    {
      id: "doc-2",
      title: "Client_Fintech_Brand_Guidelines_v3.pdf",
      category: "Brand Styleguide",
      chunksCount: 112,
      status: "indexed",
      uploadedAt: "3 days ago",
    },
    {
      id: "doc-3",
      title: "Cold_Outreach_Objection_Handling_Handbook.docx",
      category: "Sales Enablement",
      chunksCount: 48,
      status: "indexed",
      uploadedAt: "1 week ago",
    },
  ];

  const filteredDocs = activeDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-primary font-semibold">Autonomous RAG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Vector Knowledge Base & SOPs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ingest company documents, brand guidelines, and SOPs for autonomous agent context retrieval.
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
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsUploaderOpen(!isUploaderOpen)}
          >
            {isUploaderOpen ? "Close Ingestion" : "Ingest Document"}
          </Button>
        </div>
      </div>

      {/* RAG Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBadge
          label="Indexed Documents"
          value={activeDocs.length}
          trend="+1 this week"
          isPositive={true}
          icon={<BookOpen className="w-5 h-5" />}
        />
        <MetricBadge
          label="Vector Embeddings"
          value="244 Chunks"
          trend="Pinecone / pgvector"
          isPositive={true}
          icon={<Database className="w-5 h-5 text-emerald-500" />}
        />
        <MetricBadge
          label="RAG Retrieval Latency"
          value="48 ms"
          trend="HNSW cosine indexing"
          isPositive={true}
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />
        <MetricBadge
          label="Sliding Window"
          value="500 tokens"
          trend="Optimal agent context"
          isPositive={true}
          icon={<FileText className="w-5 h-5 text-purple-500" />}
        />
      </div>

      {/* Uploader Section */}
      {isUploaderOpen && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-lg animate-in slide-in-from-top-4 duration-200">
          <DocUploader onSuccess={() => setIsUploaderOpen(false)} />
        </div>
      )}

      {/* Split Pane: Document List + Chunks Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Ingested Corpora</h3>
              <div className="w-56">
                <Input
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                />
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground truncate max-w-xs">
                        {doc.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {doc.category} • {doc.chunksCount} chunks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="active" size="sm">
                      {doc.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="xs"
                      isLoading={isAnalyzing}
                      onClick={() => analyzeDoc(doc.id)}
                    >
                      RAG Analyze
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <ChunkViewer chunks={MOCK_CHUNKS} />
        </div>
      </div>
    </div>
  );
}
