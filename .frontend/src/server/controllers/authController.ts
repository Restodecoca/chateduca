/**
 * Controller de autenticação
 */
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { RegisterRequest, LoginRequest } from '../../types/auth';

export const authController = {
  /**
   * Registrar novo usuário
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterRequest = req.body;
      
      if (!data.email || !data.password || !data.name) {
        res.status(400).json({
          error: 'Email, senha e nome são obrigatórios'
        });
        return;
      }

      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Autenticar usuário
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginRequest = req.body;
      
      if (!data.email || !data.password) {
        res.status(400).json({
          error: 'Email e senha são obrigatórios'
        });
        return;
      }

      const result = await authService.login(data);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obter perfil do usuário logado
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          error: 'Não autenticado'
        });
        return;
      }

      const user = await authService.getUserById(userId);
      res.status(200).json(user); // Retornar user diretamente, não { user }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Renovar token JWT
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({
          error: 'Não autenticado'
        });
        return;
      }

      const result = await authService.refreshToken(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
