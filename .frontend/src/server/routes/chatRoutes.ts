/**
 * Rotas de chat
 * Comunicação direta com o backend FastAPI (../src/dev.py)
 */

import { Router } from 'express';
import { chatController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

/**
 * @route POST /chat
 * @description Enviar mensagem e obter resposta completa
 * @access Private
 */
router.post('/', authMiddleware, chatController.sendMessage);

/**
 * @route POST /chat/streaming
 * @description Enviar mensagem e receber resposta em tempo real (streaming)
 * @access Private
 */
router.post('/streaming', authMiddleware, chatController.sendMessageStreaming);

/**
 * @route GET /chat/history
 * @description Ver histórico do usuário logado
 * @access Private
 */
router.get('/history', authMiddleware, chatController.getHistory);

/**
 * @route DELETE /chat/clear
 * @description Apagar histórico
 * @access Private
 */
router.delete('/clear', authMiddleware, chatController.clearMemory);

/**
 * @route GET /chat/health
 * @description Verifica status de saúde do backend FastAPI
 * @access Public
 */
router.get('/health', chatController.healthCheck);

export default router;
