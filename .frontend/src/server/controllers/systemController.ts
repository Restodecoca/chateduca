/**
 * Controller do sistema
 * Gerencia informações de status e configuração
 */

import { Request, Response } from 'express';
import { handleError } from '../utils/errorHandler';
import { env } from '../utils/env';
import { ApiResponse } from '../../types/api';
import { SystemStatus } from '../../types/system';

/**
 * GET /api/system/status
 * Retorna status do sistema
 */
export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const status: SystemStatus = {
      status: 'healthy',
      uptime: process.uptime(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      services: [
        {
          name: 'Backend FastAPI',
          status: 'up',
          lastCheck: new Date(),
        },
        {
          name: 'Database',
          status: 'up',
          lastCheck: new Date(),
        },
      ],
    };

    const response: ApiResponse<SystemStatus> = {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    handleError(error as Error, res);
  }
};

/**
 * GET /api/system/config
 * Retorna configuração pública do sistema
 */
export const getConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = {
      environment: env.NODE_ENV,
      features: {
        authentication: false, // TODO: implementar
        streaming: false, // TODO: implementar
        caching: false, // TODO: implementar
      },
    };

    const response: ApiResponse = {
      success: true,
      data: config,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    handleError(error as Error, res);
  }
};
