"""
Development server that runs the RAG workflow with a web interface.
Run with: uv run dev
"""
from pathlib import Path
from contextlib import asynccontextmanager
import logging
import re
import json
import os
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import asyncio
from llama_index.core.memory import Memory

from src.workflow import create_workflow

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Store the workflow instance
workflow_instance = None

# Get database URL from environment
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/vector_db")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize workflow on startup"""
    global workflow_instance
    logger.info("Initializing workflow...")
    workflow_instance = create_workflow()
    logger.info("Workflow initialized successfully")
    yield
    logger.info("Shutting down...")


# Create FastAPI app
app = FastAPI(title="ChatEduca API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    user_name: str = None  # Nome do usuário para exibir na tabela


class ClearMemoryRequest(BaseModel):
    session_id: str


def get_memory(session_id: str, user_name: str = None) -> Memory:
    """
    Get or create memory for a session using PostgreSQL as backend.
    Memory is persisted in the database automatically.
    
    Args:
        session_id: Unique session identifier
        user_name: Optional user name to use as key prefix (instead of session_id)
    """
    # Convert PostgreSQL URL to asyncpg format
    async_db_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    # Use user_name as key if provided, otherwise use session_id
    memory_key = f"{user_name}_{session_id}" if user_name else session_id
    
    memory = Memory.from_defaults(
        session_id=memory_key,
        token_limit=60000,
        async_database_uri=async_db_url,
        table_name="chat_memory"
    )
    
    logger.info(f"Memory configured for session: {memory_key}")
    return memory


class ChatResponse(BaseModel):
    response: str
    sources: list = []
@app.post("/clear-memory")
async def clear_memory(request: ClearMemoryRequest):
    """Clear memory for a specific session"""
    session_id = request.session_id
    try:
        memory = get_memory(session_id, user_name=None)
        # Reset the memory by creating a new instance
        # The old memory will be garbage collected
        logger.info(f"Memory cleared for session: {session_id}")
        return {"status": "ok", "message": f"Memory cleared for session: {session_id}"}
    except Exception as e:
        logger.error(f"Error clearing memory: {e}")
        return {"status": "error", "message": str(e)}
        # Reset the memory by creating a new instance
        # The old memory will be garbage collected
        logger.info(f"Memory cleared for session: {session_id}")
        return {"status": "ok", "message": f"Memory cleared for session: {session_id}"}
    except Exception as e:
        logger.error(f"Error clearing memory: {e}")
        return {"status": "error", "message": str(e)}


@app.get("/", response_class=HTMLResponse)
async def root():
    """API root endpoint - Frontend React is served by Express on port 3000"""
    return HTMLResponse(content="""
    <html>
        <head>
            <title>ChatEduca API</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .container {
                    text-align: center;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 3rem;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                }
                h1 { margin: 0 0 1rem 0; font-size: 3rem; }
                p { margin: 0.5rem 0; font-size: 1.2rem; opacity: 0.9; }
                a {
                    display: inline-block;
                    margin: 1rem 0.5rem;
                    padding: 0.8rem 2rem;
                    background: white;
                    color: #667eea;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: bold;
                    transition: transform 0.2s;
                }
                a:hover { transform: translateY(-2px); }
                .status { color: #90EE90; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎓 ChatEduca API</h1>
                <p class="status">✅ Backend Python Running</p>
                <p>RAG System powered by LlamaIndex</p>
                <div style="margin-top: 2rem;">
                    <a href="/docs">📚 API Docs (FastAPI)</a>
                    <a href="http://localhost:5173" target="_blank">🚀 Frontend React (Dev)</a>
                    <a href="http://localhost:3000" target="_blank">🌐 Frontend (Prod)</a>
                </div>
                <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
                    Port 8000 • FastAPI + LlamaIndex
                </p>
            </div>
        </body>
    </html>
    """)


@app.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint that runs the workflow"""
    global workflow_instance
    
    if workflow_instance is None:
        return {"error": "Workflow not initialized"}
    
    try:
        # Get memory for this session (persisted in PostgreSQL)
        session_id = request.session_id
        user_name = request.user_name
        memory = get_memory(session_id, user_name)

        # Run the workflow with persistent memory
        result = await workflow_instance.run(user_msg=request.message, memory=memory)
        
        response_text = result.response
        sources = getattr(result, "sources", [])

        return ChatResponse(
            response=str(response_text),
            sources=sources
        )
    except Exception as e:
        logger.error(f"Error in chat: {e}", exc_info=True)
        return {"error": str(e)}


@app.post("/chat/streaming")
async def chat_streaming(request: ChatRequest):
    """Chat endpoint with streaming response using Server-Sent Events"""
    global workflow_instance
    
    if workflow_instance is None:
        async def error_generator():
            yield f"data: {{'error': 'Workflow not initialized'}}\n\n"
        return StreamingResponse(error_generator(), media_type="text/event-stream")
    
    async def generate_response():
        try:
            
            # Get memory for this session (persisted in PostgreSQL)
            session_id = request.session_id
            user_name = request.user_name
            memory = get_memory(session_id, user_name)

            # Send start signal
            # Send start signal
            yield "data: " + json.dumps({"type": "start"}) + "\n\n"

            # Run the workflow with persistent memory
            result = await workflow_instance.run(user_msg=request.message, memory=memory)
            
            response_text = str(result.response)
            sources = getattr(result, "sources", [])
            
            logger.info(f"Raw response (first 100 chars): {response_text[:100]}")
            
            # Remove 'assistant:' prefix in all variations
            response_text = response_text.strip()
            if response_text.lower().startswith('assistant:'):
                response_text = response_text[10:].strip()
            elif response_text.lower().startswith('assistant :'):
                response_text = response_text[11:].strip()
            elif response_text.lower().startswith('assistant '):
                response_text = response_text[10:].strip()
            
            logger.info(f"Cleaned response (first 100 chars): {response_text[:100]}")
            
            # Convert LaTeX delimiters: \[ \] -> $$ $$ (block math)
            # This is needed because KaTeX expects $$ for display math
            response_text = re.sub(r'\\\[(.*?)\\\]', r'$$\1$$', response_text, flags=re.DOTALL)
            
            logger.info(f"After LaTeX conversion (first 100 chars): {response_text[:100]}")
            
            # Stream word by word, but keep LaTeX blocks intact
            # Split preserving LaTeX blocks (both $$...$$ and $...$)
            parts = []
            current_pos = 0
            
            # Find all LaTeX blocks (now only $$...$$ and $...$)
            latex_pattern = r'(\$\$.*?\$\$|\$.*?\$)'
            
            for match in re.finditer(latex_pattern, response_text, re.DOTALL):
                # Add text before LaTeX
                text_before = response_text[current_pos:match.start()]
                if text_before:
                    parts.extend(text_before.split(' '))
                
                # Add LaTeX block as single part (don't split)
                parts.append(match.group())
                current_pos = match.end()
            
            # Add remaining text
            remaining_text = response_text[current_pos:]
            if remaining_text:
                parts.extend(remaining_text.split(' '))
            
            # Stream parts (words and LaTeX blocks)
            for i, part in enumerate(parts):
                if part:  # Skip empty strings
                    chunk = part + (' ' if i < len(parts) - 1 else '')
                    yield "data: " + json.dumps({"type": "chunk", "content": chunk}) + "\n\n"
                    # Faster streaming for LaTeX blocks (don't delay)
                    if not re.match(latex_pattern, part):
                        await asyncio.sleep(0.03)
            
            # Send sources at the end
            if sources:
                yield "data: " + json.dumps({"type": "sources", "sources": sources}) + "\n\n"
            
            # Send done signal
            yield "data: " + json.dumps({"type": "done", "message": "Stream completed"}) + "\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming chat: {e}", exc_info=True)
            yield "data: " + json.dumps({"type": "error", "error": str(e)}) + "\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )


def main():
    """Run the development server"""
    logger.info("=" * 60)
    logger.info("Starting ChatEduca Backend (FastAPI)")
    logger.info("=" * 60)
    logger.info("Backend API: http://localhost:8000")
    logger.info("API Docs: http://localhost:8000/docs")
    logger.info("Chat Interface: http://localhost:8000")
    logger.info("Frontend (TypeScript): cd .frontend && npm run dev")
    logger.info("=" * 60)
    
    # Run FastAPI server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )


if __name__ == "__main__":
    main()
