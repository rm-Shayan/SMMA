"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
 FolderOpen,
 Plus,
 Search,
 LayoutGrid,
 List,
 FileText,
 Mail,
 Palette,
 ArrowRight,
 Download,
} from "lucide-react";
import { MOCK_CONTENT_LIBRARY } from "@/mocks/contentLibraryData";
import { useGetContentLibraryQuery } from "@/redux/api/contentApi";
import { useWebSocketTopic } from "@/shared/hooks/useWebSocketTopic";

export default function ContentLibraryPage() {
 const { data: apiContent, refetch } = useGetContentLibraryQuery();
 const [data] = useState(MOCK_CONTENT_LIBRARY);
 const [filterType, setFilterType] = useState<"all" | "post" | "email" | "brand">("all");
 const [searchQuery, setSearchQuery] = useState("");
 const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

 useWebSocketTopic("outbox", () => {
  void refetch();
 });

 const filteredItems = data.filter((item) => {
 const matchesType = filterType === "all" ? true : item.type === filterType;
 const matchesSearch =
 item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
 return matchesType && matchesSearch;
 });

 const handleUseTemplate = (title: string) => {
 toast.success(`Loaded "${title}" into Publishing Composer!`);
 };

 const handleDownloadAsset = (title: string) => {
 toast.success(`Downloaded asset bundle: ${title}`);
 };

 return (
 <div className="w-full space-y-6 pb-12">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h1 className="text-2xl font-bold tracking-tight text-foreground">
 Content Library
 </h1>
 <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider">
 Workspace
 </span>
 </div>
 <p className="text-sm text-muted-foreground">
 Reusable templates and approved assets
 </p>
 </div>

 <div className="flex items-center gap-2.5 shrink-0">
 <button
 onClick={() => toast("Collections panel opened.")}
 className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold shadow-xs transition-colors"
 >
 <FolderOpen className="w-4 h-4 text-muted-foreground" />
 <span>Collections</span>
 </button>
 <button
 onClick={() => toast.success("New template creator opened.")}
 className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold shadow-xs transition-opacity"
 >
 <Plus className="w-4 h-4" />
 <span>New template</span>
 </button>
 </div>
 </div>

 {/* Primary Toolbar Card */}
 <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
 {/* Left: Search & Segmented Filter */}
 <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 min-w-0">
 <div className="relative w-full md:w-72 shrink-0">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search templates or tags..."
 className="w-full h-8 pl-9 pr-3 rounded-lg bg-muted/60 text-xs text-foreground placeholder:text-muted-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary transition-all"
 />
 </div>

 <div className="flex items-center bg-muted p-0.5 rounded-lg overflow-x-auto select-none text-xs font-semibold">
 <button
 onClick={() => setFilterType("all")}
 className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
 filterType === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
 }`}
 >
 <span>All</span>
 <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">
 {data.length}
 </span>
 </button>
 <button
 onClick={() => setFilterType("post")}
 className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
 filterType === "post" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
 }`}
 >
 <span>Post templates</span>
 <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">3</span>
 </button>
 <button
 onClick={() => setFilterType("email")}
 className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
 filterType === "email" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
 }`}
 >
 <span>Email sequences</span>
 <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">2</span>
 </button>
 <button
 onClick={() => setFilterType("brand")}
 className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
 filterType === "brand" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
 }`}
 >
 <span>Brand assets</span>
 <span className="px-1.5 py-0.2 rounded-full bg-muted-foreground/15 text-[10px]">3</span>
 </button>
 </div>
 </div>

 {/* Right: View mode toggle */}
 <div className="flex items-center justify-end gap-2.5">
 <div className="flex items-center bg-muted p-0.5 rounded-lg">
 <button
 onClick={() => setViewMode("grid")}
 className={`p-1.5 rounded transition-colors ${
 viewMode === "grid" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
 }`}
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => setViewMode("list")}
 className={`p-1.5 rounded transition-colors ${
 viewMode === "list" ? "bg-card text-primary shadow-xs" : "text-muted-foreground"
 }`}
 >
 <List className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>
 </div>

 {/* Templates Display: Grid or List */}
 {viewMode === "grid" ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {filteredItems.map((item) => (
 <div
 key={item.id}
 className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all"
 >
 {/* Header Visual Box */}
 <div className="h-28 bg-muted/40 p-3.5 flex flex-col justify-between border-b border-border/60">
 <div className="flex items-center justify-between">
 {item.type === "post" && (
 <span className="p-1 rounded bg-primary/10 text-primary">
 <FileText className="w-4 h-4" />
 </span>
 )}
 {item.type === "email" && (
 <span className="p-1 rounded bg-purple-500/10 text-purple-600">
 <Mail className="w-4 h-4" />
 </span>
 )}
 {item.type === "brand" && (
 <span className="p-1 rounded bg-emerald-500/10 text-emerald-600">
 <Palette className="w-4 h-4" />
 </span>
 )}

 <span className="px-2 py-0.5 rounded-full bg-card border border-border text-[10px] font-semibold text-foreground">
 {item.badge}
 </span>
 </div>

 {/* Middle preview snippet or nodes */}
 {item.type === "post" && item.snippet && (
 <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-relaxed">
 &quot;{item.snippet}&quot;
 </p>
 )}

 {item.type === "email" && item.stepsCount && (
 <div className="flex items-center justify-between px-2">
 {Array.from({ length: item.stepsCount }).map((_, stepIdx) => (
 <div key={stepIdx} className="flex items-center gap-1">
 <div className="w-5 h-5 rounded-full bg-card border border-border shadow-xs flex items-center justify-center text-primary text-[10px] font-bold">
 {stepIdx + 1}
 </div>
 {stepIdx < (item.stepsCount || 0) - 1 && (
 <div className="w-4 h-0.5 bg-border"></div>
 )}
 </div>
 ))}
 </div>
 )}

 {item.type === "brand" && item.id === "lib-4" && (
 <div className="flex items-center justify-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
 SB
 </div>
 <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center font-bold text-xs text-foreground">
 SB
 </div>
 </div>
 )}

 {item.type === "brand" && item.id === "lib-6" && (
 <div className="flex rounded-md overflow-hidden h-7 border border-border/80">
 <div className="flex-1 bg-[#063CBC]"></div>
 <div className="flex-1 bg-[#00298A]"></div>
 <div className="flex-1 bg-[#D3E4FE]"></div>
 <div className="flex-1 bg-[#0B1C30]"></div>
 </div>
 )}

 {item.type === "brand" && item.id === "lib-8" && (
 <div className="flex items-center justify-center text-[11px] font-semibold text-primary bg-primary/10 rounded py-1">
 Quarterly Analytics Infographic
 </div>
 )}
 </div>

 {/* Content Details */}
 <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
 <div>
 <div className="flex items-center justify-between mb-1">
 <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
 {item.type === "post"
 ? "Post Template"
 : item.type === "email"
 ? "Email Sequence"
 : "Brand Asset"}
 </span>
 </div>
 <h2 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
 {item.title}
 </h2>

 <div className="flex flex-wrap items-center gap-1 mt-2">
 {item.tags.map((tag) => (
 <span
 key={tag}
 className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground text-[10px]"
 >
 {tag}
 </span>
 ))}
 </div>
 </div>

 <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
 <span className="text-[10px] text-muted-foreground truncate">
 {item.updatedAt}
 </span>

 {item.type === "brand" ? (
 <button
 onClick={() => handleDownloadAsset(item.title)}
 className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-card border border-border text-primary hover:bg-primary hover:text-primary-foreground text-[11px] font-semibold transition-colors shadow-xs"
 >
 <Download className="w-3 h-3" />
 <span>Download</span>
 </button>
 ) : (
 <button
 onClick={() => handleUseTemplate(item.title)}
 className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-card border border-border text-primary hover:bg-primary hover:text-primary-foreground text-[11px] font-semibold transition-colors shadow-xs"
 >
 <span>Use template</span>
 <ArrowRight className="w-3 h-3" />
 </button>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 /* List View */
 <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
 <div className="divide-y divide-border/60">
 {filteredItems.map((item) => (
 <div
 key={item.id}
 className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
 >
 <div className="flex items-center gap-3.5 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
 {item.type === "post" && <FileText className="w-5 h-5 text-primary" />}
 {item.type === "email" && <Mail className="w-5 h-5 text-purple-600" />}
 {item.type === "brand" && <Palette className="w-5 h-5 text-emerald-600" />}
 </div>

 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="text-sm font-semibold text-foreground truncate">
 {item.title}
 </h3>
 <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold text-foreground">
 {item.badge}
 </span>
 </div>

 <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
 <span className="capitalize">{item.type}</span>
 <span>•</span>
 <span>{item.updatedAt}</span>
 <span>•</span>
 <div className="flex items-center gap-1">
 {item.tags.map((tag) => (
 <span
 key={tag}
 className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground text-[10px]"
 >
 {tag}
 </span>
 ))}
 </div>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
 {item.type === "brand" ? (
 <button
 onClick={() => handleDownloadAsset(item.title)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-colors shadow-xs"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Download Asset</span>
 </button>
 ) : (
 <button
 onClick={() => handleUseTemplate(item.title)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-semibold transition-colors shadow-xs"
 >
 <span>Use Template</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
