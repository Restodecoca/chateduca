import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string; // 'student' | 'parent' | 'admin'
  userType?: 'student' | 'parent'; // Legacy support
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType: 'student' | 'parent';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use relative path to leverage Vite proxy (/api -> http://localhost:3000)
const API_URL = import.meta.env.VITE_API_URL || '/api';

console.log('API_URL configured:', API_URL);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);

      console.log('User fetched:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      console.log('Login credentials:', { email, password: '***' });
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      console.log('Login response status:', response.status);
      console.log('Login response data:', response.data);

      const { token: newToken, user: userData } = response.data;
      
      if (!newToken || !userData) {
        console.error('Invalid login response:', response.data);
        throw new Error('Resposta de login inválida');
      }
      
      console.log('Login successful:', { token: newToken?.substring(0, 20) + '...', user: userData });
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      throw new Error(error.response?.data?.error || error.message || 'Erro ao fazer login');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, data);

      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Erro ao registrar');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
