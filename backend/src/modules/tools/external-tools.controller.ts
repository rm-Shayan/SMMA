import { Request, Response } from 'express';
import {
  importOpenApiSpec,
  saveExternalTool,
  listTenantExternalTools,
  executeExternalTool,
} from './external-tools.service';
import { logger } from '../../core/config/logger.config';

export async function handleImportOpenApi(req: Request, res: Response): Promise<void> {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (req.body?.tenantId || req.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  const { specUrl, authHeaderValue } = req.body;

  if (!tenantId) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  if (!specUrl) {
    res.status(400).json({ error: 'specUrl is required (e.g. https://api.client.com/swagger.json)' });
    return;
  }

  try {
    const importedCount = await importOpenApiSpec(tenantId, specUrl, authHeaderValue);
    res.status(200).json({
      success: true,
      message: `Imported ${importedCount} tools from OpenAPI spec.`,
      importedCount,
    });
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to import OpenAPI spec');
    res.status(500).json({ error: 'Import Failed', message: err.message });
  }
}

export async function handleRegisterManualTool(req: Request, res: Response): Promise<void> {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (req.body?.tenantId || req.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  const { toolName, description, method, endpointUrl, authHeaderName, authHeaderValue, parametersSchema } = req.body;

  if (!tenantId) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  if (!toolName || !endpointUrl) {
    res.status(400).json({ error: 'toolName and endpointUrl are required' });
    return;
  }

  try {
    await saveExternalTool(tenantId, {
      toolName,
      description: description || `Call ${endpointUrl}`,
      method: (method || 'POST').toUpperCase() as any,
      endpointUrl,
      authHeaderName,
      authHeaderValue,
      parametersSchema,
      sourceType: 'MANUAL',
    });
    res.status(201).json({ success: true, message: `Tool "${toolName}" registered.` });
  } catch (err: any) {
    logger.error({ err: err.message, tenantId }, 'Failed to register manual tool');
    res.status(500).json({ error: 'Registration Failed', message: err.message });
  }
}

export async function handleListTools(req: Request, res: Response): Promise<void> {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (typeof req.query.tenantId === 'string' ? req.query.tenantId : req.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  if (!tenantId) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  try {
    const tools = await listTenantExternalTools(tenantId);
    res.status(200).json({ success: true, count: tools.length, tools });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function handleExecuteToolTest(req: Request, res: Response): Promise<void> {
  const tenantId = req.user?.role === 'SUPERADMIN' ? (req.body?.tenantId || req.tenantId || req.user.tenantId) : (req.user?.tenantId || req.tenantId);
  const toolName = String(req.params.toolName);
  const params = req.body?.params && typeof req.body.params === 'object' ? req.body.params : {};

  if (!tenantId) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  try {
    const result = await executeExternalTool(tenantId, toolName, params, { userId: req.user?.userId, role: req.user?.role });
    res.status(200).json({ success: true, toolName, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Execution Failed', message: err.message });
  }
}
