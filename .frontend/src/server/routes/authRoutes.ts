/**
 * Rotas de autenticação
 */
import { Router } from 'express';
import { authController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

/**
 * @route POST /auth/register
 * @description Criar novo usuário
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /auth/login
 * @description Autenticar e gerar JWT
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route GET /auth/me
 * @description Obter perfil do usuário logado
 * @access Private
 */
router.get('/me', authMiddleware, authController.getMe);

/**
 * @route POST /auth/refresh
 * @description Renovar token JWT
 * @access Private
 */
router.post('/refresh', authMiddleware, authController.refresh);

export default router;
