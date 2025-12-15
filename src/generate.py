import os
import logging

from llama_index.core.ingestion import DocstoreStrategy, IngestionPipeline
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.settings import Settings
from llama_index.core.storage import StorageContext
from llama_index.core.storage.docstore import SimpleDocumentStore
from dotenv import load_dotenv

from src.utils.loaders import get_file_documents
from src.vectordb import get_vector_store
from src.settings import init_settings

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

STORAGE_DIR = os.getenv("STORAGE_DIR", "storage")

def get_doc_store():
    # If the storage directory is there, load the document store from it.
    # If not, set up an in-memory document store since we can't load from a directory that doesn't exist.

    docstore_path = os.path.join(STORAGE_DIR, "docstore.json")
    os.makedirs(STORAGE_DIR, exist_ok=True)

    if os.path.exists(docstore_path):
        logger.info("Found existing docstore.json. Loading persisted document store.")
        return SimpleDocumentStore.from_persist_path(docstore_path)
    logger.info("No existing docstore found. Creating a new one...")
    return SimpleDocumentStore()


def run_pipeline(docstore, vector_store, documents):

    pipeline = IngestionPipeline(
        transformations=[
            SentenceSplitter(
                chunk_size=Settings.chunk_size,
                chunk_overlap=Settings.chunk_overlap,
                ),
            Settings.embed_model,
            ],
        docstore=docstore,
        docstore_strategy=DocstoreStrategy.UPSERTS_AND_DELETE,  # type: ignore
        vector_store=vector_store,
    )

    # Run the ingestion pipeline and store the results
    nodes = pipeline.run(show_progress=True, documents=documents)

    return nodes


def persist_storage(docstore, vector_store):
    storage_context = StorageContext.from_defaults(
        docstore=docstore,
        vector_store=vector_store,
    )
    storage_context.persist(STORAGE_DIR)


def generate_index():
    init_settings()
    logger.info("Generate index for the provided data")

    # Get the stores and documents or create new ones
    documents = get_file_documents()
    docstore = get_doc_store()
    vector_store = get_vector_store()

    # Run the ingestion pipeline
    _ = run_pipeline(docstore, vector_store, documents)

    persist_storage(docstore, vector_store)

    logger.info("Finished generating the index")


if __name__ == "__main__":
    generate_index()