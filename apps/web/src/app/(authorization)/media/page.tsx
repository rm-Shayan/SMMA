"use client";

import React, { useState } from "react";
import {
  FolderPlus,
  Upload,
  Search,
  Grid,
  List as ListIcon,
  Download,
  Trash2,
  Tag,
  Share2,
  FileImage,
  Video,
  FileText,
  CheckCircle2,
  HardDrive,
  X,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useGetMediaAssetsQuery, useGenerateImageMutation } from "@/redux/api/mediaApi";
import { useWebSocketTopic } from "@/hooks/useWebSocketTopic";

interface MediaAsset {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  size: string;
  folder: string;
  dimensions?: string;
  duration?: string;
  uploadedAt: string;
  url: string;
  tags: string[];
}

const MOCK_ASSETS: MediaAsset[] = [
  {
    id: "m-1",
    name: "Summer_Launch_Hero_Banner.png",
    type: "image",
    size: "2.4 MB",
    folder: "Campaign Assets",
    dimensions: "1920x1080",
    uploadedAt: "2 hours ago",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    tags: ["Hero", "Summer", "Instagram"],
  },
  {
    id: "m-2",
    name: "Product_Demo_Reel_v3.mp4",
    type: "video",
    size: "18.6 MB",
    folder: "Social Posts",
    duration: "0:45",
    uploadedAt: "Yesterday",
    url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80",
    tags: ["Reel", "Product", "TikTok"],
  },
  {
    id: "m-3",
    name: "Brand_Styleguide_2026.pdf",
    type: "document",
    size: "4.8 MB",
    folder: "Brand Assets",
    uploadedAt: "3 days ago",
    url: "",
    tags: ["Guidelines", "Typography"],
  },
  {
    id: "m-4",
    name: "Client_Case_Study_Fintech.png",
    type: "image",
    size: "1.2 MB",
    folder: "Campaign Assets",
    dimensions: "1200x630",
    uploadedAt: "4 days ago",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
    tags: ["LinkedIn", "Case Study"],
  },
  {
    id: "m-5",
    name: "Founder_QnA_Livestream_Cut.mp4",
    type: "video",
    size: "34.1 MB",
    folder: "Videos",
    duration: "2:15",
    uploadedAt: "1 week ago",
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
    tags: ["Founder", "Video", "YouTube"],
  },
  {
    id: "m-6",
    name: "Styre_Vector_Logo_Kit.svg",
    type: "image",
    size: "420 KB",
    folder: "Brand Assets",
    dimensions: "Vector",
    uploadedAt: "2 weeks ago",
    url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80",
    tags: ["Logo", "SVG", "Branding"],
  },
];

const FOLDERS = ["All Assets", "Campaign Assets", "Brand Assets", "Social Posts", "Videos", "Documents"];

