/**
 * Rotas de sistema
 * Informações sobre status e configuração
 */

import { Router } from 'express';
import { systemController } from '../controllers';

const router = Router();

/**
 * @route GET /api/system/status
 * @desc Retorna status do sistema e serviços
 * @response { success: boolean, data: SystemStatus }
 */
router.get('/status', systemController.getStatus);

/**
 * @route GET /api/system/config
 * @desc Retorna configuração pública
 * @response { success: boolean, data: Configuration }
 */
router.get('/config', systemController.getConfig);

export default router;
