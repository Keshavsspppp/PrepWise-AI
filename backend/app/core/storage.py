import os
import logging

logger = logging.getLogger(__name__)

class StorageBackend:
    def save_file(self, contents: bytes, filename: str) -> str:
        """Save file contents and return the saved filepath/URI."""
        raise NotImplementedError()

    def delete_file(self, filepath: str) -> bool:
        """Delete a file from storage and return True if successful."""
        raise NotImplementedError()

class LocalDiskStorage(StorageBackend):
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, contents: bytes, filename: str) -> str:
        filepath = os.path.join(self.upload_dir, filename)
        try:
            with open(filepath, "wb") as f:
                f.write(contents)
            logger.info(f"Storage: Successfully saved {filename} to local disk at {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Storage: Failed to save file {filename}: {e}")
            raise IOError(f"Failed to write file to local disk: {e}")

    def delete_file(self, filepath: str) -> bool:
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                logger.info(f"Storage: Deleted file {filepath}")
                return True
            except Exception as e:
                logger.error(f"Storage: Failed to delete file {filepath}: {e}")
                return False
        return False

# Initialize the default storage backend
storage_backend = LocalDiskStorage()
