/**
 * Configuração do Scalar para documentação interativa da API
 */

import { Application } from 'express';

export const setupScalar = (app: Application): void => {
  // Carrega dinamicamente o módulo ESM em tempo de execução para evitar
  // erros de "require() of ES Module" quando o pacote é ESM-only.
  (async () => {
    try {
      const scalarModule = await import('@scalar/express-api-reference');
      const apiReference = (scalarModule as any).apiReference || (scalarModule as any).default || scalarModule;

      app.use(
        '/docs',
        apiReference({
          spec: {
            url: '/openapi.json',
          },
          theme: 'purple',
          layout: 'modern',
          defaultHttpClient: {
            targetKey: 'javascript',
            clientKey: 'fetch',
          },
        })
      );
    } catch (error) {
      console.error('�?Erro ao configurar Scalar:', error);
    }
  })();
};