export default function MediaLibraryPage() {
  const [activeFolder, setActiveFolder] = useState("All Assets");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPlatform, setAiPlatform] = useState("instagram");
  const [assets, setAssets] = useState<MediaAsset[]>(MOCK_ASSETS);

  const { refetch } = useGetMediaAssetsQuery();
  const [generateImage, { isLoading: isGenerating }] = useGenerateImageMutation();

  useWebSocketTopic("notifications", () => {
    refetch();
  });

  const filteredAssets = assets.filter((item) => {
    const matchesFolder = activeFolder === "All Assets" || item.folder === activeFolder;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesType && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleUploadSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Media asset uploaded successfully!");
    setIsUploadOpen(false);
  };

  const handleGenerateAiMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) {
      toast.error("Please enter a creative prompt");
      return;
    }
    try {
      const res = await generateImage({ prompt: aiPrompt, platform: aiPlatform }).unwrap();
      toast.success("Creative asset generated successfully!");
      if (res?.image || res?.path) {
        setAssets((prev) => [
          {
            id: `ai-${Date.now()}`,
            name: `AI_${aiPrompt.slice(0, 15).replace(/\s+/g, "_")}.png`,
            type: "image",
            size: "1.8 MB",
            folder: "Campaign Assets",
            dimensions: "1024x1024",
            uploadedAt: "Just now",
            url: res.image || res.path || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
            tags: ["AI Generated", aiPlatform],
          },
          ...prev,
        ]);
      }
      setIsAiModalOpen(false);
      setAiPrompt("");
    } catch {
      toast.error("Generation failed or mock response completed");
    }
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-primary font-semibold">Creative Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Store, organize, and manage creative assets across your workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-primary/30 bg-primary/10 text-primary font-medium text-xs hover:bg-primary/20 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Media</span>
          </button>
          <button
            onClick={() => toast.success("Folder creation modal")}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card text-foreground font-medium text-xs hover:bg-muted transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-muted-foreground" />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-xs shadow-sm hover:opacity-90 transition-opacity"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Assets</span>
            <div className="text-2xl font-bold text-foreground mt-1">1,248</div>
            <span className="text-xs text-emerald-600 font-medium">+48 this week</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FileImage className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Storage Used</span>
            <div className="text-2xl font-bold text-foreground mt-1">14.2 GB</div>
            <span className="text-xs text-muted-foreground font-medium">of 50 GB allocated</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Video Clips</span>
            <div className="text-2xl font-bold text-foreground mt-1">84</div>
            <span className="text-xs text-primary font-medium">6 active in campaigns</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">AI Generated</span>
            <div className="text-2xl font-bold text-foreground mt-1">312</div>
            <span className="text-xs text-amber-600 font-medium">Via Agent #4 Designer</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Folder Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-border">
        {FOLDERS.map((folder) => (
          <button
            key={folder}
            onClick={() => setActiveFolder(folder)}
            className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors shrink-0 ${
              activeFolder === folder
                ? "bg-card text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {folder}
          </button>
        ))}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-3 rounded-xl bg-card border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files by name or tag..."
              className="w-full h-8 pl-9 pr-3 rounded-md bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-2.5 rounded-md bg-muted/50 border border-border text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All File Types</option>
            <option value="image">Images (.png, .jpg, .svg)</option>
            <option value="video">Videos (.mp4)</option>
            <option value="document">Documents (.pdf)</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted border border-border">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
            title="List View"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 px-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-primary">{selectedIds.length} assets selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Deselect all
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success(`Downloading ${selectedIds.length} files as zip`)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-card border border-border text-foreground hover:bg-muted"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              Download ZIP
            </button>
            <button
              onClick={() => {
                toast.success(`Removed ${selectedIds.length} items`);
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-destructive text-destructive-foreground hover:opacity-90"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const isSelected = selectedIds.includes(asset.id);
            return (
              <div
                key={asset.id}
                className={`group relative rounded-xl bg-card border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                }`}
              >
                {/* Image/Preview Container */}
                <div className="relative aspect-video bg-muted/60 overflow-hidden flex items-center justify-center">
                  {asset.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                      <FileText className="w-10 h-10 text-muted-foreground/60" />
                      <span className="text-[10px] uppercase font-semibold">PDF Document</span>
                    </div>
                  )}

                  {/* Checkbox overlay */}
                  <button
                    onClick={() => toggleSelect(asset.id)}
                    className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-black/40 text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  {/* Badge */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                    {asset.type === "video" ? asset.duration : asset.dimensions || asset.size}
                  </span>
                </div>

                {/* Info Footer */}
                <div className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground truncate" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{asset.size}</span>
                    <span>{asset.uploadedAt}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {asset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredAssets.length && filteredAssets.length > 0}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? filteredAssets.map((a) => a.id) : [])
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Folder</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <tr key={asset.id} className={`hover:bg-muted/40 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(asset.id)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                          {asset.type === "image" ? (
                            <FileImage className="w-4 h-4 text-primary" />
                          ) : asset.type === "video" ? (
                            <Video className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <span className="font-medium text-foreground truncate max-w-xs">{asset.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{asset.folder}</td>
                    <td className="py-3 px-4 uppercase font-semibold text-[10px] text-muted-foreground">
                      {asset.type}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{asset.size}</td>
                    <td className="py-3 px-4 text-muted-foreground">{asset.uploadedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => toast.success(`Downloaded ${asset.name}`)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast.success("Share link copied")}
                          className="p-1 text-muted-foreground hover:text-foreground rounded"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Dialog Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Upload Media Asset</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Direct upload to S3 / Cloudflare R2 storage</p>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSimulate} className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-2 hover:border-primary/60 transition-colors cursor-pointer bg-muted/20">
                <Upload className="w-8 h-8 text-primary mx-auto" />
                <p className="text-sm font-medium text-foreground">Click to browse or drag & drop files here</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, MP4, PDF up to 100MB per file</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Target Folder</label>
                <select className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary">
                  <option>Campaign Assets</option>
                  <option>Brand Assets</option>
                  <option>Social Posts</option>
                  <option>Videos</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                >
                  Start Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* AI Media Generation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">AI Creative Generator</h3>
                  <p className="text-xs text-muted-foreground">Generate high-converting creatives with AI agent</p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Creative Prompt</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Modern SaaS dashboard showcase with glowing neon purple accents..."
                  className="w-full p-2.5 rounded-lg bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Target Platform</label>
                <select
                  value={aiPlatform}
                  onChange={(e) => setAiPlatform(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="instagram">Instagram Post (1:1 Square)</option>
                  <option value="story">Instagram / TikTok Story (9:16)</option>
                  <option value="linkedin">LinkedIn Banner (1.91:1)</option>
                  <option value="twitter">X / Twitter Post (16:9)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Asset</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
