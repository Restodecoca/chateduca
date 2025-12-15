
import logging
import os
from dotenv import load_dotenv
from llama_index.readers.file import PDFReader, PandasExcelReader

load_dotenv()

DATA_DIR = os.getenv("DATA_DIR")
if DATA_DIR is None:
    raise ValueError("DATA_DIR environment variable must be set")


logger = logging.getLogger(__name__)

def get_file_documents():
    from llama_index.core.readers import SimpleDirectoryReader

    try:
        file_extractor = {
            ".pdf": PDFReader(return_full_document = True),
            ".xlsx": PandasExcelReader(concat_rows=False, field_separator="; "),
            }
        reader = SimpleDirectoryReader(
            input_dir=DATA_DIR,
            recursive=True,
            filename_as_id=True,
            raise_on_error=True,
            file_extractor=file_extractor,
        )
        return reader.load_data(show_progress=True)
    except Exception as e:
        import sys
        import traceback

        # Catch the error if the data dir is empty
        # and return as empty document list
        _, _, exc_traceback = sys.exc_info()
        function_name = traceback.extract_tb(exc_traceback)[-1].name
        if function_name == "_add_files":
            logger.warning(
                f"Failed to load file documents, error message: {e} . Return as empty document list."
            )
            return []
        else:
            # Raise the error if it is not the case of empty data dir
            raise e