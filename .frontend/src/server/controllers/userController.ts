/**
 * Controller de usuários
 */
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';

export const userController = {
  /**
   * Listar usuários
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      
      // Apenas admins podem listar todos os usuários
      if (userRole !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado. Apenas administradores podem listar usuários.'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await userService.listUsers(page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Buscar usuário por ID
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      // Usuários só podem ver seu próprio perfil, admins podem ver todos
      if (userRole !== 'admin' && currentUserId !== id) {
        res.status(403).json({
          error: 'Acesso negado'
        });
        return;
      }

      const user = await userService.getUserById(id);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Atualizar usuário
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      // Usuários só podem atualizar seu próprio perfil, admins podem atualizar todos
      if (userRole !== 'admin' && currentUserId !== id) {
        res.status(403).json({
          error: 'Acesso negado'
        });
        return;
      }

      const data = req.body;
      const user = await userService.updateUser(id, data);
      res.status(200).json({ user, message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Excluir usuário
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userRole = (req as any).user?.role;
      
      // Apenas admins podem excluir usuários
      if (userRole !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado. Apenas administradores podem excluir usuários.'
        });
        return;
      }

      await userService.deleteUser(id);
      res.status(200).json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      next(error);
    }
  }
};
