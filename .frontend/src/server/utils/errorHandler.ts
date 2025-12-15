/**
 * Tratamento de erros padronizado
 */

import { Response } from 'express';
import { ApiResponse } from '../../types/api';
import { logError } from './logger';

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Não autenticado') {
    super('AUTHENTICATION_ERROR', message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Sem permissão') {
    super('AUTHORIZATION_ERROR', message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} não encontrado`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('CONFLICT_ERROR', message, 409, details);
    this.name = 'ConflictError';
  }
}

export class BackendError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('BACKEND_ERROR', message, 502, details);
    this.name = 'BackendError';
  }
}

export const handleError = (error: Error, res: Response): void => {
  if (error instanceof AppError) {
    logError(`${error.code}: ${error.message}`, error, error.details);
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(error.statusCode).json(response);
  } else {
    logError('Erro não tratado', error);
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? { original: error.message } : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(500).json(response);
  }
};

export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
