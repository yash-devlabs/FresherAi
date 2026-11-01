import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyGeminiError,
  GeminiKeyPool,
  parseGeminiApiKeys,
  runWithGeminiKeyPool,
} from './geminiKeyPool.js';
import { createAIServiceErrorFromOutcome } from './aiService.js';

test('parses a comma-separated pool and keeps the legacy single-key fallback', () => {
  assert.deepEqual(parseGeminiApiKeys({ GEMINI_API_KEYS: ' key-a, key-b,,key-a ' }), ['key-a', 'key-b']);
  assert.deepEqual(parseGeminiApiKeys({ GEMINI_API_KEYS: ' , ', GEMINI_API_KEY: ' legacy ' }), ['legacy']);
  assert.deepEqual(parseGeminiApiKeys({}), []);
});

test('tries the next key after a retryable overload and returns its successful result', async () => {
  const pool = new GeminiKeyPool({ cooldownBaseMs: 60_000 });
  const attemptedKeys = [];
  const outcome = await runWithGeminiKeyPool({
    keys: ['key-a', 'key-b'],
    models: ['model-fast'],
    pool,
    invoke: async (_model, key) => {
      attemptedKeys.push(key);
      if (key === 'key-a') {
        const error = new Error('temporary provider overload');
        error.statusCode = 503;
        throw error;
      }
      return { answer: 'recovered' };
    },
  });

  assert.deepEqual(attemptedKeys, ['key-a', 'key-b']);
  assert.deepEqual(outcome, { ok: true, value: { answer: 'recovered' } });
  assert.deepEqual(pool.getEligibleKeys(['key-a', 'key-b']), ['key-b']);
});

test('supports seven configured keys without a fixed pool-size limit', async () => {
  const keys = Array.from({ length: 7 }, (_, index) => `key-${index + 1}`);
  const attemptedKeys = [];
  const outcome = await runWithGeminiKeyPool({
    keys,
    models: ['model-fast'],
    pool: new GeminiKeyPool(),
    invoke: async (_model, key) => {
      attemptedKeys.push(key);
      if (key !== keys.at(-1)) {
        const error = new Error('temporary overload');
        error.statusCode = 503;
        throw error;
      }
      return 'recovered on seventh key';
    },
  });

  assert.deepEqual(attemptedKeys, keys);
  assert.deepEqual(outcome, { ok: true, value: 'recovered on seventh key' });
});

test('tries each eligible key once and maps exhausted transient failures to the generic overload message', async () => {
  const attemptedKeys = [];
  const outcome = await runWithGeminiKeyPool({
    keys: ['key-a', 'key-b', 'key-c'],
    models: ['model-fast'],
    pool: new GeminiKeyPool(),
    invoke: async (_model, key) => {
      attemptedKeys.push(key);
      const error = new Error('quota exceeded');
      error.statusCode = 429;
      throw error;
    },
  });

  assert.equal(attemptedKeys.length, 3);
  assert.equal(outcome.category, 'transient');
  assert.equal(createAIServiceErrorFromOutcome(outcome).message, 'API is temporarily overloaded. Please try again shortly.');
});

test('waits once for a briefly cooling key when every key is temporarily in cooldown', async () => {
  const pool = new GeminiKeyPool({ cooldownBaseMs: 10, maxCooldownMs: 10 });
  pool.recordTransientFailure('key-a');
  pool.recordTransientFailure('key-b');
  const waited = [];
  const attempted = [];
  const outcome = await runWithGeminiKeyPool({
    keys: ['key-a', 'key-b'],
    models: ['model-fast'],
    pool,
    maxCooldownWaitMs: 100,
    wait: async (durationMs) => {
      waited.push(durationMs);
      await new Promise((resolve) => setTimeout(resolve, durationMs));
    },
    invoke: async (_model, key) => {
      attempted.push(key);
      return 'recovered after cooldown';
    },
  });

  assert.equal(waited.length, 1);
  assert.equal(waited[0] > 0 && waited[0] <= 10, true);
  assert.equal(attempted.length, 1);
  assert.deepEqual(outcome, { ok: true, value: 'recovered after cooldown' });
});

