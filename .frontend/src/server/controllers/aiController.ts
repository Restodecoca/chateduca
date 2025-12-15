/**
 * Controller para AI SDK streaming
 */
import { Request, Response } from 'express';
import { chatService } from '../services';
import logger from '../utils/logger';

/**
 * POST /api/ai/chat
 * Stream de resposta compatível com AI SDK
 */
export const streamChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Pega a última mensagem do usuário
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;

    logger.info('AI SDK chat request', { 
      messageCount: messages.length,
      lastMessage: userMessage.substring(0, 100)
    });

    // Configura headers para streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Envia a mensagem para o backend Python
    const sessionId = (req.headers['x-session-id'] as string) || `session_${Date.now()}`;
    const response = await chatService.sendMessage(userMessage, sessionId);

    // Simula streaming da resposta (o backend Python não tem streaming ainda)
    const words = response.response.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      
      // Formato compatível com AI SDK
      const data = JSON.stringify({
        id: sessionId,
        choices: [{
          delta: { content: chunk },
          index: 0,
          finish_reason: i === words.length - 1 ? 'stop' : null
        }]
      });

      res.write(`data: ${data}\n\n`);
      
      // Pequeno delay para simular streaming
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Envia mensagem final
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    logger.error('Erro no streaming de chat', { error });
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erro ao processar mensagem',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
};
