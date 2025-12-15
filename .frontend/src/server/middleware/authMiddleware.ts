/**
 * Middleware de autenticação JWT
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthenticationError } from '../utils/errorHandler';
import { TokenPayload } from '../../types/auth';

// Estender o tipo Request para incluir user
export interface AuthRequest extends Request {
  userId?: string;
  user?: TokenPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      userId?: string;
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Token não fornecido');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Formato de token inválido. Use: Bearer <token>');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Validar e decodificar token
    const decoded = authService.verifyToken(token);
    
    // Adicionar informações do usuário à requisição
    req.user = decoded;
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      next(new AuthenticationError('Token inválido ou expirado'));
    }
  }
};

// Manter compatibilidade
export const authMiddleware = authenticate;
