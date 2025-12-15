/**
 * Rotas de gerenciamento de usuários
 */
import { Router } from 'express';
import { userController } from '../controllers';
import { authMiddleware } from '../middleware';

const router = Router();

// Todas as rotas de usuários requerem autenticação
router.use(authMiddleware);

/**
 * @route GET /users
 * @description Listar usuários
 * @access Private (Admin)
 */
router.get('/', userController.list);

/**
 * @route GET /users/:id
 * @description Buscar usuário por ID
 * @access Private
 */
router.get('/:id', userController.getById);

/**
 * @route PUT /users/:id
 * @description Atualizar usuário
 * @access Private
 */
router.put('/:id', userController.update);

/**
 * @route DELETE /users/:id
 * @description Excluir usuário
 * @access Private (Admin)
 */
router.delete('/:id', userController.delete);

export default router;
