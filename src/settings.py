import os

from llama_index.core import Settings
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.callbacks import CallbackManager, LlamaDebugHandler

def init_settings():
    if os.getenv("OPENAI_API_KEY") is None:
        raise RuntimeError("OPENAI_API_KEY is missing in environment variables")
    Settings.llm = OpenAI(model=os.getenv("MODEL") or "gpt-4o-mini")
    
    embedding_dim = int(os.getenv("EMBEDDING_DIM") or "512")
    Settings.embed_model = OpenAIEmbedding(
        model=os.getenv("EMBEDDING_MODEL") or "text-embedding-3-small",
        dimensions=embedding_dim
    )

    Settings.chunk_size = embedding_dim
    Settings.chunk_overlap = 20
    Settings.node_parser = SentenceSplitter()

    #observability
    Settings.callback_manager = CallbackManager([LlamaDebugHandler()])