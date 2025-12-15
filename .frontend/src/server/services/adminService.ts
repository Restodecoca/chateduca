/**
 * Serviço administrativo
 */
import prisma from '../lib/prisma';

export const adminService = {
  /**
   * Obter estatísticas gerais do sistema
   */
  async getSystemStats() {
    const [
      totalUsers,
      totalSessions,
      totalMessages,
      totalLogs,
      recentUsers,
      recentSessions,
      logsByLevel
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de sessões
      prisma.session.count(),
      
      // Total de mensagens
      prisma.message.count(),
      
      // Total de logs
      prisma.log.count(),
      
      // Usuários criados nos últimos 7 dias
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Sessões criadas nas últimas 24 horas
      prisma.session.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Logs por nível de severidade
      prisma.log.groupBy({
        by: ['level'],
        _count: {
          level: true
        }
      })
    ]);

    // Usuários mais ativos (por número de mensagens)
    const activeUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        messages: {
          _count: 'desc'
        }
      },
      take: 10
    });

    return {
      totals: {
        users: totalUsers,
        sessions: totalSessions,
        messages: totalMessages,
        logs: totalLogs
      },
      recent: {
        usersLast7Days: recentUsers,
        sessionsLast24Hours: recentSessions
      },
      logs: {
        byLevel: logsByLevel.reduce((acc: Record<string, number>, item: any) => {
          acc[item.level] = item._count.level;
          return acc;
        }, {} as Record<string, number>)
      },
      activeUsers: activeUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        messageCount: user._count.messages
      }))
    };
  },

  /**
   * Obter logs do sistema
   */
  async getLogs(options: { level?: string; page?: number; limit?: number }) {
    const { level, page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const where = level ? { level } : {};

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          level: true,
          message: true,
          userId: true,
          requestId: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.log.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
};
