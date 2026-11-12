"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import StateSwitcher, { ViewState } from "@/components/StateSwitcher";
import { useAppSelector } from "@/redux/hooks";

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [viewState, setViewState] = useState<ViewState>("live");
  const firstName =
    user?.name?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "there";

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Interactive View State Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-lg gap-space-md border-b border-outline-variant/30 mb-space-lg">
          <div>
            <div className="flex items-center gap-space-sm mb-1 flex-wrap">
              <h1 className="font-headline-xl text-headline-xl text-on-surface">
                Welcome back, {firstName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-caption font-caption bg-surface-container-high text-primary-container font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                Cluster Sync v4.2
              </span>
            </div>
            <p className="font-body-md text-body-md text-secondary">
              Multi-tenant autonomous agency operations and active tenant deployment overview.
            </p>
          </div>

          <StateSwitcher
            current={viewState}
            onChange={(s) => setViewState(s)}
            label="View Mode:"
          />
        </div>

        {/* ========================================== */}
        {/* 1. LIVE DASHBOARD STATE                     */}
        {/* ========================================== */}
        {viewState === "live" && (
          <div className="flex flex-col gap-space-xl">
            {/* 5 KPI Summary Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
              {/* Card 1: Total Leads */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary">Total Leads</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">group_add</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    1,248
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-label-sm text-label-sm bg-surface-container text-primary font-semibold">
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                      +42 this week
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Hot Leads */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary">Hot Leads</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    86
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-label-sm bg-amber-100 text-amber-800 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      Score 80+ qualified
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Total Conversations */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary">Total Conversations</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    3,412
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-label-sm bg-surface-container-high text-tertiary-container font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                      AI Agent active
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Scheduled Posts */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary">Scheduled Posts</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[18px]">event_upcoming</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    94
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-label-sm bg-surface-container text-on-secondary-container font-semibold">
                      Ready in queue
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: Published Posts */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-secondary">Published Posts</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                    1,520
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-label-sm text-label-sm bg-surface-container-high text-tertiary-container font-semibold">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      Distributed sync
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Breakdown Section */}
            <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col border border-outline-variant/40">
              {/* Section Header */}
              <div className="p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-outline-variant/30">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                    Platform Breakdown
                    <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded">
                      4 Channels Connected
                    </span>
                  </h2>
                  <p className="font-body-md text-body-md text-secondary mt-0.5">
                    Active posts and lead capture distribution across connected social channels
                  </p>
                </div>
              </div>

              {/* Segmented Visual Bar & Metrics */}
              <div className="px-space-lg pt-space-md pb-space-lg bg-surface-container-lowest">
                {/* Horizontal Segmented Distribution Bar */}
                <div className="w-full flex flex-col gap-2">
                  <div className="flex justify-between items-center text-caption font-caption text-secondary">
                    <span>Overall Network Distribution (1,520 Posts / 1,248 Leads captured)</span>
                    <span className="font-medium text-on-surface">100% Allocated</span>
                  </div>
                  <div className="w-full h-3.5 bg-surface-container-high rounded-full overflow-hidden flex shadow-inner">
                    <div
                      className="h-full bg-primary transition-all duration-500 hover:brightness-110"
                      style={{ width: "34%" }}
                      title="LinkedIn: 34%"
                    ></div>
                    <div
                      className="h-full bg-secondary transition-all duration-500 hover:brightness-110"
                      style={{ width: "28%" }}
                      title="Instagram: 28%"
                    ></div>
                    <div
                      className="h-full bg-inverse-surface transition-all duration-500 hover:brightness-110"
                      style={{ width: "22%" }}
                      title="X (Twitter): 22%"
                    ></div>
                    <div
                      className="h-full bg-surface-tint transition-all duration-500 hover:brightness-110"
                      style={{ width: "16%" }}
                      title="Facebook: 16%"
                    ></div>
                  </div>
                </div>

                {/* Legend Tiles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md mt-space-lg">
                  {/* LinkedIn */}
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-primary shrink-0"></span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">LinkedIn</span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold text-primary">34%</span>
                    </div>
                    <div className="flex items-baseline justify-between text-body-sm font-body-sm text-secondary">
                      <span>480 posts</span>
                      <span className="font-medium text-on-surface">524 leads</span>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-secondary shrink-0"></span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">Instagram</span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold text-secondary">28%</span>
                    </div>
                    <div className="flex items-baseline justify-between text-body-sm font-body-sm text-secondary">
                      <span>420 posts</span>
                      <span className="font-medium text-on-surface">380 leads</span>
                    </div>
                  </div>

                  {/* X (Twitter) */}
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-inverse-surface shrink-0"></span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">X (Twitter)</span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold text-inverse-surface">22%</span>
                    </div>
                    <div className="flex items-baseline justify-between text-body-sm font-body-sm text-secondary">
                      <span>360 posts</span>
                      <span className="font-medium text-on-surface">210 leads</span>
                    </div>
                  </div>

                  {/* Facebook */}
                  <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col justify-between border border-outline-variant/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-surface-tint shrink-0"></span>
                        <span className="font-headline-sm text-headline-sm text-on-surface">Facebook</span>
                      </div>
                      <span className="font-label-sm text-label-sm font-semibold text-primary-container">16%</span>
                    </div>
                    <div className="flex items-baseline justify-between text-body-sm font-body-sm text-secondary">
                      <span>260 posts</span>
                      <span className="font-medium text-on-surface">134 leads</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Channel Breakdown Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider border-t border-outline-variant/30">
                      <th className="py-3 px-space-lg font-semibold">Channel / Platform</th>
                      <th className="py-3 px-space-lg font-semibold">Connected Accounts</th>
                      <th className="py-3 px-space-lg font-semibold">Scheduled Posts</th>
                      <th className="py-3 px-space-lg font-semibold">Published Posts</th>
                      <th className="py-3 px-space-lg font-semibold">Captured Leads</th>
                      <th className="py-3 px-space-lg font-semibold">AI Routing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/40 text-body-md font-body-md text-on-surface">
                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">share</span>
                          </div>
                          <div>
                            <div className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                              LinkedIn Enterprise
                            </div>
                            <div className="font-caption text-caption text-secondary">
                              Organization Page + 3 Executive Reps
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-lg font-medium">4 profiles</td>
                      <td className="py-3.5 px-space-lg font-medium text-on-secondary-container">34 posts</td>
                      <td className="py-3.5 px-space-lg font-semibold">480</td>
                      <td className="py-3.5 px-space-lg font-semibold text-primary">524</td>
                      <td className="py-3.5 px-space-lg">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-label-sm font-label-sm bg-surface-container-high text-tertiary-container font-semibold">
                          <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                          Active Agent
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                          </div>
                          <div>
                            <div className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                              Instagram Business
                            </div>
                            <div className="font-caption text-caption text-secondary">
                              @apex_growth_official (Verified)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-lg font-medium">2 handles</td>
                      <td className="py-3.5 px-space-lg font-medium text-on-secondary-container">28 posts</td>
                      <td className="py-3.5 px-space-lg font-semibold">420</td>
                      <td className="py-3.5 px-space-lg font-semibold text-primary">380</td>
                      <td className="py-3.5 px-space-lg">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-label-sm font-label-sm bg-surface-container-high text-tertiary-container font-semibold">
                          <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                          Active Agent
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-inverse-surface">
                            <span className="material-symbols-outlined text-[18px]">tag</span>
                          </div>
                          <div>
                            <div className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                              X (Twitter) Feed
                            </div>
                            <div className="font-caption text-caption text-secondary">
                              @ApexHQNews + Thread Dispatcher
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-lg font-medium">3 accounts</td>
                      <td className="py-3.5 px-space-lg font-medium text-on-secondary-container">18 posts</td>
                      <td className="py-3.5 px-space-lg font-semibold">360</td>
                      <td className="py-3.5 px-space-lg font-semibold text-primary">210</td>
                      <td className="py-3.5 px-space-lg">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-label-sm font-label-sm bg-surface-container-high text-tertiary-container font-semibold">
                          <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                          Active Agent
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3.5 px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                            <span className="material-symbols-outlined text-[18px]">public</span>
                          </div>
                          <div>
                            <div className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                              Facebook Pages
                            </div>
                            <div className="font-caption text-caption text-secondary">
                              Apex Global Community & Ads Flow
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-space-lg font-medium">2 pages</td>
                      <td className="py-3.5 px-space-lg font-medium text-on-secondary-container">14 posts</td>
                      <td className="py-3.5 px-space-lg font-semibold">260</td>
                      <td className="py-3.5 px-space-lg font-semibold text-primary">134</td>
                      <td className="py-3.5 px-space-lg">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-label-sm font-label-sm bg-surface-container-high text-secondary font-semibold">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          Idle (Polled)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 2. LOADING SKELETON STATE                  */}
        {/* ========================================== */}
        {viewState === "loading" && (
          <div className="flex flex-col gap-space-xl">
            <div className="flex flex-col gap-2 animate-pulse">
              <div className="h-6 w-64 bg-surface-container-highest rounded-lg"></div>
              <div className="h-4 w-96 bg-surface-container rounded-lg"></div>
            </div>
            {/* 5 KPI Cards Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs flex flex-col justify-between h-32 border border-outline-variant/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-surface-container rounded"></div>
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-7 w-24 bg-surface-container-highest rounded"></div>
                    <div className="h-3 w-16 bg-surface-container rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Breakdown Skeleton */}
            <div className="bg-surface-container-lowest rounded-xl shadow-xs p-space-lg animate-pulse flex flex-col gap-space-lg border border-outline-variant/30">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-48 bg-surface-container-highest rounded"></div>
                  <div className="h-3 w-72 bg-surface-container rounded"></div>
                </div>
                <div className="h-8 w-24 bg-surface-container rounded"></div>
              </div>
              <div className="h-4 w-full bg-surface-container-high rounded-full"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
                <div className="h-16 bg-surface-container-low rounded-xl"></div>
                <div className="h-16 bg-surface-container-low rounded-xl"></div>
                <div className="h-16 bg-surface-container-low rounded-xl"></div>
                <div className="h-16 bg-surface-container-low rounded-xl"></div>
              </div>
              <div className="flex flex-col gap-3 pt-space-md">
                <div className="h-10 bg-surface-container-low rounded-lg"></div>
                <div className="h-10 bg-surface-container-low rounded-lg"></div>
                <div className="h-10 bg-surface-container-low rounded-lg"></div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 3. NO ACTIVITY EMPTY STATE                 */}
        {/* ========================================== */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-20 h-20 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary-container mb-space-lg shadow-inner">
              <span className="material-symbols-outlined text-[40px]">hub</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-space-xs font-semibold">
              No Tenant Activity Recorded Yet
            </h2>
            <p className="font-body-lg text-body-lg text-secondary mb-space-xl max-w-lg">
              Connect social channels or activate an AI agent in the Agent Workspace to begin capturing leads and scheduling content for this tenant.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-space-md">
              <a
                href="/channels"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">add_link</span>
                Connect First Channel
              </a>
              <a
                href="/agents"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                Deploy AI Agent
              </a>
            </div>
            <div className="mt-10 pt-6 border-t border-surface-container-high/60 w-full flex items-center justify-center gap-6 text-caption font-caption text-secondary flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">lock</span> SOC2 Encrypted Vault
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">speed</span> Sub-second Auto Ingestion
              </span>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* 4. API ERROR STATE WITH RETRY ACTION       */}
        {viewState === "error" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-8 md:p-10 max-w-xl mx-auto my-12 overflow-hidden border-t-4 border-error border-x border-b border-outline-variant/40">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">error</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                    Unable to retrieve tenant metrics
                  </h2>
                  <span className="font-label-sm text-label-sm font-semibold uppercase px-2 py-0.5 rounded bg-error-container text-on-error-container">
                    Critical
                  </span>
                </div>
                <p className="mt-2 font-body-md text-body-md text-secondary">
                  Failed to load telemetry data from AI Agent cluster (HTTP 503 Service Unavailable).
                </p>
                <div className="mt-4 p-3 bg-surface-container-low rounded-lg font-caption text-caption text-on-surface-variant font-mono break-all border border-outline-variant/30">
                  cluster_id: apex-east-prd-09<br />
                  timestamp: 2026-11-11T10:42:19.412Z<br />
                  reason: Connection timed out after 3000ms while negotiating tenant state handshake.
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md hover:bg-on-error-container transition-colors shadow-xs"
                    onClick={() => setViewState("live")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Retry Connection
                  </button>
                  <button
                    type="button"
                    onClick={() => alert("Cluster endpoint: https://stitch.googleapis.com (Operational)")}
                    className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-on-surface transition-colors"
                  >
                    <span>Check System Status</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}