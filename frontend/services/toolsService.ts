import { apiGet, apiPost } from "@/services/api";

export interface ExternalToolItem {
  id: string;
  tenant_id: string;
  tool_name: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint_url: string;
  parameters_schema: any;
  allowed_roles: string[];
  requires_approval: boolean;
  is_active: boolean;
  allowed_domains?: string[];
  created_at: string;
}

export async function listToolsApi(): Promise<{ success: boolean; count: number; tools: ExternalToolItem[] }> {
  return apiGet("/tools");
}

export async function importOpenApiSpecApi(openApiJson: any): Promise<{ success: boolean; importedCount: number; importedTools: string[] }> {
  return apiPost("/tools/openapi", { openApiJson });
}

export async function registerManualToolApi(tool: {
  toolName: string;
  description: string;
  method: string;
  endpointUrl: string;
  allowedRoles?: string[];
  requiresApproval?: boolean;
}): Promise<{ success: boolean; tool: ExternalToolItem }> {
  return apiPost("/tools/manual", tool);
}

export async function testToolApi(toolName: string, params: Record<string, any>): Promise<{ success: boolean; result: any }> {
  return apiPost(`/tools/${encodeURIComponent(toolName)}/test`, { params });
}

