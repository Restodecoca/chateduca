"""
FastAPI server for the RAG workflow.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from contextlib import asynccontextmanager

from src.workflow import workflow

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Store for sessions (in-memory for development)
sessions: Dict[str, List[Dict[str, str]]] = {}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    chat_history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    response: str
    session_id: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler."""
    logger.info("Starting RAG Workflow Server...")
    logger.info("Workflow loaded successfully")
    yield
    logger.info("Shutting down server...")


app = FastAPI(
    title="ChatEduca API",
    description="API for RAG-based chat using LlamaIndex workflows",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - Frontend React is served by Express on port 3000"""
    return {
        "message": "ChatEduca API - Backend Python",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "frontend_dev": "http://localhost:5173",
        "frontend_prod": "http://localhost:3000",
        "api_express": "http://localhost:3000/api"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint that processes messages using the RAG workflow.
    
    Args:
        request: ChatRequest containing the user message and optional session_id
        
    Returns:
        ChatResponse with the assistant's response
    """
    try:
        session_id = request.session_id or "default"
        
        # Get or create session history
        if session_id not in sessions:
            sessions[session_id] = []
        
        # Add user message to history
        sessions[session_id].append({
            "role": "user",
            "content": request.message
        })
        
        # Run the workflow
        logger.info(f"Processing message for session {session_id}: {request.message[:50]}...")
        
        result = await workflow.run(user_msg=request.message)
        
        # Extract response text
        response_text = str(result)
        
        # Add assistant response to history
        sessions[session_id].append({
            "role": "assistant",
            "content": response_text
        })
        
        logger.info(f"✓ Response generated for session {session_id}")
        
        return ChatResponse(
            response=response_text,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """Get chat history for a session."""
    if session_id not in sessions:
        return {"session_id": session_id, "history": []}
    
    return {
        "session_id": session_id,
        "history": sessions[session_id]
    }


@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear chat history for a session."""
    if session_id in sessions:
        del sessions[session_id]
    
    return {"message": f"Session {session_id} cleared"}


@app.get("/sessions")
async def list_sessions():
    """List all active sessions."""
    return {
        "sessions": list(sessions.keys()),
        "count": len(sessions)
    }


def main():
    """Main entry point for running the server directly."""
    import uvicorn
    uvicorn.run(
        "src.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
