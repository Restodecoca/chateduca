/**
 * Tipos para requisições e respostas da API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  message: string;
  timestamp: string;
  services?: {
    backend: boolean;
    database: boolean;
  };
}

export interface RequestMetadata {
  requestId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
}
