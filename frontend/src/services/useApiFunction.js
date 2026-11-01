import { useCallback } from 'react';

/**
 * Compatibility hook replacing TanStack Start's useServerFn.
 * The supplied function is now a normal API client function.
 */
export function useServerFn(serverFunction) {
  return useCallback((input = {}) => serverFunction(input), [serverFunction]);
}
