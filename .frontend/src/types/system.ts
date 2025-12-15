/**
 * Tipos relacionados ao sistema e configuração
 */

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  version: string;
  environment: string;
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  status: 'up' | 'down';
  latency?: number;
  lastCheck: Date;
  error?: string;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

export interface Configuration {
  backendUrl: string;
  environment: string;
  features: {
    authentication: boolean;
    streaming: boolean;
    caching: boolean;
  };
}
