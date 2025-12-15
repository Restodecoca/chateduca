/**
 * Controller administrativo
 */
import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services';

export const adminController = {
  /**
   * Obter estatísticas do sistema
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado. Apenas administradores podem acessar estatísticas.'
        });
        return;
      }

      const stats = await adminService.getSystemStats();
      res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obter logs do sistema
   */
  async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          error: 'Acesso negado. Apenas administradores podem acessar logs.'
        });
        return;
      }

      const level = req.query.level as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const logs = await adminService.getLogs({ level, page, limit });
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  }
};
