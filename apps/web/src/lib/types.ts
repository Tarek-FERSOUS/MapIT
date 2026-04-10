/**
 * Type utilities for common patterns
 */

/**
 * Extract pick of properties from a type
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Make specific properties required
 */
export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make all properties optional
 */
export type Optional<T> = {
  [K in keyof T]?: T[K];
};

/**
 * Response wrapper for API calls
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response from API
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Async state management
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Form field state
 */
export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  isDirty: boolean;
}
