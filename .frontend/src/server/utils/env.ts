/**
 * Carregamento e validação de variáveis de ambiente
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Carrega .env da raiz do projeto (dois níveis acima: .frontend/src -> .frontend -> raiz)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Schema de validação das variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_URL: z.string().url().default('http://localhost:8000'),
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'),
  JWT_SECRET: z.string().min(32).default('change-this-secret-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

// Valida e exporta as variáveis
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('�?Erro na validação das variáveis de ambiente:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

// Helper para verificar ambiente
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
