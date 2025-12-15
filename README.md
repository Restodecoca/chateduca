# ChatEduca

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Latest-2496ED?logo=docker&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-06B6D4?logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?logo=prisma&logoColor=white)
![LlamaIndex](https://img.shields.io/badge/LlamaIndex-Latest-000000?logo=llama&logoColor=white)

Sistema de assistente educacional com RAG (Retrieval-Augmented Generation).

</div>

## Stack

**Frontend**: React 18 + TypeScript + Tailwind CSS + React Router v7  
**Backend API**: Express + Prisma + PostgreSQL  
**Backend RAG**: FastAPI + LlamaIndex + OpenAI  
**Database**: ParadeDB (PostgreSQL com extensões para busca vetorial)  
**Deployment**: Docker + Docker Compose

## Requisitos

- Docker e Docker Compose, ou
- Node.js 18+
- Python 3.12+
- PostgreSQL 16+

## Instalação Rápida (Docker)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd chateduca

# 2. Configure as variáveis de ambiente
cp .env.example .env
cp .frontend/.env.example .frontend/.env

# 3. Edite .env e adicione sua OPENAI_API_KEY

# 4. Inicie os containers
docker compose up -d

# 5. Gere os índices RAG
docker compose exec app uv run generate
```

Acesse:
- Frontend: http://localhost:5173
- API Express: http://localhost:3000
- Backend Python: http://localhost:8000
- Docs API: http://localhost:3000/docs

## Instalação Manual

### Backend Python (RAG)

```bash
# Instale uv se não tiver
curl -LsSf https://astral.sh/uv/install.sh | sh

# Instale dependências
uv sync --locked

# Configure .env na raiz
cp .env.example .env

# Gere os índices de embeddings
uv run generate

# Inicie o servidor FastAPI
uv run dev
```

Servidor rodando em http://localhost:8000

### Frontend TypeScript

```bash
cd .frontend

# Instale dependências
npm ci

# Configure .env
cp .env.example .env

# Gere Prisma Client
npx prisma generate

# Execute migrações
npx prisma migrate deploy

# Inicie desenvolvimento (React + Express)
npm run dev
```

Servidores rodando em:
- React (Vite): http://localhost:5173
- Express API: http://localhost:3000

## Comandos Principais

### Backend Python

```bash
uv run dev              # Inicia FastAPI em modo desenvolvimento
uv run generate         # Gera índices de embeddings
uv sync --locked        # Instala/atualiza dependências Python
```

### Frontend TypeScript

```bash
npm run dev             # Inicia React (Vite) + Express
npm run dev:client      # Apenas React (Vite)
npm run dev:server      # Apenas Express API
npm run build           # Build para produção
npm start               # Inicia servidor de produção
```

### Prisma (ORM)

```bash
npx prisma generate                    # Gera Prisma Client
npx prisma migrate dev                 # Cria e aplica migração
npx prisma migrate deploy              # Aplica migrações (produção)
npx prisma studio                      # Interface visual do banco
npx prisma db seed                     # Popula banco com dados iniciais
```

### Docker

```bash
docker compose up -d                   # Inicia todos os serviços
docker compose down                    # Para todos os serviços
docker compose logs -f app             # Logs do container app
docker compose exec app bash           # Acessa shell do container
docker compose up --build              # Rebuild e inicia
```

## Estrutura do Projeto

```
chateduca/
├── .frontend/                 # Frontend React + Backend Express
│   ├── src/
│   │   ├── client/           # React (Vite)
│   │   ├── server/           # Express API
│   │   └── types/            # TypeScript types
│   ├── prisma/               # Schema e migrações
│   └── package.json
│
├── src/                      # Backend Python (RAG)
│   ├── server.py            # FastAPI server
│   ├── workflow.py          # LlamaIndex RAG workflow
│   ├── generate.py          # Gerador de índices
│   └── settings.py          # Configurações
│
├── ui/                       # HTML/CSS/JS estáticos
├── docker-compose.yml        # Orquestração Docker
├── Dockerfile                # Multi-stage build
└── pyproject.toml            # Dependências Python
```

## Variáveis de Ambiente

### Raiz (.env)

```env
OPENAI_API_KEY=sk-...
MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vector_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=vector_db
```

### Frontend (.frontend/.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vector_db
VITE_API_URL=/api
BACKEND_URL=http://localhost:8000
PORT=3000
NODE_ENV=development
```

## Endpoints API

### Autenticação (Express)

```
POST   /api/auth/register     # Criar conta
POST   /api/auth/login        # Login
GET    /api/auth/me           # Perfil do usuário
POST   /api/auth/refresh      # Renovar token
```

### Chat (FastAPI)

```
POST   /chat                  # Enviar mensagem ao RAG
GET    /docs                  # Documentação Swagger
```

### Sistema (Express)

```
GET    /api/system/status     # Status do sistema
GET    /docs                  # Documentação Scalar
```

## Workflow RAG

O sistema usa LlamaIndex para implementar RAG:

1. Documentos são indexados com `uv run generate`
2. Embeddings são armazenados em `src/storage/`
3. Queries do usuário buscam contexto relevante
4. LLM gera resposta baseada no contexto recuperado

## Desenvolvimento

### Hot Reload

Ambos os servidores têm hot reload:
- **React (Vite)**: Recarrega automaticamente ao editar `src/client/`
- **Express**: Nodemon reinicia ao editar `src/server/`
- **FastAPI**: Uvicorn reinicia ao editar `src/`

### Database Migrations

```bash
# Criar nova migração
cd .frontend
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações pendentes
npx prisma migrate deploy

# Resetar banco (desenvolvimento)
npx prisma migrate reset
```

## Troubleshooting

### Porta em uso

```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process
```

### Rebuild completo Docker

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Erro no Prisma Client

```bash
cd .frontend
npx prisma generate
```

## Licença

MIT