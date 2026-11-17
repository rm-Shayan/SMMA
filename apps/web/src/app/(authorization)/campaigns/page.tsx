"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Mail,
  Send,
  Users,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";
import {
  useCampaigns,
  SequenceBuilder,
  ContactUploader,
  type SequenceStage,
  type Campaign,
} from "@/domains/campaigns";
import { Button } from "@/shared/ui/atoms/Button";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Input } from "@/shared/ui/atoms/Input";
import { MetricBadge } from "@/shared/ui/molecules/MetricBadge";
import toast from "react-hot-toast";

const DEFAULT_STAGES: SequenceStage[] = [
  {
    id: "stage-1",
    stepNumber: 1,
    channel: "email",
    template: "Hi {{firstName}}, noticed you lead growth at {{company}}...",
    delayDays: 0,
  },
  {
    id: "stage-2",
    stepNumber: 2,
    channel: "linkedin",
    template: "Hey {{firstName}}, sent an email earlier. Wanted to connect directly here...",
    delayDays: 3,
  },
  {
    id: "stage-3",
    stepNumber: 3,
    channel: "email",
    template: "Quick follow-up {{firstName}}, sharing a case study on 4x conversion boost...",
    delayDays: 4,
  },
];

export default function CampaignsPage() {
  const [stages, setStages] = useState<SequenceStage[]>(DEFAULT_STAGES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const { campaigns, isLoading, refetch } = useCampaigns();

  const handleLaunchCampaign = () => {
    toast.success("Outreach Campaign Sequence Launched!");
    setIsBuilderOpen(false);
  };

  const activeCampaigns = campaigns.length > 0 ? campaigns : [
    {
      id: "c-1",
      name: "Q4 Enterprise Fintech Outreach",
      status: "active" as const,
      prospectsCount: 450,
      openRate: 58.4,
      replyRate: 14.2,
      stages: DEFAULT_STAGES,
    },
    {
      id: "c-2",
      name: "YC Founders AI Inbound Sequence",
      status: "active" as const,
      prospectsCount: 280,
      openRate: 64.1,
      replyRate: 18.7,
      stages: DEFAULT_STAGES,
    },
    {
      id: "c-3",
      name: "E-Commerce Agency Reactivation",
      status: "paused" as const,
      prospectsCount: 620,
      openRate: 42.0,
      replyRate: 8.5,
      stages: DEFAULT_STAGES,
    },
  ];

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-primary font-semibold">Growth Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Outreach Campaigns & Sequences
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Orchestrate multi-channel outreach campaigns with autonomous agent personalization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            Sync Status
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsBuilderOpen(!isBuilderOpen)}
          >
            {isBuilderOpen ? "Close Builder" : "New Sequence"}
          </Button>
        </div>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBadge
          label="Active Campaigns"
          value="2 Active"
          trend="1 Paused"
          isPositive={true}
          icon={<Megaphone className="w-5 h-5" />}
        />
        <MetricBadge
          label="Total Prospects"
          value="1,350"
          trend="+180 this week"
          isPositive={true}
          icon={<Users className="w-5 h-5" />}
        />
        <MetricBadge
          label="Avg. Open Rate"
          value="58.4%"
          trend="+4.2% vs benchmark"
          isPositive={true}
          icon={<Mail className="w-5 h-5 text-emerald-500" />}
        />
        <MetricBadge
          label="Positive Replies"
          value="14.2%"
          trend="Agent #3 Follow-up active"
          isPositive={true}
          icon={<Sparkles className="w-5 h-5 text-primary" />}
        />
      </div>

      {/* Sequence Builder Drawer/Section if opened */}
      {isBuilderOpen && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-lg space-y-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Design Campaign Sequence</h2>
              <p className="text-xs text-muted-foreground">
                Set multi-channel touchpoints with automated delay cadence
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleLaunchCampaign}>
              Deploy Sequence
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <SequenceBuilder stages={stages} onChange={setStages} />
            </div>
            <div className="lg:col-span-4">
              <ContactUploader />
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-xs space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">Active Campaign Pipelines</h2>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {activeCampaigns.map((camp) => (
            <div
              key={camp.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{camp.name}</span>
                  <Badge variant={camp.status === "active" ? "active" : "neutral"} size="sm" dot>
                    {camp.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{camp.prospectsCount} prospects enrolled</span>
                  <span>•</span>
                  <span>{camp.stages.length} step sequence</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Open Rate</span>
                  <div className="font-bold text-foreground">{camp.openRate ?? 55}%</div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold">Reply Rate</span>
                  <div className="font-bold text-primary">{camp.replyRate ?? 12}%</div>
                </div>
                <Button variant="outline" size="xs">
                  {camp.status === "active" ? (
                    <Pause className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Play className="w-3 h-3 text-primary" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
