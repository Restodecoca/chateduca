/**
 * Serviço de comunicação com o backend FastAPI (../src/dev.py)
 * Gerencia todas as operações de chat e mensagens
 */

import apiService from './apiService';
import prisma from '../lib/prisma';
import { 
  ChatRequest, 
  ChatResponse, 
  ClearMemoryRequest, 
  ClearMemoryResponse 
} from '../../types/chat';
import { sanitizeInput } from '../utils/formatter';
import { ValidationError } from '../utils/errorHandler';

class ChatService {
  /**
   * Envia mensagem para o backend e retorna resposta do chatbot
   * Endpoint: POST /chat
   */
  async sendMessage(message: string, sessionId: string): Promise<ChatResponse> {
    // Valida entrada
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Mensagem não pode estar vazia');
    }

    if (!sessionId || sessionId.trim().length === 0) {
      throw new ValidationError('Session ID é obrigatório');
    }

    // Sanitiza mensagem
    const sanitizedMessage = sanitizeInput(message);

    // Prepara payload
    const payload: ChatRequest = {
      message: sanitizedMessage,
      session_id: sessionId,
    };

    // Envia para o backend
    const response = await apiService.post<ChatResponse>('/chat', payload);

    return response;
  }

  /**
   * Limpa histórico de memória de uma sessão
   * Endpoint: POST /clear-memory
   */
  async clearMemory(sessionId: string): Promise<ClearMemoryResponse> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new ValidationError('Session ID é obrigatório');
    }

    const payload: ClearMemoryRequest = {
      session_id: sessionId,
    };

    const response = await apiService.post<ClearMemoryResponse>('/clear-memory', payload);

    return response;
  }

  /**
   * Verifica status de saúde do backend
   * Endpoint: GET /health
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await apiService.get<{ status: string; message: string }>('/health');
    return response;
  }

  /**
   * Envia mensagem e recebe resposta em streaming
   */
  async sendMessageStreaming(
    message: string, 
    sessionId: string,
    userId: string,
    onChunk: (chunk: any) => void
  ): Promise<void> {
    // Valida entrada
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Mensagem não pode estar vazia');
    }

    if (!sessionId || sessionId.trim().length === 0) {
      throw new ValidationError('Session ID é obrigatório');
    }

    const sanitizedMessage = sanitizeInput(message);

    // Salva mensagem do usuário no banco
    // Busca ou cria sessão
    let session = await prisma.session.findUnique({
      where: { sessionId }
    });

    if (!session) {
      session = await prisma.session.create({
        data: {
          sessionId,
          userId
        }
      });
    }

    // Salva mensagem do usuário
    await prisma.message.create({
      data: {
        sessionId,
        userId,
        role: 'user',
        content: sanitizedMessage
      }
    });

    // Faz a requisição ao backend usando streaming real via EventSource
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const url = `${backendUrl}/chat/streaming`;

    try {
      // Faz POST para o endpoint de streaming
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sanitizedMessage,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // Lê o stream de resposta
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let sources: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Decodifica o chunk
        buffer += decoder.decode(value, { stream: true });
        
        // Processa linhas completas (separadas por \n\n no SSE)
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Mantém a última linha incompleta no buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: '
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'chunk') {
                fullResponse += parsed.content;
                onChunk({ type: 'token', content: parsed.content });
              } else if (parsed.type === 'sources') {
                sources = parsed.sources;
                onChunk({ type: 'sources', content: sources });
              } else if (parsed.type === 'done') {
                onChunk({ type: 'complete', content: 'done' });
              } else if (parsed.type === 'error') {
                onChunk({ type: 'error', content: parsed.error });
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      // Salva resposta do assistente no banco após completar
      await prisma.message.create({
        data: {
          sessionId,
          userId,
          role: 'assistant',
          content: fullResponse,
          sources: sources
        }
      });

    } catch (error) {
      onChunk({ type: 'error', content: (error as Error).message });
      throw error;
    }
  }

  /**
   * Obter histórico de mensagens do usuário
   */
  async getHistory(userId: string, sessionId?: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    
    if (sessionId) {
      where.sessionId = sessionId;
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'asc'
        },
        include: {
          session: {
            select: {
              sessionId: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.message.count({ where })
    ]);

    // Agrupar por sessão se não foi especificado sessionId
    if (!sessionId) {
      const sessions = await prisma.session.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            take: 5 // Últimas 5 mensagens de cada sessão para preview
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return {
        sessions: sessions.map((s: any) => ({
          sessionId: s.sessionId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messageCount: s.messages.length,
          preview: s.messages.slice(0, 2)
        })),
        pagination: {
          page,
          limit,
          total: sessions.length,
          totalPages: Math.ceil(sessions.length / limit)
        }
      };
    }

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default new ChatService();
