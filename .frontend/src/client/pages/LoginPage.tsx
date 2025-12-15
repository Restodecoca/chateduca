import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  userType: z.enum(['student', 'parent'], {
    errorMap: () => ({ message: 'Selecione um tipo de usuário' }),
  }),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuth();

  // Use relative path to leverage Vite proxy
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginForm) => {
    try {
      setError('');
      console.log('LoginPage: Attempting login with:', data.email);
      await login(data.email, data.password);
      
      // Redirecionar baseado no role do usuário
      const response = await axios.get(`${API_URL}/auth/me`);
      const userRole = response.data.role;
      
      console.log('LoginPage: User role:', userRole);
      
      if (userRole === 'parent' || userRole === 'responsavel') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('LoginPage: Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Credenciais inválidas. Use: aluno@demo.com / user123';
      setError(errorMessage);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    try {
      setError('');
      await registerUser(data);
      
      // Redirecionar baseado no userType selecionado
      if (data.userType === 'parent') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!isRegister ? (
          // Login Form
          <div className="card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">ChatEduca</h1>
              <p className="text-gray-600 mt-2">Seu assistente educacional</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  {...registerLogin('email')}
                  type="email"
                  id="email"
                  className="input-field"
                  placeholder="seu@email.com"
                />
                {loginErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  {...registerLogin('password')}
                  type="password"
                  id="password"
                  className="input-field"
                  placeholder="••••••"
                />
                {loginErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoginSubmitting}
                className="btn-primary w-full"
              >
                {isLoginSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <button
                  onClick={() => setIsRegister(true)}
                  className="text-primary-400 font-medium hover:underline"
                >
                  Registre-se aqui
                </button>
              </p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Credenciais de demonstração:
              </h3>
              <p className="text-xs text-gray-600">
                <strong>Aluno:</strong> aluno@demo.com / senha123
              </p>
              <p className="text-xs text-gray-600">
                <strong>Responsável:</strong> responsavel@demo.com / senha123
              </p>
            </div>
          </div>
        ) : (
          // Register Form
          <div className="card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">ChatEduca</h1>
              <p className="text-gray-600 mt-2">Criar nova conta</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  {...registerForm('name')}
                  type="text"
                  id="name"
                  className="input-field"
                  placeholder="Seu nome"
                />
                {registerErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="regEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  {...registerForm('email')}
                  type="email"
                  id="regEmail"
                  className="input-field"
                  placeholder="seu@email.com"
                />
                {registerErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="regPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  {...registerForm('password')}
                  type="password"
                  id="regPassword"
                  className="input-field"
                  placeholder="••••••"
                />
                {registerErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de usuário
                </label>
                <select
                  {...registerForm('userType')}
                  id="userType"
                  className="input-field"
                >
                  <option value="">Selecione...</option>
                  <option value="student">Aluno</option>
                  <option value="parent">Responsável</option>
                </select>
                {registerErrors.userType && (
                  <p className="mt-1 text-sm text-red-600">{registerErrors.userType.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isRegisterSubmitting}
                className="btn-primary w-full"
              >
                {isRegisterSubmitting ? 'Registrando...' : 'Registrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <button
                  onClick={() => setIsRegister(false)}
                  className="text-primary-400 font-medium hover:underline"
                >
                  Faça login aqui
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
