/**
 * Tipos relacionados a autenticação e usuários
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'parent' | 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  userType?: 'student' | 'parent';
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
