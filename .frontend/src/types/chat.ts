/**
 * Tipos relacionados ao chat e mensagens do ChatEduca
 * Baseados nos modelos do backend FastAPI (../src/dev.py)
 */

export interface ChatRequest {
  message: string;
  session_id: string;
}

export interface ChatResponse {
  response: string;
  sources: string[];
}

export interface ClearMemoryRequest {
  session_id: string;
}

export interface ClearMemoryResponse {
  status: string;
  message: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface ChatHistory {
  sessionId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamChunk {
  type: 'token' | 'source' | 'complete' | 'error';
  content: string;
  metadata?: Record<string, any>;
}
