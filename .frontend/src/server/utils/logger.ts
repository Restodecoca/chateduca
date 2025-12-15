/**
 * Sistema de logging centralizado usando Winston
 */

import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from './env';

// Cria diretório de logs se não existir
const logsDir = path.dirname(env.LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato customizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Configuração do logger
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: customFormat,
  transports: [
    // Log em arquivo
    new winston.transports.File({ 
      filename: env.LOG_FILE,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Log de erros separado
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Em desenvolvimento, também loga no console
if (env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;

// Helpers de logging
export const logInfo = (message: string, metadata?: Record<string, any>) => {
  logger.info(message, metadata);
};

export const logError = (message: string, error?: Error, metadata?: Record<string, any>) => {
  logger.error(message, { ...metadata, error: error?.message, stack: error?.stack });
};

export const logWarn = (message: string, metadata?: Record<string, any>) => {
  logger.warn(message, metadata);
};

export const logDebug = (message: string, metadata?: Record<string, any>) => {
  logger.debug(message, metadata);
};