test('does not wait for cooldowns that exceed the recovery wait bound', async () => {
  const pool = new GeminiKeyPool({ cooldownBaseMs: 5_000, maxCooldownMs: 5_000 });
  pool.recordTransientFailure('key-a');
  let waitCalled = false;
  const outcome = await runWithGeminiKeyPool({
    keys: ['key-a'],
    models: ['model-fast'],
    pool,
    wait: async () => { waitCalled = true; },
    maxCooldownWaitMs: 20,
    invoke: async () => 'should not be called',
  });

  assert.equal(waitCalled, false);
  assert.equal(outcome.category, 'transient');
});

test('uses another configured key for permanent authentication failures, then reports configuration when all fail', async () => {
  const attemptedKeys = [];
  const outcome = await runWithGeminiKeyPool({
    keys: ['key-a', 'key-b'],
    models: ['model-fast'],
    pool: new GeminiKeyPool(),
    invoke: async (_model, key) => {
      attemptedKeys.push(key);
      const error = new Error('API key not valid');
      error.statusCode = 400;
      throw error;
    },
  });

  assert.deepEqual(attemptedKeys, ['key-a', 'key-b']);
  assert.equal(outcome.category, 'credentials');
  assert.match(createAIServiceErrorFromOutcome(outcome).message, /GEMINI_API_KEYS/);
  assert.doesNotMatch(createAIServiceErrorFromOutcome(outcome).message, /overloaded/i);
});

test('does not rotate keys for malformed requests and preserves model fallback', async () => {
  let calls = 0;
  const malformed = await runWithGeminiKeyPool({
    keys: ['key-a', 'key-b'],
    models: ['model-fast'],
    pool: new GeminiKeyPool(),
    invoke: async () => {
      calls += 1;
      const error = new Error('invalid request schema');
      error.statusCode = 400;
      throw error;
    },
  });
  assert.equal(malformed.category, 'request');
  assert.equal(calls, 1);

  const attemptedModels = [];
  const modelFallback = await runWithGeminiKeyPool({
    keys: ['key-a'],
    models: ['model-unavailable', 'model-supported'],
    pool: new GeminiKeyPool(),
    invoke: async (model) => {
      attemptedModels.push(model);
      if (model === 'model-unavailable') {
        const error = new Error('model not found');
        error.statusCode = 404;
        throw error;
      }
      return 'success';
    },
  });
  assert.deepEqual(attemptedModels, ['model-unavailable', 'model-supported']);
  assert.deepEqual(modelFallback, { ok: true, value: 'success' });

  const attemptedOutputModels = [];
  const outputFallback = await runWithGeminiKeyPool({
    keys: ['key-a'],
    models: ['model-bad-output', 'model-good-output'],
    pool: new GeminiKeyPool(),
    invoke: async (model) => {
      attemptedOutputModels.push(model);
      if (model === 'model-bad-output') {
        const error = new Error('generated object did not match the schema');
        error.name = 'AI_NoObjectGeneratedError';
        throw error;
      }
      return 'valid output';
    },
  });
  assert.deepEqual(attemptedOutputModels, ['model-bad-output', 'model-good-output']);
  assert.deepEqual(outputFallback, { ok: true, value: 'valid output' });
});

test('classifies quota, authentication, and transient network errors separately', () => {
  assert.equal(classifyGeminiError(Object.assign(new Error('quota exceeded'), { statusCode: 403 })).type, 'transient');
  assert.equal(classifyGeminiError(Object.assign(new Error('invalid API key'), { statusCode: 400 })).type, 'credentials');
  assert.equal(classifyGeminiError(Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNRESET' } })).type, 'transient');
  assert.equal(classifyGeminiError(Object.assign(new Error('invalid request'), { statusCode: 400 })).type, 'request');
});
