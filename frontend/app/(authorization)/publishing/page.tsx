"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";

type PlatformType = "linkedin" | "instagram" | "twitter" | "facebook";

export default function PublishingPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("linkedin");
  const [content, setContent] = useState(
    "Excited to announce our AI-driven social orchestration framework is officially live across all partner agency channels! By automating inbound qualification and high-intent routing, teams achieve 4x faster response times."
  );
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60");
  const [optimalTime, setOptimalTime] = useState(true);
  const [exactDateTime, setExactDateTime] = useState("2026-11-12T09:00");
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<{
    postId: string;
    formattedContent: string;
    platform: string;
    scheduledFor: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const platforms = [
    {
      id: "linkedin" as PlatformType,
      name: "LinkedIn Enterprise",
      handle: "@Apex Growth Partners",
      accounts: "4 Profiles",
      icon: "share",
      limit: 3000,
    },
    {
      id: "instagram" as PlatformType,
      name: "Instagram Business",
      handle: "@apex_growth_official",
      accounts: "2 Handles",
      icon: "photo_camera",
      limit: 2200,
    },
    {
      id: "twitter" as PlatformType,
      name: "X (Twitter)",
      handle: "@ApexHQNews",
      accounts: "3 Accounts",
      icon: "tag",
      limit: 280,
    },
    {
      id: "facebook" as PlatformType,
      name: "Facebook Pages",
      handle: "Apex Global Community",
      accounts: "2 Pages",
      icon: "public",
      limit: 5000,
    },
  ];

  const currentPlatformObj = platforms.find((p) => p.id === selectedPlatform)!;
  const isOverLimit = content.length > currentPlatformObj.limit;
  const isTooShort = content.trim().length < 5;

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTooShort) {
      setErrorMsg("Draft content must be at least 5 characters long.");
      return;
    }
    if (isOverLimit) {
      setErrorMsg(
        `Character limit exceeded for ${currentPlatformObj.name} (Max ${currentPlatformObj.limit} characters).`
      );
      return;
    }
    setErrorMsg(null);
    setConfirmModalOpen(true);
  };

  const handleConfirmPublish = () => {
    setConfirmModalOpen(false);
    setSubmitting(true);
    setErrorMsg(null);

    // Simulate Agent Publisher formatting and job insertion
    setTimeout(() => {
      setSubmitting(false);
      setScheduledResult({
        postId: "post_job_" + Math.random().toString(36).substring(2, 9),
        platform: currentPlatformObj.name,
        formattedContent: content.trim() + "\n\n#GrowthEngineering #Automation #AIagency",
        scheduledFor: optimalTime
          ? "Optimal Agent Slot (Tomorrow, 09:30 AM EST)"
          : new Date(exactDateTime).toLocaleString(),
      });
    }, 1000);
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Top Header & State Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Compose &amp; Schedule
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                Publisher Agent Ready
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Format, optimize, and queue single-channel posts through the autonomous publishing adapter.
            </p>
          </div>

          {/* State Switcher Tabs */}
          <div className="flex items-center flex-wrap gap-1 bg-surface-container-low p-1 rounded-xl shadow-xs border border-outline-variant/30 text-xs">
            <button
              onClick={() => {
                setViewState("live");
                setScheduledResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "live" && !scheduledResult
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">edit_note</span>
              Live Composer
            </button>
            <button
              onClick={() => setViewState("loading")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "loading"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
              Submitting State
            </button>
            <button
              onClick={() => setViewState("empty")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "empty"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">inbox</span>
              Empty State
            </button>
            <button
              onClick={() => setViewState("error")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "error"
                  ? "bg-error text-white shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">error_outline</span>
              API Error
            </button>
          </div>
        </div>

        {/* ============================================== */}
        {/* VIEW 1: LIVE COMPOSER                          */}
        {/* ============================================== */}
        {viewState === "live" && (
          <div className="w-full">
            {/* Success Scheduled Result Banner */}
            {scheduledResult && (
              <div className="mb-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-on-surface shadow-xs animate-in zoom-in-95 duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">task_alt</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base font-bold text-emerald-950">
                        Post Successfully Scheduled with Publisher Agent!
                      </h3>
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-white border border-emerald-300 font-semibold text-emerald-800">
                        ID: {scheduledResult.postId}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1">
                      Target Channel: <strong>{scheduledResult.platform}</strong> • Queue Execution:{" "}
                      <strong>{scheduledResult.scheduledFor}</strong>
                    </p>

                    <div className="mt-3 p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs">
                      <span className="font-semibold text-secondary uppercase text-[10px] block mb-1">
                        Agent Formatted Post Payload:
                      </span>
                      <p className="text-on-surface whitespace-pre-line font-medium leading-relaxed">
                        {scheduledResult.formattedContent}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => setScheduledResult(null)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                      >
                        Compose Another Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="mb-5 p-4 rounded-xl bg-error-container/40 border border-error/30 text-xs text-error flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Main Form Split Grid */}
            <form onSubmit={handlePreSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                {/* 1. Platform Single Selector (as per API: UI accepts one platform per request) */}
                <div className="bg-surface-container-lowest rounded-xl shadow-xs p-space-lg border border-outline-variant/40">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/30">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-primary">hub</span>
                        Target Social Platform
                      </h3>
                      <p className="text-xs text-secondary mt-0.5">
                        Select one destination channel supported by backend publisher adapter
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-surface-container text-secondary">
                      Single Platform API
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    {platforms.map((p) => {
                      const isSelected = selectedPlatform === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlatform(p.id)}
                          className={`p-space-md rounded-xl cursor-pointer transition-all border ${
                            isSelected
                              ? "bg-primary-fixed/30 border-primary-container shadow-xs"
                              : "bg-surface-container-low/40 border-outline-variant/40 hover:bg-surface-container-low"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isSelected ? "bg-primary" : "bg-secondary"
                                }`}
                              ></span>
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono text-secondary">
                              Max {p.limit}
                            </span>
                          </div>
                          <p className="text-xs text-secondary truncate">{p.handle}</p>
                          <span className="text-[10px] text-secondary mt-1 block">
                            {p.accounts}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Draft Content Composer */}
                <div className="bg-surface-container-lowest rounded-xl shadow-xs p-space-lg border border-outline-variant/40 flex flex-col">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/30">
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        edit_document
                      </span>
                      Draft Post Content
                    </h3>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        isOverLimit
                          ? "bg-error-container text-error font-bold"
                          : "bg-surface-container text-secondary"
                      }`}
                    >
                      {content.length} / {currentPlatformObj.limit} chars
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write post content (minimum 5 characters)..."
                    className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-sm placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all border border-outline-variant/40 resize-y"
                  />

                  {/* Optional Image URL */}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-secondary uppercase mb-1">
                      Optional Attached Media URL
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        image
                      </span>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://domain.com/photo.jpg"
                        className="w-full pl-10 pr-3 py-2 text-xs font-mono bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-secondary rounded-lg border border-outline-variant/40 focus:border-primary-container outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Optimal Time Scheduling Toggle & Datetime */}
                <div className="bg-surface-container-lowest rounded-xl shadow-xs p-space-lg border border-outline-variant/40">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-primary">
                          schedule
                        </span>
                        Scheduling Configuration
                      </h4>
                      <p className="text-xs text-secondary mt-0.5">
                        The backend API queues this post for background dispatch.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/60 cursor-pointer border border-outline-variant/30">
                      <div>
                        <div className="text-xs font-semibold text-on-surface">
                          Optimal-Time Autonomous Scheduling
                        </div>
                        <div className="text-[11px] text-secondary">
                          Publisher agent determines optimal engagement window based on audience activity.
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={optimalTime}
                        onChange={(e) => setOptimalTime(e.target.checked)}
                        className="h-4 w-4 rounded accent-primary-container cursor-pointer"
                      />
                    </label>

                    {!optimalTime && (
                      <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 animate-in fade-in duration-150">
                        <label className="block text-xs font-semibold text-secondary mb-1">
                          Exact Execution Datetime
                        </label>
                        <input
                          type="datetime-local"
                          value={exactDateTime}
                          onChange={(e) => setExactDateTime(e.target.value)}
                          className="w-full p-2 bg-surface-container-lowest border border-outline-variant/50 rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:border-primary-container"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Action */}
                <div>
                  <button
                    type="submit"
                    disabled={submitting || isOverLimit || isTooShort}
                    className="w-full py-3 px-4 bg-primary-container hover:bg-primary-container/90 active:bg-primary text-white font-semibold text-sm rounded-xl shadow-md shadow-primary-container/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">campaign</span>
                    <span>Submit to Publisher Agent</span>
                  </button>
                  <p className="text-[11px] text-center text-secondary mt-2">
                    Confirmation prompt will appear before job queue insertion.
                  </p>
                </div>
              </div>

              {/* Right Column: Live Channel Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                <div className="bg-surface-container-lowest rounded-xl shadow-xs p-space-lg border border-outline-variant/40 sticky top-20">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant/30">
                    <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                      Channel Live Preview
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-container text-on-surface font-medium">
                      {currentPlatformObj.name}
                    </span>
                  </div>

                  {/* Rendered Card Simulation */}
                  <div className="rounded-xl border border-outline-variant/40 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-xs">
                        AG
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Apex Growth Partners</div>
                        <div className="text-[10px] text-slate-500">
                          Posted via SMMA Autonomous Core • Just now
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                      {content || "Your post draft text will render here in real-time."}
                    </p>

                    {imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt="Post Media Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-slate-500 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">thumb_up</span> Like
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">comment</span> Comment
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">share</span> Repost
                      </span>
                    </div>
                  </div>

                  {/* Information Callout */}
                  <div className="mt-4 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs text-secondary leading-relaxed">
                    <span className="font-semibold text-on-surface block mb-1">
                      Background Scheduling Note:
                    </span>
                    The backend queues post jobs into the Redis/BullMQ background worker. The worker
                    dispatches to social APIs when the scheduled execution timestamp is reached.
                  </div>
                </div>
              </div>
            </form>

            {/* Confirmation Dialog Modal */}
            {confirmModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                  onClick={() => setConfirmModalOpen(false)}
                />
                <div className="relative z-50 w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 border border-outline-variant/40 animate-in zoom-in-95 duration-150">
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-white flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[24px]">campaign</span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">Confirm Post Scheduling</h3>
                  <p className="text-xs text-secondary mt-1 leading-relaxed">
                    You are about to submit this post for formatting and scheduled background execution.
                  </p>

                  <div className="my-4 p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-secondary">Destination Platform:</span>
                      <strong className="text-on-surface">{currentPlatformObj.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Schedule Mode:</span>
                      <strong className="text-on-surface">
                        {optimalTime ? "Optimal Agent Timing" : "Exact Timestamp"}
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setConfirmModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPublish}
                      className="px-5 py-2 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
                    >
                      Confirm &amp; Queue Post
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 2: SUBMITTING / LOADING STATE             */}
        {/* ============================================== */}
        {viewState === "loading" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 max-w-xl mx-auto my-12 border border-outline-variant/40 text-center animate-pulse">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-white flex items-center justify-center mx-auto mb-4 animate-spin">
              <span className="material-symbols-outlined text-[28px]">sync</span>
            </div>
            <h2 className="text-lg font-bold text-on-surface">Agent Formatting &amp; Scheduling</h2>
            <p className="text-xs text-secondary mt-2 max-w-sm mx-auto">
              Publisher agent is refining content hashtags, checking channel compliance rules, and allocating the background BullMQ dispatch slot...
            </p>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 3: EMPTY STATE                            */}
        {/* ============================================== */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
              <span className="material-symbols-outlined text-[32px]">campaign</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              Ready to compose
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
              Draft a single-channel update to leverage the publisher agent node for automated format compliance and optimal timing.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-5 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
            >
              Open Composer
            </button>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 4: API ERROR                              */}
        {viewState === "error" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-8 max-w-lg mx-auto my-12 border-t-4 border-error border-x border-b border-outline-variant/40 text-center">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Publishing Dispatch Failed (500)
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-2 mb-space-md">
              Unable to reach the publisher adapter or social channel credential expired.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-on-error-container transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Composer
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

