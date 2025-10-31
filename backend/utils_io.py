"""I/O utility functions for the backend."""

import os
import json
from datetime import datetime
from typing import Dict, Union, Optional

def ensure_data_dir(data_dir: str) -> None:
    """Create data directory if it doesn't exist."""
    if not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)

def sanitize_filename(name: str) -> str:
    """Convert a string into a safe filename."""
    # Remove or replace unsafe characters
    safe = "".join(ch for ch in name if ch.isalnum() or ch in ("-", "_", "."))
    return safe or "output"

def atomic_write(content: str, filepath: str) -> None:
    """Write content to file atomically using a temporary file."""
    temp_path = filepath + ".tmp"
    try:
        # Write to temp file
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(content)
        # Atomic rename
        os.replace(temp_path, filepath)
    except Exception as e:
        # Clean up temp file if it exists
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        raise e

def save_jsonl(data: Dict, filepath: str, mode: str = "a") -> None:
    """Append or write a JSON line to a file."""
    try:
        with open(filepath, mode, encoding="utf-8") as f:
            f.write(json.dumps(data, ensure_ascii=False) + "\n")
    except Exception as e:
        raise Exception(f"Failed to save JSONL: {str(e)}")

def read_text_file(filepath: str, encoding: str = "utf-8") -> str:
    """Read text file with error handling."""
    try:
        with open(filepath, "r", encoding=encoding) as f:
            return f.read()
    except Exception as e:
        raise Exception(f"Failed to read file: {str(e)}")

def list_data_files(data_dir: str, extensions: Optional[tuple] = None) -> list:
    """List files in data directory with optional extension filtering."""
    files = []
    try:
        for fname in os.listdir(data_dir):
            if os.path.isfile(os.path.join(data_dir, fname)):
                if extensions is None or fname.lower().endswith(extensions):
                    files.append(fname)
    except Exception:
        pass
    return files

def count_jsonl_lines(filepath: str) -> int:
    """Count lines in a JSONL file."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return sum(1 for _ in f)
    except Exception:
        return 0
