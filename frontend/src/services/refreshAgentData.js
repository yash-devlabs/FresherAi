import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
export const DASHBOARD_QUERY_KEY = ['dashboard'];
export function useAgentSync() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    for (const key of [DASHBOARD_QUERY_KEY, ['profile'], ['feedback'], ['roadmap'], ['resume-history'], ['interview-history']]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);
}
