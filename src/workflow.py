import os
from dotenv import load_dotenv
import logging

logging.basicConfig(
    level=logging.INFO,  # ou DEBUG se quiser mais detalhes
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)
logger.info("Logger inicializado com sucesso.")

from llama_index.core.agent.workflow import AgentWorkflow
from llama_index.core.settings import Settings

from src.index import get_index
from src.query import get_query_engine_tool
from src.settings import init_settings


def create_workflow() -> AgentWorkflow:
    load_dotenv()
    init_settings()
    index = get_index()
    if index is None:
        raise RuntimeError(
            "Index not found! Please run `uv run generate` to index the data first."
        )

    query_tool = get_query_engine_tool(index=index)
    # Define the system prompt for the agent
    # Append the citation system prompt to the system prompt
    system_prompt = os.getenv("SYSTEM_PROMPT")

    return AgentWorkflow.from_tools_or_functions(
        tools_or_functions=[query_tool],
        llm=Settings.llm,
        system_prompt=system_prompt,
    )