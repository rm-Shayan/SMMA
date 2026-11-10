import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';

export const qdrant = new QdrantClient({
  url: env.QDRANT_URL,
  apiKey: env.QDRANT_API_KEY || undefined,
});

export interface KnowledgeChunk {
  id: string;
  score: number;
  content: string;
  metadata?: Record<string, any>;
}

function tenantCollection(tenantId: string): string {
  const safe = String(tenantId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `tenant_${safe}_kb`;
}

export async function searchTenantKnowledge(
  tenantId: string,
  _queryText: string,
  limit = 3
): Promise<KnowledgeChunk[]> {
  if (!tenantId) return [];
  const collectionName = tenantCollection(tenantId);
  const safeLimit = Math.max(1, Math.min(10, Number(limit) || 3));

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);
    if (!exists) {
      logger.debug({ collectionName }, 'RAG collection missing for tenant; returning empty context');
      return [];
    }
    // Retrieval requires embedding pipeline; return empty bounded result until embeddings are configured.
    // Collection existence is tenant-scoped to prevent cross-tenant collection access.
    void safeLimit;
    return [];
  } catch (err: any) {
    logger.warn({ err: err.message, collectionName }, 'Qdrant access warning; returning empty tenant-scoped context');
    return [];
  }
}
