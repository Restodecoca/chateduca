import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

const QUICK_QUESTIONS = [
  '½ O que são frações?',
  '% Como calcular porcentagem?',
  '📝 Como identificar sujeito e predicado?',
  '🔬 O que são células?',
  '☀️ Como funciona o sistema solar?',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Adiciona mensagem vazia do assistente que será preenchida com streaming
    const assistantId = `assistant_${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Usa endpoint de streaming
      const response = await fetch('http://localhost:8000/chat/streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId,
          user_name: user?.name || user?.email || 'anonymous',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na resposta do servidor');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream não disponível');
      }

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'chunk') {
                fullContent += parsed.content;
                
                // Debug: log conteúdo (primeiros 200 chars)
                if (fullContent.length < 200) {
                  console.log('Streaming chunk:', parsed.content, '| Full so far:', fullContent);
                }
                
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              } else if (parsed.type === 'done') {
                // Streaming finalizado
                console.log('Stream completed. Final content:', fullContent);
                setIsLoading(false);
              } else if (parsed.type === 'error') {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignora linhas que não são JSON válido
              if (data !== '' && !data.includes('Stream completed')) {
                console.error('Erro ao parsear JSON:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                content:
                  'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
              }
            : msg
        )
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary-50 to-white">
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
                <p className="text-sm text-gray-600">Seu assistente educacional</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {user?.role === 'parent' || user?.role === 'responsavel' ? 'Responsável' : 'Aluno'}
                </span>
              </div>
              
              <button
                onClick={() => navigate('/home')}
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

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden p-4">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {/* Quick Questions - Mostra apenas se não houver mensagens */}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🎓</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Olá! Como posso ajudar você hoje?
                  </h2>
                  <p className="text-gray-600">
                    Pergunte sobre Matemática, Português ou Ciências
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {QUICK_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(question.substring(question.indexOf(' ') + 1))}
                      className="px-4 py-3 bg-white border-2 border-primary-200 rounded-lg text-left
                               hover:border-primary-400 hover:bg-primary-50 transition-all
                               text-sm font-medium text-gray-700 shadow-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-800 shadow-md border border-gray-200'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap m-0 text-white">{message.content}</p>
                  ) : (
                    <>
                      {/* Mostra loading apenas se a mensagem estiver vazia e isLoading for true */}
                      {message.content === '' && isLoading ? (
                        <div className="flex space-x-2 py-1">
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                          components={{
                            p: ({ children }) => <p className="m-0 mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="my-2 ml-4">{children}</ul>,
                            ol: ({ children }) => <ol className="my-2 ml-4">{children}</ol>,
                            li: ({ children }) => <li className="my-1">{children}</li>,
                            code: ({ inline, children, ...props }: any) =>
                              inline ? (
                                <code className="bg-gray-100 text-primary-600 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono my-2" {...props}>
                                  {children}
                                </code>
                              ),
                            pre: ({ children }) => <div className="my-2">{children}</div>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary-400 pl-4 italic my-2 text-gray-600">
                                {children}
                              </blockquote>
                            ),
                            h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
                            strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            a: ({ children, href }) => (
                              <a href={href} className="text-primary-500 hover:text-primary-600 underline" target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </>
                  )}
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              name="message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta sobre Matemática, Português ou Ciências..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium
                       hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                       transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar
                </>
              )}
            </button>
          </form>
          <p className="text-xs text-center text-gray-500 mt-2">
            ChatEduca - Assistente educacional com tecnologia RAG
          </p>
        </div>
      </footer>
    </div>
  );
}
