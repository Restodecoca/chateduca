import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: string;
  content: string;
  createdAt: string;
}

interface Session {
  sessionId: string;
  date: Date;
  messageCount: number;
  messages: Message[];
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use relative path to leverage Vite proxy
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    if (studentId) {
      fetchHistory();
    }
  }, [studentId]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/parent/history/${studentId}`);
      setSessions(response.data);
      
      if (response.data.length > 0) {
        setSelectedSession(response.data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      alert('Erro ao carregar histórico. Verifique suas permissões.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando histórico...</p>
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
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Histórico de Conversas</h1>
                <p className="text-sm text-gray-600">Visualize todas as conversas do aluno</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="md:col-span-1 bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sessões ({sessions.length})</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedSession?.sessionId === session.sessionId
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">
                    {new Date(session.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {session.messageCount} mensagens
                  </p>
                </button>
              ))}
              
              {sessions.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">
                  Nenhuma conversa encontrada
                </p>
              )}
            </div>
          </div>

          {/* Messages Display */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md border border-gray-200">
            {selectedSession ? (
              <div className="h-[700px] flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">
                    Conversa de {new Date(selectedSession.date).toLocaleDateString('pt-BR')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedSession.messages.length} mensagens
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedSession.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-100' : 'text-gray-500'}`}>
                          {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[700px] flex items-center justify-center text-gray-500">
                Selecione uma sessão para visualizar as mensagens
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
