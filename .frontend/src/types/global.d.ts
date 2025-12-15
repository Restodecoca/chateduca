// Global type definitions and extensions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      BACKEND_URL: string;
      DATABASE_URL: string;
      PORT: string;
      HOST: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;
      LOG_LEVEL: string;
      LOG_FILE: string;
      CORS_ORIGIN: string;
    }
  }

  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      sessionId?: string;
    }
  }
}

export {};
