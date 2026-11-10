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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface CircuitBreaker {
  state: 'closed' | 'open' | 'half-open';
  lastFailure: number | null;
  failureCount: number;
}

const circuitBreaker: CircuitBreaker = { state: 'closed', lastFailure: null, failureCount: 0 };
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_TIMEOUT = 30000;

async function executeGroqCall(model: string, messages: QwenMessage[], temperature: number, maxTokens: number): Promise<any> {
  if (circuitBreaker.state === 'open') {
    if (Date.now() - (circuitBreaker.lastFailure || 0) > CIRCUIT_TIMEOUT) {
      circuitBreaker.state = 'half-open';
    } else {
      throw new Error('Circuit breaker is open - AI service temporarily unavailable');
    }
  }

  const hasUserMessage = messages.some((m) => m.role === 'user');
  const normalized = hasUserMessage ? messages : [...messages, { role: 'user' as const, content: 'Please proceed and output JSON.' }];
  const payload = { model, messages: normalized, temperature, max_tokens: maxTokens, response_format: { type: 'json_object' } };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    const error = new Error(`Groq HTTP ${response.status}: ${errText}`);
    (error as any).status = response.status;
    throw error;
  }

  const data: any = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('Groq returned empty completion content');

  if (circuitBreaker.state !== 'closed') {
    circuitBreaker.state = 'closed';
    circuitBreaker.failureCount = 0;
    circuitBreaker.lastFailure = null;
  }
  return JSON.parse(rawContent);
}

async function sendGroqWithBackoff(model: string, messages: QwenMessage[], temperature: number, maxTokens: number, maxRetries = 2): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeGroqCall(model, messages, temperature, maxTokens);
    } catch (err: any) {
      const isOverload = err.status === 429 || err.status === 503 || (err.message && (err.message.includes('429') || err.message.includes('503')));
      if (isOverload && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 300);
        await sleep(backoffMs);
        continue;
      }
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailure = Date.now();
      if (circuitBreaker.failureCount >= CIRCUIT_THRESHOLD && circuitBreaker.state !== 'open') {
        circuitBreaker.state = 'open';
      }
      throw err;
    }
  }
}

export async function callQwenJson<T = any>(messages: QwenMessage[], options: QwenCompletionOptions = {}): Promise<T> {
  const primaryModel = options.model || env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const fallbackModel = 'openai/gpt-oss-20b';
  const temperature = options.temperature ?? 0.2;
  const maxTokens = Math.min(options.maxTokens || 800, 800);

  if (!env.GROQ_API_KEY) {
    logger.warn('GROQ_API_KEY is not set. Returning mock fallback JSON.');
    return { mock: true, message: 'Groq API key required' } as T;
  }

  try {
    return (await sendGroqWithBackoff(primaryModel, messages, temperature, maxTokens)) as T;
  } catch (err: any) {
    if (primaryModel !== fallbackModel) {
      logger.warn({ primaryModel, fallback: fallbackModel, err: err.message }, 'Primary model exhausted, switching to fallback');
      return (await sendGroqWithBackoff(fallbackModel, messages, temperature, maxTokens)) as T;
    }
    throw err;
  }
}
