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

export async function searchTenantKnowledge(
  tenantId: string,
  queryText: string,
  limit = 3
): Promise<KnowledgeChunk[]> {
  const collectionName = `tenant_${tenantId.replace(/-/g, '_')}_kb`;

  try {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (!exists) {
      logger.debug(`Collection ${collectionName} does not exist yet. Returning empty context.`);
      return [];
    }
    return [];
  } catch (err: any) {
    logger.warn({ err: err.message, collectionName }, 'Qdrant search warning, falling back to brand guidelines.');
    return [];
  }
}

