import os
from src.paradedb import ParadeDBVectorStore
from dotenv import load_dotenv
from sqlalchemy import make_url

def get_vector_store(table_name: str = "pgvector_boletins") -> ParadeDBVectorStore:
    """
    Cria e retorna uma nova instância de PGVectorStore usando os parâmetros fornecidos.
    
    Args:
        table_name (str): Nome da tabela no banco de dados Postgres.
        schema (str): Nome do esquema (schema) no banco de dados.

    Returns:
        PGVectorStore: Nova instância configurada do vector store.
    """
    load_dotenv()

    host = os.getenv("DB_HOST")
    port = os.getenv("DB_PORT")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_DATABASE")

    connection_string = f"postgresql://{user}:{password}@{host}:{port}"
    db_name = database

    url = make_url(connection_string)

    return ParadeDBVectorStore.from_params(
        database=db_name,
        host=url.host,
        password=url.password,
        port=url.port,
        user=url.username,
        table_name=table_name,
        text_search_config="portuguese",
        schema_name="paradedb",
        hybrid_search=True,
        use_bm25=True,
        embed_dim=int(os.getenv("EMBEDDING_DIM")),
        hnsw_kwargs={
            "hnsw_m": 16,
            "hnsw_ef_construction": 64,
            "hnsw_ef_search": 40,
            "hnsw_dist_method": "vector_cosine_ops",
        },
    )