"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, AlertTriangle, Minus, Plus } from "lucide-react";
import { CreditProgressBar } from "@/components/shared/CreditProgressBar";
import { RoleBadge } from "@/components/shared/RoleBadge";
import type { TeamMemberWorkforce, AgentAccessSetting } from "@/mocks/workforceData";

interface ManageAccessDrawerProps {
    member: TeamMemberWorkforce | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updated: TeamMemberWorkforce) => void;
    onRevoke: (memberId: string) => void;
}

export function ManageAccessDrawer({
    member,
    isOpen,
    onClose,
    onSave,
    onRevoke,
}: ManageAccessDrawerProps) {
    const [allocation, setAllocation] = useState<number>(400);
    const [campaignCap, setCampaignCap] = useState<number>(150);
    const [agentSettings, setAgentSettings] = useState<AgentAccessSetting[]>([]);
    const [initializedKey, setInitializedKey] = useState<string | null>(null);

    const initKey = isOpen && member ? member.id : null;
    if (initKey && initKey !== initializedKey) {
        setInitializedKey(initKey);
        setAllocation(member!.creditsLimit);
        setCampaignCap(member!.campaignSpendCap);
        setAgentSettings(JSON.parse(JSON.stringify(member!.agentSettings)));
    }
    if (!initKey && initializedKey) {
        setInitializedKey(null);
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !member) return null;

    const toggleAgent = (num: number) => {
        setAgentSettings((prev) =>
            prev.map((a) => (a.agentNumber === num ? { ...a, enabled: !a.enabled } : a))
        );
    };

    const setAgentMode = (num: number, mode: "draft" | "autonomous") => {
        setAgentSettings((prev) =>
            prev.map((a) => (a.agentNumber === num ? { ...a, mode } : a))
        );
    };

    const handleSave = () => {
        const updated: TeamMemberWorkforce = {
            ...member,
            creditsLimit: allocation,
            campaignSpendCap: campaignCap,
            agentSettings,
            assignedAgents: agentSettings.filter((a) => a.enabled).map((a) => a.agentNumber),
        };
        onSave(updated);
        toast.success(`Access and quota saved for ${member.name}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Slide-over Drawer Panel */}
            <aside
                className="relative z-10 w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl border-l border-outline-variant flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
                role="dialog"
                aria-modal="true"
                aria-label={`Manage access for ${member.name}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm flex items-center justify-center tracking-tight">
                            {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base text-on-surface leading-tight">
                                    {member.name}
                                </h3>
                                <RoleBadge role={member.role} />
                            </div>
                            <p className="text-xs text-secondary mt-0.5">{member.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
                        aria-label="Close drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Section 1: Monthly Credit Allocation */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-secondary">
                            Credits Allocation
                        </div>
                        <div className="bg-surface-container-low/60 p-4 rounded-xl border border-outline-variant/40 space-y-4">
                            <CreditProgressBar
                                used={member.creditsUsed}
                                limit={allocation}
                            />

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="block text-xs font-medium text-secondary mb-1.5">
                                        Adjust allocation
                                    </label>
                                    <div className="flex items-center rounded-lg border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setAllocation((v) => Math.max(member.creditsUsed, v - 25))}
                                            className="w-9 h-9 flex items-center justify-center text-secondary hover:bg-surface-container-low hover:text-on-surface transition-colors"
                                            aria-label="Decrease credits by 25"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="text"
                                            readOnly
                                            value={allocation}
                                            className="w-full h-9 text-center text-xs font-bold text-on-surface border-x border-outline-variant/60 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAllocation((v) => v + 25)}
                                            className="w-9 h-9 flex items-center justify-center text-secondary hover:bg-surface-container-low hover:text-on-surface transition-colors"
                                            aria-label="Increase credits by 25"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-secondary mb-1.5">
                                        Cap per campaign
                                    </label>
                                    <div className="relative rounded-lg border border-outline-variant/60 bg-surface-container-lowest flex items-center">
                                        <input
                                            type="number"
                                            value={campaignCap}
                                            onChange={(e) => setCampaignCap(Number(e.target.value))}
                                            className="w-full h-9 pl-3 pr-12 text-xs font-bold text-on-surface focus:outline-none"
                                        />
                                        <span className="absolute right-2.5 text-[11px] text-secondary pointer-events-none font-medium">
                                            cr
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: 12-Agent Access Matrix */}
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-secondary">
                                12-Agent Access Fleet
                            </div>
                            <p className="text-xs text-secondary mt-0.5">
                                Grant individual agent dispatch rights and select execution autonomy.
                            </p>
                        </div>

                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                            {agentSettings.map((agent) => (
                                <div
                                    key={agent.agentNumber}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${agent.enabled
                                            ? "border-outline-variant/60 bg-surface-container-lowest"
                                            : "border-outline-variant/20 bg-surface-container-low/30 opacity-60"
                                        }`}
                                >
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={agent.enabled}
                                            onChange={() => toggleAgent(agent.agentNumber)}
                                            className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                                        />
                                        <span className="font-mono text-xs font-semibold text-secondary bg-surface-container-high px-1.5 py-0.5 rounded">
                                            #{agent.agentNumber}
                                        </span>
                                        <span className="text-xs font-medium text-on-surface truncate">
                                            {agent.agentName}
                                        </span>
                                    </label>

                                    <div
                                        className={`inline-flex items-center p-0.5 rounded-lg text-[10px] font-semibold transition-opacity ${agent.enabled
                                                ? "bg-surface-container-high"
                                                : "opacity-40 pointer-events-none"
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setAgentMode(agent.agentNumber, "draft")}
                                            className={`px-2 py-0.5 rounded transition-all ${agent.mode === "draft"
                                                    ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
                                                    : "text-secondary hover:text-on-surface"
                                                }`}
                                        >
                                            Draft
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAgentMode(agent.agentNumber, "autonomous")}
                                            className={`px-2 py-0.5 rounded transition-all ${agent.mode === "autonomous"
                                                    ? "bg-primary text-on-primary shadow-2xs font-bold"
                                                    : "text-secondary hover:text-on-surface"
                                                }`}
                                        >
                                            Auto
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Danger Zone */}
                    <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                        <div className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Danger zone
                        </div>
                        <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 space-y-2.5">
                            <p className="text-xs text-red-700 leading-relaxed">
                                Halts all running jobs for this user immediately and refunds unspent credits to the company pool.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm(`Revoke all agent access and freeze quota for ${member.name}?`)) {
                                        onRevoke(member.id);
                                        toast.error(`Revoked agent access for ${member.name}`);
                                        onClose();
                                    }
                                }}
                                className="w-full py-2 px-3 rounded-lg bg-surface-container-lowest border border-red-300 text-red-600 hover:bg-red-100 font-semibold text-xs transition-colors shadow-2xs"
                            >
                                Revoke All Access
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-outline-variant/30 bg-surface-container-lowest flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-outline-variant/60 text-secondary text-xs font-semibold hover:bg-surface-container-low transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold shadow-xs transition-colors"
                    >
                        Save changes
                    </button>
                </div>
            </aside>
        </div>
    );
}
