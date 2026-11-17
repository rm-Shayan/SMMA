"use client";

import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCreateConnectorMutation,
  type ConnectorType,
} from "@/redux/api/connectorsApi";

interface ConnectChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONNECTOR_TYPES: { value: ConnectorType; label: string }[] = [
  { value: "rest", label: "REST API" },
  { value: "sql", label: "SQL database" },
  { value: "file", label: "File source" },
  { value: "webhook", label: "Webhook" },
  { value: "mcp", label: "MCP server" },
];

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  if (error instanceof Error) return error.message;
  return "Could not create the connector. Please try again.";
}

export default function ConnectChannelModal({ isOpen, onClose }: ConnectChannelModalProps) {
  const [createConnector, { isLoading }] = useCreateConnectorMutation();
  const [name, setName] = useState("");
  const [type, setType] = useState<ConnectorType>("rest");
  const [baseUrl, setBaseUrl] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setName("");
    setType("rest");
    setBaseUrl("");
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const config: Record<string, string> =
      type === "rest" && baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {};

    try {
      const result = await createConnector({ name: name.trim(), type, config }).unwrap();
      if (!result.success) {
        toast.error("The server did not create the connector.");
        return;
      }
      toast.success("Connector created.");
      handleClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-channel-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="connect-channel-title" className="text-xl font-bold text-on-surface">
              Add a connector
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Create a workspace integration. Social account OAuth is not configured for this endpoint.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-on-surface">Connector name</span>
          <input
            autoFocus
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. CRM REST API"
            className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-on-surface">Connector type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ConnectorType)}
            className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
          >
            {CONNECTOR_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {type === "rest" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-on-surface">Base URL</span>
            <input
              type="url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.example.com"
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
            />
            <span className="block text-xs text-secondary">
              Optional. Connector credentials can be configured separately.
            </span>
          </label>
        )}

        <div className="flex justify-end gap-2 border-t border-surface-container pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="h-9 rounded-lg border border-outline-variant px-4 text-sm font-medium text-secondary hover:bg-surface-container disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="h-9 rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create connector"}
          </button>
        </div>
      </form>
    </div>
  );
}
