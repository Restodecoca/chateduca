/**
 * Middleware de logging de requisições
 */

import { Request, Response, NextFunction } from 'express';
import { logInfo } from '../utils/logger';

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Log da requisição
  logInfo(`[${req.method}] ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    body: req.body,
  });

  // Intercepta a resposta
  res.on('finish', () => {
    const duration = Date.now() - start;
    logInfo(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
