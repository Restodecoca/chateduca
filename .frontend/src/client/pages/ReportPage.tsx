import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function ReportPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { logout } = useAuth();
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Use relative path to leverage Vite proxy
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const generateReport = async () => {
    setIsGenerating(true);
    setError('');
    setReport('');

    try {
      // Buscar contexto do aluno
      const contextResponse = await axios.post(
        `${API_URL}/parent/report/${studentId}`
      );
      
      const { prompt } = contextResponse.data;

      // Enviar para o chatbot via streaming
      const response = await fetch('http://localhost:8000/chat/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          session_id: `report_${studentId}_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullReport = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                fullReport += data.content;
                setReport(fullReport);
              } else if (data.type === 'done') {
                break;
              } else if (data.type === 'error') {
                throw new Error(data.content);
              }
            } catch (e) {
              // Ignora linhas inválidas
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Relatório de Aprendizagem</h1>
                <p className="text-sm text-gray-600">Análise gerada por IA</p>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          {!report && !isGenerating && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Gerar Relatório de Aprendizagem
              </h2>
              <p className="text-gray-600 mb-6">
                O relatório será gerado com base nas conversas do aluno usando inteligência artificial.
              </p>
              <button
                onClick={generateReport}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Gerar Relatório
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Analisando conversas e gerando relatório...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-medium">Erro ao gerar relatório</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={generateReport}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {report && (
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Relatório Gerado</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    Imprimir
                  </button>
                  <button
                    onClick={generateReport}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
                  >
                    Gerar Novo
                  </button>
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
