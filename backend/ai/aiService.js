import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { resolveModels } from './provider.js';
import { geminiKeyPool, parseGeminiApiKeys, runWithGeminiKeyPool } from './geminiKeyPool.js';

const AI_REQUEST_TIMEOUT_MS = 60_000;

export class AIServiceError extends Error {
  constructor(message, { cause, code = 'AI_SERVICE_ERROR' } = {}) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.cause = cause ? { name: cause.name, statusCode: cause.statusCode } : undefined;
  }
}

export function createAIServiceErrorFromOutcome(outcome, timedOut = false) {
  if (outcome.category === 'credentials') {
    return new AIServiceError('The AI service credentials are invalid or unauthorized. Check GEMINI_API_KEYS or GEMINI_API_KEY in the server environment.', { code: 'AI_CREDENTIALS_ERROR' });
  }
  if (outcome.category === 'model') {
    return new AIServiceError('The AI model configuration is unavailable. Please check the server model configuration.', { code: 'AI_MODEL_ERROR' });
  }
  if (outcome.category === 'output') {
    return new AIServiceError('The AI response could not be generated. Please try again.', { code: 'AI_OUTPUT_ERROR' });
  }
  if (outcome.category === 'request') {
    return new AIServiceError('The AI request could not be processed. Please review the request and try again.', { code: 'AI_REQUEST_ERROR' });
  }
  return new AIServiceError('API is temporarily overloaded. Please try again shortly.', { code: timedOut ? 'AI_TIMEOUT' : 'AI_OVERLOADED' });
}

async function withKeyPool(work, task, label) {
  const keys = parseGeminiApiKeys();
  if (!keys.length) {
    throw new AIServiceError('The AI service is not configured. Set GEMINI_API_KEYS or GEMINI_API_KEY in the server environment.', { code: 'AI_CONFIGURATION_ERROR' });
  }

  const startedAt = Date.now();
  const deadline = startedAt + AI_REQUEST_TIMEOUT_MS;
  let attempts = 0;
  const outcome = await runWithGeminiKeyPool({
    keys,
    models: resolveModels(task),
    pool: geminiKeyPool,
    invoke: async (modelId, key) => {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) throw new DOMException('AI request deadline exceeded.', 'TimeoutError');
      attempts += 1;
      const google = createGoogleGenerativeAI({ apiKey: key });
      return work(google(modelId), AbortSignal.timeout(remainingMs));
    },
    onAttemptFailure: ({ keyIndex, model, category, statusCode }) => {
      console.warn(`[fresherai] ${label} provider attempt failed`, {
        keyIndex,
        model,
        category,
        statusCode,
      });
    },
  });

  if (outcome.ok) {
    console.info(`[fresherai] ${label} completed`, { durationMs: Date.now() - startedAt, attempts });
    return outcome.value;
  }

  const statusCode = outcome.statusCode;
  const timedOut = Date.now() >= deadline;
  console.error(`[fresherai] ${label} failed`, {
    durationMs: Date.now() - startedAt,
    attempts,
    statusCode,
    timedOut,
    category: outcome.category,
  });

  throw createAIServiceErrorFromOutcome(outcome, timedOut);
}

export async function generateStructured({ schema, prompt, system, task = 'fast', temperature = 0.4 }) {
  return withKeyPool(async (model, abortSignal) => {
    const { object } = await generateObject({ model, schema, ...(system ? { system } : {}), prompt, temperature, maxRetries: 0, abortSignal });
    return object;
  }, task, 'structured generation');
}

export async function generateResponse({ prompt, system, task = 'fast', temperature = 0.6 }) {
  return withKeyPool(async (model, abortSignal) => {
    const { text } = await generateText({ model, ...(system ? { system } : {}), prompt, temperature, maxRetries: 0, abortSignal });
    return text;
  }, task, 'text generation');
}
