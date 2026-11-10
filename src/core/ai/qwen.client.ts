import { env } from '../config/env.config';
import { logger } from '../config/logger.config';

export interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface QwenCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

async function sendGroqRequest(model: string, messages: QwenMessage[], temperature: number, maxTokens: number): Promise<any> {
  const hasUserMessage = messages.some((m) => m.role === 'user');
  const normalizedMessages = hasUserMessage
    ? messages
    : [...messages, { role: 'user' as const, content: 'Please proceed according to the instructions and output JSON.' }];

  const payload = {
    model,
    messages: normalizedMessages,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq HTTP ${response.status}: ${errText}`);
  }

  const data: any = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('Groq returned empty completion content');
  return JSON.parse(rawContent);
}

/**
 * Direct HTTP client for Qwen / Cloud LLM inference via Groq Cloud API
 * Enforces JSON mode with automatic capacity model fallback.
 */
export async function callQwenJson<T = any>(
  messages: QwenMessage[],
  options: QwenCompletionOptions = {}
): Promise<T> {
  const primaryModel = options.model || env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const temperature = options.temperature ?? 0.2;
  const maxTokens = Math.min(options.maxTokens || 800, 800);

  if (!env.GROQ_API_KEY) {
    logger.warn('GROQ_API_KEY is not set. Returning mock fallback JSON.');
    return { mock: true, message: 'Groq API key required' } as T;
  }

  try {
    return (await sendGroqRequest(primaryModel, messages, temperature, maxTokens)) as T;
  } catch (err: any) {
    if (primaryModel !== 'openai/gpt-oss-20b' && (err.message.includes('503') || err.message.includes('429'))) {
      logger.warn({ primaryModel, fallback: 'openai/gpt-oss-20b' }, 'Primary model unavailable, falling back');
      return (await sendGroqRequest('openai/gpt-oss-20b', messages, temperature, maxTokens)) as T;
    }
    logger.error({ err: err.message }, 'Failed to invoke Groq LLM or parse JSON');
    throw err;
  }
}
