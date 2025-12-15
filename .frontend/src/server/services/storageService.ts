/**
 * Serviço de persistência local usando Prisma
 * Gerencia armazenamento de histórico, logs e sessões
 */

import prisma from '../lib/prisma';
import { Message, ChatHistory } from '../../types/chat';
import { logError, logInfo } from '../utils/logger';

class StorageService {
  private prisma = prisma;

  constructor() {
    // Prisma já está inicializado no import
  }

  /**
   * Conecta ao banco de dados
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logInfo('�?Prisma conectado ao banco de dados');
    } catch (error) {
      logError('�?Erro ao conectar Prisma', error as Error);
      throw error;
    }
  }

  /**
   * Desconecta do banco de dados
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logInfo('👋 Prisma desconectado');
    } catch (error) {
      logError('Erro ao desconectar Prisma', error as Error);
    }
  }

  /**
   * TODO: Salvar mensagem no histórico
   * Implementar quando schema Prisma estiver definido
   */
  async saveMessage(_message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    throw new Error('Método não implementado - aguardando schema Prisma');
    // Implementação futura:
    // const saved = await this.prisma.message.create({ data: message });
    // return saved;
  }

  /**
   * TODO: Buscar histórico de uma sessão
   */
  async getHistory(_sessionId: string): Promise<ChatHistory> {
    throw new Error('Método não implementado - aguardando schema Prisma');
    // Implementação futura:
    // const messages = await this.prisma.message.findMany({
    //   where: { sessionId },
    //   orderBy: { createdAt: 'asc' }
    // });
    // return { sessionId, messages, ... };
  }

  /**
   * TODO: Deletar histórico de uma sessão
   */
  async deleteHistory(_sessionId: string): Promise<void> {
    throw new Error('Método não implementado - aguardando schema Prisma');
    // Implementação futura:
    // await this.prisma.message.deleteMany({ where: { sessionId } });
  }

  /**
   * TODO: Salvar log de auditoria
   */
  async saveLog(_level: string, _message: string, _metadata?: Record<string, any>): Promise<void> {
    throw new Error('Método não implementado - aguardando schema Prisma');
    // Implementação futura:
    // await this.prisma.log.create({ data: { level, message, metadata } });
  }
}

export default new StorageService();
