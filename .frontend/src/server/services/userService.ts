/**
 * Serviço de gerenciamento de usuários
 */
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
import { NotFoundError, ConflictError } from '../utils/errorHandler';

export const userService = {
  /**
   * Listar usuários com paginação
   */
  async listUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Buscar usuário por ID
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            messages: true,
            sessions: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    return user;
  },

  /**
   * Atualizar usuário
   */
  async updateUser(id: string, data: { name?: string; email?: string; password?: string; role?: string }) {
    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundError('Usuário');
    }

    // Se estiver alterando email, verificar se não existe outro usuário com esse email
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (emailExists) {
        throw new ConflictError('Email já está em uso');
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;
    
    // Hash da senha se fornecida
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Atualizar usuário
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  },

  /**
   * Excluir usuário
   */
  async deleteUser(id: string) {
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    // Excluir usuário (as mensagens e logs serão mantidos com userId como null devido ao onDelete: SetNull)
    await prisma.user.delete({
      where: { id }
    });

    return { message: 'Usuário excluído com sucesso' };
  }
};
