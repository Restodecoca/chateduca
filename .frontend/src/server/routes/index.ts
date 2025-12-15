/**
 * Agregador de rotas
 */

import { Router } from 'express';
import chatRoutes from './chatRoutes';
import systemRoutes from './systemRoutes';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import adminRoutes from './adminRoutes';
import aiRoutes from './aiRoutes';
import parentRoutes from './parentRoutes';

const router = Router();

// Monta as rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/system', systemRoutes);
router.use('/parent', parentRoutes);

export default router;
