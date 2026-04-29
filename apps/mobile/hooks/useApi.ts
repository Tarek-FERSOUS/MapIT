import { useCallback, useEffect, useState } from "react";

interface UseQueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching data with automatic loading and error handling
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = [],
  options?: { cache?: boolean; cacheTime?: number }
): UseQueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedData, setCachedData] = useState<T | null>(null);
  const [cacheTime, setCacheTime] = useState<number>(0);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
      setCachedData(result);
      setCacheTime(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      // Keep cached data if available
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, cachedData]);

  useEffect(() => {
    const shouldUseCached =
      options?.cache &&
      cachedData &&
      cacheTime &&
      Date.now() - cacheTime < (options?.cacheTime || 5 * 60 * 1000);

    if (shouldUseCached) {
      setData(cachedData);
      setIsLoading(false);
      return;
    }

    refetch();
  }, dependencies);

  return { data, isLoading, error, refetch };
}

interface UseMutationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: () => Promise<T>;
}

/**
 * Hook for mutations (POST, PATCH, DELETE) with loading and error states
 */
export function useMutation<T>(
  mutator: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
): UseMutationState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await mutator();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      options?.onError?.(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [mutator, options]);

  return { data, isLoading, error, execute };
}

/**
 * Hook for managing form state and submission
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChangeField = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitted(false);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      setIsSubmitted(true);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setErrors({ submit: message } as any);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    isSubmitted,
    handleChangeField,
    handleSubmit,
    resetForm,
    setValues,
    setErrors
  };
}

/**
 * Hook for managing paginated data
 */
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function usePagination<T>(
  fetcher: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
  initialLimit: number = 10
) {
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (pageNum: number) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetcher(pageNum, initialLimit);
        setItems(result.items);
        const totalPages = Math.ceil(result.total / initialLimit);
        setPagination({
          page: pageNum,
          limit: initialLimit,
          total: result.total,
          totalPages
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load page";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [fetcher, initialLimit]
  );

  useEffect(() => {
    loadPage(1);
  }, []);

  return {
    items,
    pagination,
    isLoading,
    error,
    goToPage: loadPage,
    nextPage: () => loadPage(Math.min(pagination.page + 1, pagination.totalPages)),
    prevPage: () => loadPage(Math.max(pagination.page - 1, 1))
  };
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing local storage
 */
export function useLocalStorage<T>(key: string, initialValue?: T) {
  const [storedValue, setStoredValue] = useState<T | undefined>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from AsyncStorage
    const loadValue = async () => {
      try {
        const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
        const item = await AsyncStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (err) {
        console.error("Failed to load from storage:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key]);

  const setValue = async (value: T | ((val: T | undefined) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error("Failed to save to storage:", err);
    }
  };

  const removeValue = async () => {
    try {
      setStoredValue(undefined);
      const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.error("Failed to remove from storage:", err);
    }
  };

  return [storedValue, setValue, removeValue, isLoading] as const;
}
