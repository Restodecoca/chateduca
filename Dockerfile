# Multi-stage Dockerfile para Frontend (Node.js) e Backend (Python)

# ===========================
# Stage 1: Production Image
# ===========================
FROM python:3.12-slim-trixie

# Install Node.js and system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libpq-dev \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9.9 /uv /uvx /bin/

WORKDIR /app

# Copy entire project
COPY . /app

# Install Python dependencies with uv
RUN uv sync --locked

# Setup frontend
WORKDIR /app/.frontend

# Install Node.js dependencies
RUN npm ci

# Copy Prisma schema and generate client
RUN npx prisma generate

# Create logs directory
RUN mkdir -p logs

# Back to app root
WORKDIR /app

# Expose ports
EXPOSE 3000 8000 5173

# Start both services using a simple shell script
CMD sh -c "cd /app && uv run dev & cd /app/.frontend && npm run dev & wait"

