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

// Circuit breaker state
interface CircuitBreaker {
  state: 'closed' | 'open' | 'half-open';
  lastFailure: number | null;
  failureCount: number;
  resetTimeout: number | null;
}

const circuitBreaker: CircuitBreaker = {
  state: 'closed',
  lastFailure: null,
  failureCount: 0,
  resetTimeout: null,
};

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

async function executeGroqCall(model: string, messages: QwenMessage[], temperature: number, maxTokens: number): Promise<any> {
  // Circuit breaker logic
  if (circuitBreaker.state === 'open') {
    if (Date.now() - (circuitBreaker.lastFailure || 0) > CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreaker.state = 'half-open';
      logger.warn('Circuit breaker: transitioning to half-open state');
    } else {
      throw new Error('Circuit breaker is open - AI service temporarily unavailable');
    }
  }

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
    const error = new Error(`Groq HTTP ${response.status}: ${errText}`);
    (error as any).status = response.status;
    throw error;
  }

  const data: any = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('Groq returned empty completion content');
  
  // Reset circuit breaker on success
  if (circuitBreaker.state !== 'closed') {
    circuitBreaker.state = 'closed';
    circuitBreaker.failureCount = 0;
    circuitBreaker.lastFailure = null;
    circuitBreaker.resetTimeout = null;
    logger.info('Circuit breaker: reset to closed state');
  }
  
  return JSON.parse(rawContent);
}

async function sendGroqWithBackoff(model: string, messages: QwenMessage[], temperature: number, maxTokens: number, maxRetries = 3): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeGroqCall(model, messages, temperature, maxTokens);
    } catch (err: any) {
      const isRateOrOverload = err.status === 429 || err.status === 503 || (err.message && (err.message.includes('429') || err.message.includes('503')));
      if (isRateOrOverload && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 400);
        logger.warn({ model, attempt: attempt + 1, backoffMs }, 'Groq rate-limit/overload encountered. Retrying with backoff');
        await sleep(backoffMs);
        continue;
      }
      
      // Track failures for circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailure = Date.now();
      
      if (circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD && circuitBreaker.state !== 'open') {
        circuitBreaker.state = 'open';
        circuitBreaker.resetTimeout = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
        logger.error('Circuit breaker: opened due to excessive failures');
      }
      
      throw err;
    }
  }
}

/**
 * Direct HTTP client for Qwen / Cloud LLM inference via Groq Cloud API
 * Enforces JSON mode, sliding token clamps, and exponential backoff retry.
 */
export async function callQwenJson<T = any>(
  messages: QwenMessage[],
  options: QwenCompletionOptions = {}
): Promise<T> {
  const primaryModel = options.model || env.GROQ_MODEL || 'qwen/qwen3.8-27b';
  const fallbackModel = 'openai/gpt-oss-20b';
  const temperature = options.temperature ?? 0.2;
  const maxTokens = Math.min(options.maxTokens || 800, 800);

  if (!env.GROQ_API_KEY) {
    logger.warn('GROQ_API_KEY is not set. Returning mock fallback JSON.');
    return { mock: true, message: 'Groq API key required' } as T;
  }

  try {
    return (await sendGroqWithBackoff(primaryModel, messages, temperature, maxTokens, 2)) as T;
  } catch (err: any) {
    if (primaryModel !== fallbackModel) {
      logger.warn({ primaryModel, fallback: fallbackModel, err: err.message }, 'Primary model exhausted, switching to fallback');
      try {
        return (await sendGroqWithBackoff(fallbackModel, messages, temperature, maxTokens, 2)) as T;
      } catch (fallbackErr: any) {
        logger.error({ err: fallbackErr.message }, 'Fallback model also failed');
        throw fallbackErr;
      }
    }
    throw err;
  }
}
