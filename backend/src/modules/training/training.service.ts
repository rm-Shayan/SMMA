import { pool } from '../../core/database/pool.database';
import { logger } from '../../core/config/logger.config';

export interface CompanyTrainingDoc {
  id?: string;
  tenantId: string;
  title: string;
  category: 'SOP' | 'SALES_SCRIPT' | 'PRODUCT_MANUAL' | 'ONBOARDING';
  documentContent: string;
  keyTakeaways?: string[];
}

export async function saveCompanyTrainingDoc(doc: CompanyTrainingDoc): Promise<any> {
  const sql = `
    INSERT INTO company_training_docs (tenant_id, title, category, document_content, key_takeaways)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, title, category, created_at;
  `;
  try {
    const res = await pool.query(sql, [
      doc.tenantId,
      doc.title,
      doc.category,
      doc.documentContent,
      JSON.stringify(doc.keyTakeaways || []),
    ]);
    logger.info({ tenantId: doc.tenantId, title: doc.title }, '📚 New company training document uploaded');
    return res.rows[0];
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to save training doc');
    throw err;
  }
}

export async function getRelevantTrainingContext(
  tenantId: string,
  query: string,
  scope: 'PUBLIC' | 'INTERNAL' = 'INTERNAL'
): Promise<string> {
  const isPublic = scope === 'PUBLIC';
  const sql = isPublic
    ? `
      SELECT id, title, document_content, key_takeaways 
      FROM company_training_docs 
      WHERE tenant_id = $1 AND category IN ('PRODUCT_MANUAL', 'SALES_SCRIPT')
      ORDER BY created_at DESC 
      LIMIT 3;
    `
    : `
      SELECT id, title, document_content, key_takeaways 
      FROM company_training_docs 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT 3;
    `;
  try {
    const res = await pool.query(sql, [tenantId]);
    if (res.rows.length === 0) {
      return isPublic
        ? 'Rely on official company public pricing and public service offerings.'
        : 'No internal company documents uploaded yet. Relying on core agency SOP standards.';
    }
    return res.rows.map((r: any) => `### DOCUMENT: ${r.title}\n${r.document_content}\n`).join('\n---\n');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to retrieve training context');
    return '';
  }
}

export async function logInternTrainingSession(data: {
  tenantId: string;
  internName: string;
  internEmail?: string;
  question: string;
  response: string;
  score: number;
  feedback: string;
}): Promise<void> {
  const sql = `
    INSERT INTO intern_training_sessions 
    (tenant_id, intern_name, intern_email, question, ai_mentor_response, comprehension_score, mentor_feedback)
    VALUES ($1, $2, $3, $4, $5, $6, $7);
  `;
  try {
    await pool.query(sql, [
      data.tenantId,
      data.internName,
      data.internEmail || null,
      data.question,
      data.response,
      data.score,
      data.feedback,
    ]);
  } catch (err: any) {
    logger.error({ err: err.message }, 'Failed to log training session');
  }
}

