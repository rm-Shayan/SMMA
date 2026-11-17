"use client";

import React, { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateContactMutation } from "@/redux/api/leadsApi";

interface AddLeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLeadDialog({ isOpen, onClose }: AddLeadDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");

  const [createContact, { isLoading }] = useCreateContactMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    try {
      await createContact({
        name: name.trim(),
        email: email.trim(),
        company_name: company.trim() || undefined,
        topic: topic.trim() || undefined,
      }).unwrap();

      toast.success(`Lead "${name}" successfully added to live database!`);
      setName("");
      setEmail("");
      setCompany("");
      setTopic("");
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e?.data?.message || "Failed to create lead. Please check your connection.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="fixed inset-0 -z-10" onClick={onClose} />
      <div className="relative w-full max-w-[500px] bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Add New Lead</h2>
              <p className="text-xs text-secondary">Capture a new prospect into your live PostgreSQL CRM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1.5">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@enterprise.io"
                className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Apex Corp"
                className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1.5">Topic / Segment</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="SaaS / Enterprise"
                className="w-full h-10 px-3.5 rounded-lg bg-surface border border-outline-variant text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? "Saving..." : "Create Lead"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
