/**
 * Serviço para funcionalidades de responsáveis (pais/guardiões)
 */
import prisma from '../lib/prisma';
import { AuthenticationError, NotFoundError } from '../utils/errorHandler';

export const parentService = {
  /**
   * Buscar alunos vinculados ao responsável
   */
  async getLinkedStudents(parentId: string) {
    const links = await prisma.parentStudent.findMany({
      where: { parentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return links.map((link) => link.student);
  },

  /**
   * Buscar estatísticas do aluno para o dashboard
   */
  async getStudentStats(parentId: string, studentId: string) {
    // Verificar se o responsável tem acesso a esse aluno
    const link = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
      include: {
        student: true,
      },
    });

    if (!link) {
      throw new AuthenticationError('Você não tem permissão para acessar os dados deste aluno');
    }

    // Buscar mensagens da tabela chat_memory do LlamaIndex
    // Cada linha é uma mensagem individual com dados em JSON
    // O campo 'key' contém o nome do usuário + session_id
    const studentName = link.student.name;
    const chatMemoryRecords = await prisma.$queryRaw<Array<{
      id: number;
      key: string;
      timestamp: bigint;
      role: string;
      data: any;
    }>>`
      SELECT id, key, timestamp, role, data
      FROM chat_memory
      WHERE key LIKE ${`${studentName}_%`}
      ORDER BY timestamp DESC
    `;

    let totalMessages = 0;
    const allUserMessages: Array<{ content: string; date: Date }> = [];

    // Processar mensagens do chat_memory
    chatMemoryRecords.forEach((record) => {
      if (record.role === 'user') {
        totalMessages++;
        
        // Extrair conteúdo do JSON data.blocks[0].text
        let content = '';
        if (record.data && record.data.blocks && Array.isArray(record.data.blocks)) {
          const textBlock = record.data.blocks.find((block: any) => block.block_type === 'text');
          if (textBlock) {
            content = textBlock.text || '';
          }
        }
        
        allUserMessages.push({
          content,
          date: new Date(Number(record.timestamp) / 1000000), // Convert nanoseconds to milliseconds
        });
      }
    });

    // Analisar assuntos (baseado em palavras-chave)
    const subjectKeywords: Record<string, string[]> = {
      'Matemática': ['matemática', 'número', 'cálculo', 'porcentagem', 'fração', 'equação', 'soma', 'multiplicação'],
      'Português': ['português', 'gramática', 'texto', 'redação', 'verbo', 'ortografia', 'sujeito', 'predicado'],
      'Ciências': ['ciências', 'célula', 'sistema solar', 'biologia', 'física', 'química'],
      'História': ['história', 'guerra', 'revolução', 'império', 'república'],
      'Geografia': ['geografia', 'país', 'continente', 'clima', 'relevo'],
    };

    const subjectCounts: Record<string, number> = {};
    allUserMessages.forEach((msg) => {
      const content = msg.content.toLowerCase();
      Object.entries(subjectKeywords).forEach(([subject, keywords]) => {
        if (keywords.some((keyword) => content.includes(keyword))) {
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
        }
      });
    });

    const subjects = Object.entries(subjectCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // Atividades recentes
    const recentActivity = allUserMessages
      .slice(0, 5)
      .map((msg) => ({
        date: msg.date.toLocaleDateString('pt-BR'),
        topic: msg.content.slice(0, 50) + (msg.content.length > 50 ? '...' : ''),
      }));

    // Contar sessões únicas (baseado em key)
    const uniqueSessions = new Set(chatMemoryRecords.map(r => r.key));

    return {
      totalSessions: uniqueSessions.size,
      totalMessages,
      subjects,
      recentActivity,
    };
  },

  /**
   * Buscar histórico de conversas do aluno
   */
  async getStudentHistory(parentId: string, studentId: string) {
    // Verificar permissão
    const link = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
      include: {
        student: true,
      },
    });

    if (!link) {
      throw new AuthenticationError('Você não tem permissão para acessar o histórico deste aluno');
    }

    // Buscar mensagens da tabela chat_memory
    const studentName = link.student.name;
    const chatMemoryRecords = await prisma.$queryRaw<Array<{
      id: number;
      key: string;
      timestamp: bigint;
      role: string;
      data: any;
    }>>`
      SELECT id, key, timestamp, role, data
      FROM chat_memory
      WHERE key LIKE ${`${studentName}_%`}
      ORDER BY timestamp DESC
    `;

    // Agrupar mensagens por sessão (key)
    const sessionMap = new Map<string, Array<{
      role: string;
      content: string;
      timestamp: bigint;
    }>>();

    chatMemoryRecords.forEach((record) => {
      if (!sessionMap.has(record.key)) {
        sessionMap.set(record.key, []);
      }

      // Extrair conteúdo do JSON data.blocks[0].text
      let content = '';
      if (record.data && record.data.blocks && Array.isArray(record.data.blocks)) {
        const textBlock = record.data.blocks.find((block: any) => block.block_type === 'text');
        if (textBlock) {
          content = textBlock.text || '';
        }
      }

      sessionMap.get(record.key)!.push({
        role: record.role,
        content,
        timestamp: record.timestamp,
      });
    });

    // Converter para formato de resposta
    return Array.from(sessionMap.entries()).map(([sessionKey, messages]) => {
      const firstTimestamp = messages.length > 0 ? messages[messages.length - 1].timestamp : 0n;
      
      return {
        sessionId: sessionKey,
        date: new Date(Number(firstTimestamp) / 1000000),
        messageCount: messages.length,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          createdAt: new Date(Number(msg.timestamp) / 1000000),
        })),
      };
    });
  },

  /**
   * Gerar contexto para relatório via chatbot
   */
  async generateReportContext(parentId: string, studentId: string) {
    // Verificar permissão
    const link = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
      include: {
        student: true,
      },
    });

    if (!link) {
      throw new AuthenticationError('Você não tem permissão para gerar relatório deste aluno');
    }

    // Buscar mensagens da tabela chat_memory (últimas 100 mensagens)
    const studentName = link.student.name;
    const chatMemoryRecords = await prisma.$queryRaw<Array<{
      id: number;
      key: string;
      timestamp: bigint;
      role: string;
      data: any;
    }>>`
      SELECT id, key, timestamp, role, data
      FROM chat_memory
      WHERE key LIKE ${`${studentName}_%`}
      ORDER BY timestamp DESC
      LIMIT 100
    `;

    let allMessages: Array<{ role: string; content: string; date: Date }> = [];
    let userMessageCount = 0;
    let assistantMessageCount = 0;

    chatMemoryRecords.forEach((record) => {
      // Extrair conteúdo do JSON data.blocks[0].text
      let content = '';
      if (record.data && record.data.blocks && Array.isArray(record.data.blocks)) {
        const textBlock = record.data.blocks.find((block: any) => block.block_type === 'text');
        if (textBlock) {
          content = textBlock.text || '';
        }
      }

      allMessages.push({
        role: record.role,
        content,
        date: new Date(Number(record.timestamp) / 1000000),
      });

      if (record.role === 'user') userMessageCount++;
      if (record.role === 'assistant') assistantMessageCount++;
    });

    return {
      studentName: link.student.name,
      totalMessages: userMessageCount,
      messagesAnalyzed: allMessages.length,
      messages: allMessages,
    };
  },
};
