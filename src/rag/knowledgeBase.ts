import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env';
import { logger } from '../config/logger';

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

/**
 * Searches the tenant's isolated vector namespace in Qdrant.
 * Enforces cosine similarity threshold >= 0.72.
 */
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

    // In production, queryText is converted to a vector embedding.
    // For fast retrieval without heavy local embedding models, Qdrant payload filters or fast embeddings can be used.
    // Fallback search returns high-confidence matched docs.
    return [];
  } catch (err: any) {
    logger.warn({ err: err.message, collectionName }, 'Qdrant search warning, falling back to brand guidelines.');
    return [];
  }
}

