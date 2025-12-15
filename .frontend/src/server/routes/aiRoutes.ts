/**
 * Rotas para integração com AI SDK
 */
import { Router } from 'express';
import { streamChat } from '../controllers/aiController';

const router = Router();

/**
 * POST /api/ai/chat
 * Stream de chat compatível com AI SDK
 */
router.post('/chat', streamChat);

export default router;
