/**
 * Controller para funcionalidades de responsáveis
 */
import { Request, Response } from 'express';
import { parentService } from '../../server/services/parentService';
import { AuthRequest } from '../middleware/authMiddleware';

export const parentController = {
  /**
   * GET /api/parent/students
   * Buscar alunos vinculados
   */
  async getLinkedStudents(req: AuthRequest, res: Response) {
    try {
      const parentId = req.userId!;
      const students = await parentService.getLinkedStudents(parentId);
      
      res.json(students);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Erro ao buscar alunos vinculados',
      });
    }
  },

  /**
   * GET /api/parent/stats/:studentId
   * Buscar estatísticas do aluno
   */
  async getStudentStats(req: AuthRequest, res: Response) {
    try {
      const parentId = req.userId!;
      const { studentId } = req.params;
      
      const stats = await parentService.getStudentStats(parentId, studentId);
      
      res.json(stats);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Erro ao buscar estatísticas',
      });
    }
  },

  /**
   * GET /api/parent/history/:studentId
   * Buscar histórico de conversas do aluno
   */
  async getStudentHistory(req: AuthRequest, res: Response) {
    try {
      const parentId = req.userId!;
      const { studentId } = req.params;
      
      const history = await parentService.getStudentHistory(parentId, studentId);
      
      res.json(history);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Erro ao buscar histórico',
      });
    }
  },

  /**
   * POST /api/parent/report/:studentId
   * Gerar relatório via chatbot
   */
  async generateReport(req: AuthRequest, res: Response) {
    try {
      const parentId = req.userId!;
      const { studentId } = req.params;
      
      const context = await parentService.generateReportContext(parentId, studentId);
      
      // Montar prompt para o chatbot
      const prompt = `
Você é um assistente educacional. Analise as conversas abaixo do aluno ${context.studentName} e gere um relatório detalhado sobre:

1. **Principais Assuntos Estudados**: Identifique os temas mais recorrentes
2. **Progresso de Aprendizagem**: Avalie a evolução nas perguntas e compreensão
3. **Áreas de Interesse**: Quais matérias o aluno demonstra mais curiosidade
4. **Recomendações**: Sugestões de tópicos para aprofundamento

Total de mensagens analisadas: ${context.messagesAnalyzed}
Total de perguntas do aluno: ${context.totalMessages}

Conversas recentes:
${context.messages.slice(0, 20).map((m, i) => `${i + 1}. [${m.role}] ${m.content.slice(0, 200)}`).join('\n')}

Gere um relatório estruturado em markdown.
`;

      res.json({
        prompt,
        context,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Erro ao gerar relatório',
      });
    }
  },
};
