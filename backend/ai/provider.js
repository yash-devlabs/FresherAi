const PROVIDERS = {
  gemini: {
    fast: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-2.0-flash'],
    reasoning: ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
  },
};
export function resolveModels(task = 'fast') { return PROVIDERS.gemini[task]; }
