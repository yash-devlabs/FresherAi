const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const DEFAULT_COOLDOWN_MS = 2_000;
const MAX_COOLDOWN_MS = 60_000;
const INVALID_KEY_COOLDOWN_MS = 15 * 60_000;

function errorDetails(error) {
  let current = error;
  let statusCode;
  let isRetryable = false;
  const messages = [];
  const codes = [];
  const names = [];

  for (let depth = 0; current && depth < 5; depth += 1) {
    statusCode ??= Number(current.statusCode ?? current.status) || undefined;
    isRetryable ||= current.isRetryable === true;
    if (typeof current.message === 'string') messages.push(current.message);
    if (typeof current.responseBody === 'string') messages.push(current.responseBody);
    if (typeof current.code === 'string') codes.push(current.code);
    if (typeof current.name === 'string') names.push(current.name);
    current = current.cause;
  }

  return { statusCode, isRetryable, message: messages.join(' ').toLowerCase(), codes, names };
}

export function parseGeminiApiKeys(env = process.env) {
  const configuredKeys = typeof env.GEMINI_API_KEYS === 'string'
    ? env.GEMINI_API_KEYS.split(',').map((key) => key.trim()).filter(Boolean)
    : [];
  const uniqueKeys = [...new Set(configuredKeys)];
  if (uniqueKeys.length) return uniqueKeys;

  const legacyKey = typeof env.GEMINI_API_KEY === 'string' ? env.GEMINI_API_KEY.trim() : '';
  return legacyKey ? [legacyKey] : [];
}

export function classifyGeminiError(error) {
  const { statusCode, isRetryable, message, codes, names } = errorDetails(error);
  const codeSet = new Set(codes);
  const authMessage = /invalid api key|api key not valid|api_key_invalid|unauthenticated|permission denied|permission_denied|not authorized|unauthorized/.test(message);
  const quotaMessage = /quota|rate.?limit|resource exhausted|too many requests/.test(message);

  if (authMessage || statusCode === 401 || (statusCode === 403 && !quotaMessage)) {
    return { type: 'credentials', statusCode };
  }
  if ((statusCode === 403 && quotaMessage) || statusCode === 429 || (statusCode !== undefined && RETRYABLE_STATUS_CODES.has(statusCode))) {
    return { type: 'transient', statusCode };
  }
  if (isRetryable || ['TimeoutError', 'AbortError'].includes(error?.name) || ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT'].some((code) => codeSet.has(code))) {
    return { type: 'transient', statusCode };
  }
  if (names.some((name) => ['NoObjectGeneratedError', 'TypeValidationError', 'JSONParseError'].some((type) => name.endsWith(type)))) {
    return { type: 'output', statusCode };
  }
  if (names.some((name) => name.endsWith('NoSuchModelError')) || ((statusCode === 400 || statusCode === 404) && /model.*(not found|unsupported)|not found.*model/.test(message))) {
    return { type: 'model', statusCode };
  }
  return { type: 'request', statusCode };
}

export class GeminiKeyPool {
  #states = new Map();
  #cursor = 0;

  constructor({ cooldownBaseMs = DEFAULT_COOLDOWN_MS, maxCooldownMs = MAX_COOLDOWN_MS, invalidKeyCooldownMs = INVALID_KEY_COOLDOWN_MS } = {}) {
    this.cooldownBaseMs = cooldownBaseMs;
    this.maxCooldownMs = maxCooldownMs;
    this.invalidKeyCooldownMs = invalidKeyCooldownMs;
  }

  getEligibleKeys(keys, now = Date.now()) {
    const uniqueKeys = [...new Set(keys)];
    if (!uniqueKeys.length) return [];

    const start = this.#cursor % uniqueKeys.length;
    const ordered = [...uniqueKeys.slice(start), ...uniqueKeys.slice(0, start)];
    const eligible = ordered.filter((key) => (this.#states.get(key)?.cooldownUntil ?? 0) <= now);
    if (eligible.length) this.#cursor = (uniqueKeys.indexOf(eligible[0]) + 1) % uniqueKeys.length;
    return eligible;
  }

  getNextEligibleDelay(keys, now = Date.now()) {
    const nextCooldown = [...new Set(keys)]
      .map((key) => this.#states.get(key)?.cooldownUntil ?? 0)
      .filter((cooldownUntil) => cooldownUntil > now)
      .sort((a, b) => a - b)[0];
    return nextCooldown ? nextCooldown - now : 0;
  }

  recordTransientFailure(key, now = Date.now()) {
    const state = this.#states.get(key) || { failures: 0, cooldownUntil: 0 };
    state.failures += 1;
    state.cooldownUntil = now + Math.min(this.cooldownBaseMs * (2 ** (state.failures - 1)), this.maxCooldownMs);
    this.#states.set(key, state);
  }

  recordCredentialFailure(key, now = Date.now()) {
    this.#states.set(key, { failures: 0, cooldownUntil: now + this.invalidKeyCooldownMs });
  }

  recordSuccess(key) {
    this.#states.delete(key);
  }

  areAllKeysCoolingDown(keys, now = Date.now()) {
    return keys.length > 0 && keys.every((key) => (this.#states.get(key)?.cooldownUntil ?? 0) > now);
  }

  areAllKeysCredentialBlocked(keys, now = Date.now()) {
    return keys.length > 0 && keys.every((key) => {
      const state = this.#states.get(key);
      return Boolean(state && state.failures === 0 && state.cooldownUntil > now);
    });
  }
}

export const geminiKeyPool = new GeminiKeyPool();

export async function runWithGeminiKeyPool({
  keys,
  models,
  invoke,
  pool = geminiKeyPool,
  wait = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs)),
  maxCooldownWaitMs = 2_000,
  onAttemptFailure,
}) {
  let eligibleKeys = pool.getEligibleKeys(keys);
  if (!eligibleKeys.length) {
    if (pool.areAllKeysCredentialBlocked(keys)) return { ok: false, category: 'credentials' };

    const cooldownWaitMs = pool.getNextEligibleDelay(keys);
    if (cooldownWaitMs > 0 && cooldownWaitMs <= maxCooldownWaitMs) {
      await wait(cooldownWaitMs);
      eligibleKeys = pool.getEligibleKeys(keys);
    }
    if (!eligibleKeys.length) return { ok: false, category: 'transient' };
  }

  let lastFailure;
  for (const [keyIndex, key] of eligibleKeys.entries()) {
    let fallbackCategory;
    for (const model of models) {
      try {
        const value = await invoke(model, key);
        pool.recordSuccess(key);
        return { ok: true, value };
      } catch (error) {
        const classified = classifyGeminiError(error);
        lastFailure = classified;
        onAttemptFailure?.({
          keyIndex: keyIndex + 1,
          model,
          category: classified.type,
          statusCode: classified.statusCode,
        });

        if (classified.type === 'model' || classified.type === 'output') {
          fallbackCategory = classified.type;
          continue;
        }
        if (classified.type === 'transient') {
          pool.recordTransientFailure(key);
          break;
        }
        if (classified.type === 'credentials') {
          pool.recordCredentialFailure(key);
          break;
        }
        return { ok: false, category: 'request', statusCode: classified.statusCode };
      }
    }

    if (fallbackCategory) {
      return { ok: false, category: fallbackCategory, statusCode: lastFailure?.statusCode };
    }
  }

  return {
    ok: false,
    category: lastFailure?.type === 'credentials' && pool.areAllKeysCredentialBlocked(keys) ? 'credentials' : 'transient',
    statusCode: lastFailure?.statusCode,
  };
}
