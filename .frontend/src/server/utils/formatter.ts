/**
 * Utilitários de formatação
 */

import { ChatResponse, Message } from '../../types/chat';

/**
 * Formata resposta do backend FastAPI para o formato do frontend
 */
export const formatChatResponse = (backendResponse: any): ChatResponse => {
  return {
    response: String(backendResponse.response || ''),
    sources: Array.isArray(backendResponse.sources) ? backendResponse.sources : [],
  };
};

/**
 * Formata mensagem para armazenamento
 */
export const formatMessage = (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: string[]
): Omit<Message, 'id' | 'createdAt'> => {
  return {
    sessionId,
    role,
    content,
    sources,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Sanitiza entrada do usuário
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .substring(0, 10000); // Limita tamanho
};

/**
 * Gera ID de sessão único
 */
export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Formata timestamp para exibição
 */
export const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
};

/**
 * Trunca texto longo
 */
export const truncate = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
