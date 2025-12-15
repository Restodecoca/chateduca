/**
 * Rotas para funcionalidades de responsáveis
 */
import express from 'express';
import { parentController } from '../controllers/parentController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * GET /api/parent/students
 * Buscar alunos vinculados ao responsável
 */
router.get('/students', parentController.getLinkedStudents);

/**
 * GET /api/parent/stats/:studentId
 * Buscar estatísticas do aluno
 */
router.get('/stats/:studentId', parentController.getStudentStats);

/**
 * GET /api/parent/history/:studentId
 * Buscar histórico de conversas do aluno
 */
router.get('/history/:studentId', parentController.getStudentHistory);

/**
 * POST /api/parent/report/:studentId
 * Gerar contexto para relatório do aluno
 */
router.post('/report/:studentId', parentController.generateReport);

export default router;
