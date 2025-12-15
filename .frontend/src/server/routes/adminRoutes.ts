/**
 * Rotas administrativas
 */
import { Router } from 'express';
import { adminController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

// Todas as rotas admin requerem autenticação
router.use(authMiddleware);

/**
 * @route GET /admin/stats
 * @description Estatísticas gerais do sistema
 * @access Private (Admin)
 */
router.get('/stats', adminController.getStats);

/**
 * @route GET /admin/logs
 * @description Logs do sistema
 * @access Private (Admin)
 */
router.get('/logs', adminController.getLogs);

export default router;
