/**
 * Servidor principal da aplicação
 * Inicializa Express, middlewares, rotas e documentação Scalar
 * Em produção, serve os arquivos do React
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { env } from './utils/env';
import { logInfo, logError } from './utils/logger';
import { loggingMiddleware, errorMiddleware } from './middleware';
import routes from './routes';
import { setupScalar } from './scalar/config';
import { disconnectDatabase } from './lib/prisma';

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupScalar(); // Scalar antes das rotas
    this.setupRoutes();
    this.setupStaticFiles(); // Servir React em produção
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // CORS
    this.app.use(
      cors({
        origin: env.CORS_ORIGIN.split(','),
        credentials: true,
      })
    );

    // Segurança - Configuração especial para Scalar funcionar
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // Desabilita CSP para Scalar funcionar
        crossOriginEmbedderPolicy: false,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      message: 'Muitas requisições deste IP, tente novamente mais tarde',
    });
    this.app.use(limiter);

    // Body parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    this.app.use(loggingMiddleware);
  }

  private setupScalar(): void {
    // Scalar API Documentation
    setupScalar(this.app);
    logInfo('📚 Scalar API Reference configurado em /docs');
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api', routes);

    logInfo('�?Rotas da API configuradas');
  }

  private setupStaticFiles(): void {
    // Em produção, servir arquivos estáticos do React
    if (env.NODE_ENV === 'production') {
      const clientBuildPath = path.join(__dirname, '../../dist/client');
      
      this.app.use(express.static(clientBuildPath));

      // Todas as rotas não-API servem o index.html (SPA)
      this.app.get('*', (req: Request, res: Response) => {
        // Não sobrescrever rotas da API, Scalar e health
        if (req.path.startsWith('/api') || req.path.startsWith('/docs') || req.path.startsWith('/health')) {
          return;
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      });

      logInfo('📦 Servindo arquivos estáticos do React');
    } else {
      logInfo('🔧 Modo desenvolvimento - Vite servindo o frontend na porta 5173');
    }
  }

  private setupErrorHandling(): void {
    // Error middleware deve ser o último
    this.app.use(errorMiddleware);
  }

  public async start(): Promise<void> {
    const PORT = env.PORT || 3000;
    const HOST = env.HOST || '0.0.0.0';

    this.app.listen(PORT, HOST, () => {
      logInfo(`
╔════════════════════════════════════════════════════════════╗
�?                                                           �?
�?  🚀 ChatEduca - Frontend API Server                      �?
�?                                                           �?
�?  📍 URL: http://${HOST}:${PORT}                            �?
�?  📚 Docs (Scalar): http://${HOST}:${PORT}/docs             �?
�?  🏥 Health: http://${HOST}:${PORT}/health                  �?
�?  🌍 Ambiente: ${env.NODE_ENV}                               �?
�?                                                           �?
�?  Frontend React (Dev): http://localhost:5173             �?
�?  Backend Python (RAG): http://localhost:8000             �?
�?                                                           �?
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logInfo('🛑 SIGTERM recebido. Encerrando servidor...');
      await disconnectDatabase();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logInfo('🛑 SIGINT recebido. Encerrando servidor...');
      await disconnectDatabase();
      process.exit(0);
    });
  }
}

// Inicializar servidor
const server = new Server();
server.start().catch((error) => {
  logError('�?Erro ao iniciar servidor:', error);
  process.exit(1);
});
