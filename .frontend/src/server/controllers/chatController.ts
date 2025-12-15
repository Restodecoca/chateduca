/**
 * Controller de chat
 * Gerencia requisições relacionadas ao chatbot e histórico
 */

import { Request, Response } from 'express';
import { chatService } from '../services';
import { handleError, ValidationError } from '../utils/errorHandler';
import { formatChatResponse, generateSessionId } from '../utils/formatter';
import { logInfo } from '../utils/logger';
import { ApiResponse } from '../../types/api';
import { ChatResponse } from '../../types/chat';

/**
 * POST /api/chat
 * Envia mensagem ao backend e retorna resposta
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, session_id } = req.body;

    // Validação
    if (!message) {
      throw new ValidationError('Campo "message" é obrigatório');
    }

    // Usa session_id fornecido ou gera um novo
    const sessionId = session_id || generateSessionId();

    // Envia ao backend FastAPI
    logInfo(`Enviando mensagem para sessão ${sessionId}`);
    const backendResponse = await chatService.sendMessage(message, sessionId);

    // Formata resposta
    const formattedResponse = formatChatResponse(backendResponse);

    const response: ApiResponse<ChatResponse> = {
      success: true,
      data: {
        ...formattedResponse,
        session_id: sessionId,
      } as any,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    handleError(error as Error, res);
  }
};

/**
 * POST /api/chat/clear
 * Limpa histórico de uma sessão
 */
export const clearMemory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      throw new ValidationError('Campo "session_id" é obrigatório');
    }

    logInfo(`Limpando memória da sessão ${session_id}`);
    const result = await chatService.clearMemory(session_id);

    const response: ApiResponse = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    handleError(error as Error, res);
  }
};

/**
 * GET /api/chat/health
 * Verifica status do backend
 */
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    const health = await chatService.checkHealth();

    const response: ApiResponse = {
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    handleError(error as Error, res);
  }
};

/**
 * POST /chat/streaming
 * Envia mensagem e recebe resposta em streaming
 */
export const sendMessageStreaming = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, session_id } = req.body;
    const userId = (req as any).user?.userId;

    if (!message) {
      throw new ValidationError('Campo "message" é obrigatório');
    }

    const sessionId = session_id || generateSessionId();

    // Configurar headers para SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    logInfo(`Iniciando streaming para sessão ${sessionId}`);
    
    // Enviar ao backend e fazer streaming da resposta
    await chatService.sendMessageStreaming(message, sessionId, userId, (chunk: any) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', content: (error as Error).message })}\n\n`);
    res.end();
  }
};

/**
 * GET /chat/history
 * Obter histórico de chat do usuário logado
 */
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const sessionId = req.query.session_id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      throw new ValidationError('Usuário não autenticado');
    }

    logInfo(`Buscando histórico para usuário ${userId}`);
    const history = await chatService.getHistory(userId, sessionId, page, limit);

    const response: ApiResponse = {
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    handleError(error as Error, res);
  }
};
