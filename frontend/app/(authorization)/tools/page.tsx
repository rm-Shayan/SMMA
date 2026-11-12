"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { listToolsApi, importOpenApiSpecApi, registerManualToolApi, testToolApi, ExternalToolItem } from "@/services/toolsService";

export default function ToolsIntegrationPage() {
  const [tools, setTools] = useState<ExternalToolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"CATALOG" | "OPENAPI" | "MANUAL" | "TEST">("CATALOG");

  // OpenAPI Form State
  const [openApiJsonStr, setOpenApiJsonStr] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Manual Form State
  const [manualToolName, setManualToolName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualMethod, setManualMethod] = useState("POST");
  const [manualEndpoint, setManualEndpoint] = useState("");
  const [manualApproval, setManualApproval] = useState(false);

  // Test Tool State
  const [selectedToolForTest, setSelectedToolForTest] = useState<string>("");
  const [testParamsJson, setTestParamsJson] = useState("{}");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadTools = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listToolsApi();
      setTools(res.tools || []);
      if (res.tools?.length > 0 && !selectedToolForTest) {
        setSelectedToolForTest(res.tools[0].tool_name);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load registered tools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const handleImportOpenApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    try {
      const parsed = JSON.parse(openApiJsonStr);
      const res = await importOpenApiSpecApi(parsed);
      setImportStatus(`Successfully imported ${res.importedCount} tools!`);
      setOpenApiJsonStr("");
      await loadTools();
      setActiveTab("CATALOG");
    } catch (err: any) {
      setImportStatus(`Import Error: ${err.message}`);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerManualToolApi({
        toolName: manualToolName.trim(),
        description: manualDescription.trim(),
        method: manualMethod,
        endpointUrl: manualEndpoint.trim(),
        requiresApproval: manualApproval,
      });
      alert("Custom tool registered successfully!");
      setManualToolName("");
      setManualDescription("");
      setManualEndpoint("");
      await loadTools();
      setActiveTab("CATALOG");
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestLoading(true);
    setTestResult(null);
    try {
      const params = JSON.parse(testParamsJson || "{}");
      const res = await testToolApi(selectedToolForTest, params);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const getMethodBadge = (m: string) => {
    const colors: Record<string, string> = {
      GET: "bg-emerald-50 text-emerald-700 border-emerald-200",
      POST: "bg-indigo-50 text-indigo-700 border-indigo-200",
      PUT: "bg-amber-50 text-amber-700 border-amber-200",
      PATCH: "bg-orange-50 text-orange-700 border-orange-200",
      DELETE: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (
      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${colors[m] || "bg-gray-100 text-gray-700"}`}>
        {m}
      </span>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">extension</span>
              <h1 className="text-xl font-bold text-on-surface">External Systems & OpenAPI Tools</h1>
            </div>
            <p className="text-xs text-secondary mt-1">
              Connect external client systems (CRM, ERP, HCM) via Swagger / OpenAPI specs for autonomous agent tool-calling.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Watchdog Active (15m Ping)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-outline-variant/30 pb-3">
          {[
            { id: "CATALOG", label: "Active Tool Catalog", icon: "inventory_2" },
            { id: "OPENAPI", label: "Import Swagger / OpenAPI", icon: "upload_file" },
            { id: "MANUAL", label: "Add Custom Endpoint", icon: "add_link" },
            { id: "TEST", label: "Interactive Tester", icon: "science" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Catalog */}
        {activeTab === "CATALOG" && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-secondary text-xs flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
                Loading registered tools...
              </div>
            ) : tools.length === 0 ? (
              <div className="bg-surface-container-lowest p-12 text-center rounded-2xl border border-outline-variant/40 space-y-3">
                <span className="material-symbols-outlined text-secondary text-[48px]">integration_instructions</span>
                <h3 className="text-sm font-bold text-on-surface">No External Tools Registered</h3>
                <p className="text-xs text-secondary max-w-sm mx-auto">
                  Import a third-party Swagger/OpenAPI JSON specification or add a custom webhook endpoint to grant AI agents action capabilities.
                </p>
                <button
                  onClick={() => setActiveTab("OPENAPI")}
                  className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90"
                >
                  Import OpenAPI Specification
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((t) => (
                  <div
                    key={t.id}
                    className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 hover:border-outline-variant transition-all shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
                      <div className="flex items-center gap-2">
                        {getMethodBadge(t.method)}
                        <span className="font-mono text-xs font-bold text-on-surface">{t.tool_name}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-secondary">
                        {t.requires_approval ? "⚠️ Requires Approval" : "⚡ Autonomous Execution"}
                      </span>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed line-clamp-2">{t.description}</p>

                    <div className="bg-surface-container-low p-2.5 rounded-xl font-mono text-[11px] text-secondary truncate">
                      {t.endpoint_url}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-secondary pt-1">
                      <span>Roles: <strong className="text-on-surface">{t.allowed_roles?.join(", ") || "SUPERADMIN"}</strong></span>
                      <button
                        onClick={() => { setSelectedToolForTest(t.tool_name); setActiveTab("TEST"); }}
                        className="text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">play_circle</span> Test Tool
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: OpenAPI Importer */}
        {activeTab === "OPENAPI" && (
          <form onSubmit={handleImportOpenApi} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Import OpenAPI 3.0 / Swagger Specification</h3>
              <p className="text-xs text-secondary mt-1">
                Paste the raw JSON specification of your client's CRM, ERP, or internal REST API. The engine will automatically generate tool interfaces.
              </p>
            </div>
            {importStatus && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-on-surface font-mono">
                {importStatus}
              </div>
            )}
            <textarea
              value={openApiJsonStr}
              onChange={(e) => setOpenApiJsonStr(e.target.value)}
              placeholder='{ "openapi": "3.0.0", "info": { "title": "Client ERP API" }, "paths": { ... } }'
              className="w-full h-64 p-3 text-xs font-mono rounded-xl border border-outline-variant focus:border-primary outline-none"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 cursor-pointer"
              >
                Parse & Register All Endpoints
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Manual Endpoint Registration */}
        {activeTab === "MANUAL" && (
          <form onSubmit={handleCreateManual} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4 max-w-xl">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Add Custom Webhook / API Tool</h3>
              <p className="text-xs text-secondary mt-1">Register an arbitrary HTTP webhook endpoint with SSRF and DNS protection.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Tool Identifier (Name)</label>
              <input
                type="text"
                value={manualToolName}
                onChange={(e) => setManualToolName(e.target.value)}
                placeholder="e.g. ERP_CREATE_ORDER"
                className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Description (Explains to AI when to call)</label>
              <input
                type="text"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Call this tool when a client requests a product shipment"
                className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Method</label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-on-surface mb-1">HTTPS Endpoint URL</label>
                <input
                  type="url"
                  value={manualEndpoint}
                  onChange={(e) => setManualEndpoint(e.target.value)}
                  placeholder="https://api.client.com/orders"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="reqApprove"
                checked={manualApproval}
                onChange={(e) => setManualApproval(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="reqApprove" className="text-xs text-on-surface">Require human manager approval before AI can execute</label>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 cursor-pointer"
              >
                Register Custom Tool
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Interactive Tool Tester */}
        {activeTab === "TEST" && (
          <form onSubmit={handleRunTest} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Interactive Tool Execution Simulator</h3>
              <p className="text-xs text-secondary mt-1">Test outbound API execution with payload parameters and check SSRF egress response.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Select Tool</label>
                <select
                  value={selectedToolForTest}
                  onChange={(e) => setSelectedToolForTest(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface"
                >
                  {tools.map((t) => (
                    <option key={t.id} value={t.tool_name}>{t.tool_name} ({t.method})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Execution Payload (JSON)</label>
              <textarea
                value={testParamsJson}
                onChange={(e) => setTestParamsJson(e.target.value)}
                placeholder='{ "userId": "123", "action": "ping" }'
                className="w-full h-32 p-3 text-xs font-mono rounded-xl border border-outline-variant focus:border-primary outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={testLoading || !selectedToolForTest}
              className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">{testLoading ? "sync" : "play_arrow"}</span>
              {testLoading ? "Executing Outbound Request..." : "Run Test Call"}
            </button>
            {testResult && (
              <div className="p-4 rounded-xl bg-surface-container-low font-mono text-xs overflow-x-auto">
                <div className="text-[10px] text-secondary font-sans font-semibold uppercase mb-1">Execution Response:</div>
                <pre className="text-on-surface whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </form>
        )}
      </div>
    </AppShell>
  );
}

