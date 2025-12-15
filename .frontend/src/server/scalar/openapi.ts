/**
 * Especificação OpenAPI para documentação Scalar
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'ChatEduca Frontend API',
    version: '1.0.0',
    description: 'API frontend TypeScript para integração com ChatEduca FastAPI backend',
    contact: {
      name: 'Suporte',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desenvolvimento',
    },
    {
      url: 'http://localhost:8000',
      description: 'Backend FastAPI (../src/dev.py)',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Registrar novo usuário',
        description: 'Cria uma nova conta de usuário',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'usuario@example.com' },
                  password: { type: 'string', format: 'password', example: 'senha123' },
                  name: { type: 'string', example: 'João Silva' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Usuário criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['user', 'admin'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Autenticar usuário',
        description: 'Autentica usuário e retorna token JWT',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'usuario@example.com' },
                  password: { type: 'string', format: 'password', example: 'senha123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login bem-sucedido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                      },
                    },
                    expiresIn: { type: 'string', example: '24h' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Obter perfil do usuário',
        description: 'Retorna informações do usuário autenticado',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Perfil do usuário',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        role: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Renovar token JWT',
        description: 'Gera um novo token JWT',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Token renovado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    expiresIn: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'Listar usuários',
        description: 'Lista todos os usuários (apenas admin)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de usuários',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                          role: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Buscar usuário por ID',
        description: 'Retorna dados de um usuário específico',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Dados do usuário' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      put: {
        summary: 'Atualizar usuário',
        description: 'Atualiza dados de um usuário',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Usuário atualizado' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
      delete: {
        summary: 'Excluir usuário',
        description: 'Remove um usuário (apenas admin)',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Usuário excluído' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/chat': {
      post: {
        summary: 'Enviar mensagem ao chatbot',
        description: 'Envia uma mensagem para o backend FastAPI e retorna a resposta do RAG',
        tags: ['Chat'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: {
                    type: 'string',
                    description: 'Mensagem do usuário',
                    example: 'Explique os conceitos de RAG',
                  },
                  session_id: {
                    type: 'string',
                    description: 'ID da sessão (opcional, será gerado se não fornecido)',
                    example: 'session-12345',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Resposta bem-sucedida',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        response: { type: 'string', example: 'RAG significa Retrieval-Augmented Generation...' },
                        sources: { 
                          type: 'array', 
                          items: { type: 'string' },
                          example: ['documento1.pdf', 'documento2.pdf'],
                        },
                        session_id: { type: 'string', example: 'session-12345' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
          '502': { $ref: '#/components/responses/BackendError' },
        },
      },
    },
    '/chat/streaming': {
      post: {
        summary: 'Chat com streaming',
        description: 'Envia mensagem e recebe resposta em tempo real (Server-Sent Events)',
        tags: ['Chat'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Explique sobre educação' },
                  session_id: { type: 'string', example: 'session-123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Stream de resposta',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
          '502': { $ref: '#/components/responses/BackendError' },
        },
      },
    },
    '/chat/history': {
      get: {
        summary: 'Histórico de chat',
        description: 'Retorna histórico de mensagens do usuário',
        tags: ['Chat'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'session_id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filtrar por sessão específica',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
          },
        ],
        responses: {
          '200': {
            description: 'Histórico de mensagens',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        messages: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              role: { type: 'string', enum: ['user', 'assistant'] },
                              content: { type: 'string' },
                              sources: { type: 'array', items: { type: 'string' } },
                              createdAt: { type: 'string', format: 'date-time' },
                            },
                          },
                        },
                        pagination: {
                          type: 'object',
                          properties: {
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            total: { type: 'integer' },
                            totalPages: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/chat/clear': {
      delete: {
        summary: 'Limpar histórico de sessão',
        description: 'Remove o histórico de memória de uma sessão específica',
        tags: ['Chat'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['session_id'],
                properties: {
                  session_id: {
                    type: 'string',
                    description: 'ID da sessão a ser limpa',
                    example: 'session-12345',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Memória limpa com sucesso',
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/chat/health': {
      get: {
        summary: 'Verificar status do backend',
        description: 'Verifica se o backend FastAPI está respondendo',
        tags: ['Chat'],
        responses: {
          '200': {
            description: 'Backend está saudável',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        message: { type: 'string', example: 'ChatEduca API is running' },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalError' },
          '502': { $ref: '#/components/responses/BackendError' },
        },
      },
    },
    '/system/status': {
      get: {
        summary: 'Status do sistema',
        description: 'Retorna informações sobre o status e saúde do sistema (apenas admin)',
        tags: ['System'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Status do sistema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'healthy' },
                        uptime: { type: 'number', example: 3600, description: 'Tempo de atividade em segundos' },
                        version: { type: 'string', example: '1.0.0' },
                        environment: { type: 'string', example: 'development' },
                        database: {
                          type: 'object',
                          properties: {
                            connected: { type: 'boolean', example: true },
                            latency: { type: 'number', example: 5, description: 'Latência em ms' },
                          },
                        },
                        backend: {
                          type: 'object',
                          properties: {
                            connected: { type: 'boolean', example: true },
                            url: { type: 'string', example: 'http://localhost:8000' },
                          },
                        },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/system/config': {
      get: {
        summary: 'Configuração do sistema',
        description: 'Retorna configuração do sistema (apenas admin)',
        tags: ['System'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Configuração do sistema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        app: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', example: 'ChatEduca' },
                            version: { type: 'string', example: '1.0.0' },
                            environment: { type: 'string', example: 'development' },
                          },
                        },
                        features: {
                          type: 'object',
                          properties: {
                            chatStreaming: { type: 'boolean', example: true },
                            authentication: { type: 'boolean', example: true },
                            adminPanel: { type: 'boolean', example: true },
                          },
                        },
                        limits: {
                          type: 'object',
                          properties: {
                            maxMessageLength: { type: 'integer', example: 5000 },
                            maxHistoryMessages: { type: 'integer', example: 1000 },
                            sessionTimeout: { type: 'integer', example: 3600, description: 'Timeout em segundos' },
                          },
                        },
                        backend: {
                          type: 'object',
                          properties: {
                            url: { type: 'string', example: 'http://localhost:8000' },
                            timeout: { type: 'integer', example: 30000, description: 'Timeout em ms' },
                          },
                        },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/admin/stats': {
      get: {
        summary: 'Estatísticas do sistema',
        description: 'Retorna estatísticas gerais do sistema (apenas admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Estatísticas do sistema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totals: {
                      type: 'object',
                      properties: {
                        users: { type: 'integer' },
                        sessions: { type: 'integer' },
                        messages: { type: 'integer' },
                        logs: { type: 'integer' },
                      },
                    },
                    recent: {
                      type: 'object',
                      properties: {
                        usersLast7Days: { type: 'integer' },
                        sessionsLast24Hours: { type: 'integer' },
                      },
                    },
                    logs: {
                      type: 'object',
                      properties: {
                        byLevel: {
                          type: 'object',
                          additionalProperties: { type: 'integer' },
                        },
                      },
                    },
                    activeUsers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          email: { type: 'string' },
                          messageCount: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
    '/admin/logs': {
      get: {
        summary: 'Logs do sistema',
        description: 'Retorna logs do sistema (apenas admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'level',
            in: 'query',
            schema: { type: 'string', enum: ['info', 'warn', 'error', 'debug'] },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
          },
        ],
        responses: {
          '200': {
            description: 'Logs do sistema',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          level: { type: 'string' },
                          message: { type: 'string' },
                          userId: { type: 'string' },
                          requestId: { type: 'string' },
                          metadata: { type: 'object' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalError' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Dados inválidos' },
              details: { type: 'object', nullable: true },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ValidationError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'VALIDATION_ERROR' },
                  message: { type: 'string', example: 'Dados inválidos' },
                },
              },
            },
          },
        ],
      },
      AuthenticationError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'AUTHENTICATION_ERROR' },
                  message: { type: 'string', example: 'Não autenticado' },
                },
              },
            },
          },
        ],
      },
      AuthorizationError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'AUTHORIZATION_ERROR' },
                  message: { type: 'string', example: 'Sem permissão' },
                },
              },
            },
          },
        ],
      },
      NotFoundError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'NOT_FOUND' },
                  message: { type: 'string', example: 'Recurso não encontrado' },
                },
              },
            },
          },
        ],
      },
      ConflictError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'CONFLICT_ERROR' },
                  message: { type: 'string', example: 'Recurso já existe' },
                },
              },
            },
          },
        ],
      },
      InternalError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'INTERNAL_ERROR' },
                  message: { type: 'string', example: 'Erro interno do servidor' },
                },
              },
            },
          },
        ],
      },
      BackendError: {
        allOf: [
          { $ref: '#/components/schemas/Error' },
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'BACKEND_ERROR' },
                  message: { type: 'string', example: 'Erro ao comunicar com o backend' },
                },
              },
            },
          },
        ],
      },
    },
    responses: {
      BadRequest: {
        description: 'Dados inválidos ou requisição malformada',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' },
          },
        },
      },
      Unauthorized: {
        description: 'Não autenticado - Token ausente ou inválido',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AuthenticationError' },
          },
        },
      },
      Forbidden: {
        description: 'Acesso negado - Sem permissão para este recurso',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AuthorizationError' },
          },
        },
      },
      NotFound: {
        description: 'Recurso não encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/NotFoundError' },
          },
        },
      },
      Conflict: {
        description: 'Conflito - Recurso já existe ou está em uso',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ConflictError' },
          },
        },
      },
      InternalError: {
        description: 'Erro interno do servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/InternalError' },
          },
        },
      },
      BackendError: {
        description: 'Erro ao comunicar com o backend FastAPI',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/BackendError' },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Auth',
      description: 'Autenticação e gerenciamento de sessão',
    },
    {
      name: 'Users',
      description: 'Gerenciamento de usuários',
    },
    {
      name: 'Chat',
      description: 'Operações relacionadas ao chatbot RAG',
    },
    {
      name: 'Admin',
      description: 'Operações administrativas (requer role admin)',
    },
    {
      name: 'System',
      description: 'Informações e configurações do sistema (requer role admin)',
    },
  ],
};
