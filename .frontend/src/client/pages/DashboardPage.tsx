import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Stats {
  totalSessions: number;
  totalMessages: number;
  subjects: { name: string; count: number }[];
  recentActivity: { date: string; topic: string }[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalMessages: 0,
    subjects: [],
    recentActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Use relative path to leverage Vite proxy
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  console.log('DashboardPage - API_URL:', API_URL);
  console.log('DashboardPage - user:', user);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStats(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      console.log('Fetching students from:', `${API_URL}/parent/students`);
      const response = await axios.get(`${API_URL}/parent/students`);
      console.log('Students fetched:', response.data);
      setStudents(response.data);
      
      if (response.data.length > 0) {
        setSelectedStudent(response.data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      // Mesmo com erro, desativa loading para mostrar a UI
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (studentId: string) => {
    try {
      console.log('Fetching stats for student:', studentId);
      const response = await axios.get(`${API_URL}/parent/stats/${studentId}`);
      console.log('Stats fetched:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Mantém valores padrão em caso de erro
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewReports = () => {
    if (!selectedStudent) {
      alert('Nenhum aluno selecionado');
      return;
    }
    
    // Navegar para página de relatório (ou abrir modal)
    navigate(`/parent/report/${selectedStudent.id}`);
  };

  const handleViewHistory = () => {
    if (!selectedStudent) {
      alert('Nenhum aluno selecionado');
      return;
    }
    
    // Navegar para página de histórico
    navigate(`/parent/history/${selectedStudent.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">CE</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ChatEduca</h1>
                <p className="text-sm text-gray-600">Dashboard do Responsável</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                  Responsável
                </span>
              </div>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                Início
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo(a), {user?.name}!
          </h2>
          <p className="text-gray-600">
            Acompanhe o progresso e atividades de aprendizado
          </p>
        </div>

        {/* Student Selector */}
        {students.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aluno Selecionado:
            </label>
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const student = students.find(s => s.id === e.target.value);
                if (student) setSelectedStudent(student);
              }}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedStudent && students.length === 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800 font-medium">
              Você ainda não tem alunos vinculados.
            </p>
            <p className="text-yellow-600 text-sm mt-2">
              Entre em contato com o administrador para vincular alunos à sua conta.
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            <p className="text-sm text-gray-600">Sessões de Estudo</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            <p className="text-sm text-gray-600">Perguntas Feitas</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.subjects.length}</p>
            <p className="text-sm text-gray-600">Matérias Estudadas</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Distribuição por Matéria
            </h3>
            <div className="space-y-4">
              {stats.subjects.map((subject, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                    <span className="text-sm text-gray-500">{subject.count} perguntas</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${(subject.count / stats.totalMessages) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Atividade Recente
            </h3>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-semibold text-sm">
                      {activity.date.split('/')[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.topic}
                    </p>
                    <p className="text-xs text-gray-500">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleViewReports}
              className="flex items-center gap-3 p-4 border-2 border-primary-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Ver Relatório</p>
                <p className="text-xs text-gray-500">Relatório completo</p>
              </div>
            </button>

            <button 
              onClick={handleViewHistory}
              className="flex items-center gap-3 p-4 border-2 border-primary-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Histórico de Conversas</p>
                <p className="text-xs text-gray-500">Ver todas as conversas</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
