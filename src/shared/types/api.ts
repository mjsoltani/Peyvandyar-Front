// Common API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
  isAuthError?: boolean;
  isSubscriptionExpired?: boolean;
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  method?: RequestMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
}
