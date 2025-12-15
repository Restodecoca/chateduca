/**
 * Serviço de autenticação
 */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { RegisterRequest, LoginRequest, LoginResponse, RegisterResponse, TokenPayload } from '../../types/auth';
import { ConflictError, AuthenticationError } from '../utils/errorHandler';
import { env } from '../utils/env';

const JWT_SECRET: string = env.JWT_SECRET;
const JWT_EXPIRES_IN: string = env.JWT_EXPIRES_IN;

export const authService = {
  /**
   * Registrar novo usuário
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new ConflictError('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Mapear userType para role
    let role = 'student'; // padrão
    if (data.userType === 'parent') {
      role = 'parent';
    } else if (data.userType === 'student') {
      role = 'student';
    }

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      user: user as any,
      message: 'Usuário criado com sucesso'
    };
  },

  /**
   * Autenticar usuário
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new AuthenticationError('Email ou senha inválidos');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Email ou senha inválidos');
    }

    // Gerar token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN as any
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'student' | 'parent' | 'admin' | 'user',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      expiresIn: JWT_EXPIRES_IN
    };
  },

  /**
   * Buscar usuário por ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AuthenticationError('Usuário não encontrado');
    }

    return user;
  },

  /**
   * Renovar token
   */
  async refreshToken(userId: string): Promise<{ token: string; expiresIn: string }> {
    const user = await this.getUserById(userId);

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN as any
    });

    return {
      token,
      expiresIn: JWT_EXPIRES_IN
    };
  },

  /**
   * Verificar token JWT
   */
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new AuthenticationError('Token inválido ou expirado');
    }
  }
};
