import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  QDRANT_URL: z.string().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().default(''),
  GROQ_MODEL: z.string().default('qwen/qwen3.8-27b'),
  ENCRYPTION_KEY: z.string().default('12345678901234567890123456789012'), // 32-byte key for AES-256
  JWT_SECRET: z.string().default('smma_platform_super_secret_signing_key_2026'),
  GOOGLE_SPREADSHEET_ID: z.string().default(''),
  GOOGLE_CALENDAR_ID: z.string().default('primary'),
  GOOGLE_SHEETS_WEBHOOK_URL: z.string().default(''),
  CALENDAR_BOOKING_URL: z.string().default(''),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('465'),
  SMTP_MAIL: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default(''),
  ENFORCE_SUBSCRIPTION_QUOTAS: z.string().default('false'),
  COMMERCIAL_SAAS_MODE: z.string().default('false'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
