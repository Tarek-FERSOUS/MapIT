import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface UseApiOptions {
  immediate?: boolean;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  method: (params?: any) => Promise<T>,
  options: UseApiOptions = {}
) {
  const { immediate = true, onError } = options;
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async (params?: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await method(params);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      
      // Auto-redirect on 401
      if (error.message.includes('Unauthorized')) {
        router.push('/login');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [method, onError, router]);

  useEffect(() => {
    if (immediate) {
      void fetch();
    }
  }, [fetch, immediate]);

  return { data, isLoading, error, refetch: fetch };
}
