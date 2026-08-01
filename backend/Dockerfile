FROM python:3.11-slim

# libmagic1 backs python-magic, which validates uploaded PDF content types.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    # fastembed caches the ONNX model here; keep it on a path the app user owns.
    FASTEMBED_CACHE_PATH=/home/app/.cache/fastembed \
    HF_HOME=/home/app/.cache/huggingface

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app

# Run unprivileged. Uploaded PDFs are the only thing written to disk; vectors now live
# in MongoDB, so no volume is needed for search to survive a restart.
RUN useradd --create-home --uid 1000 app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app /home/app
USER app

# Bake the embedding model into the image so the first upload does not pay a download,
# and so a cold start on a free instance is not slowed by fetching weights.
RUN python -c "from fastembed import TextEmbedding; \
TextEmbedding(model_name='sentence-transformers/all-MiniLM-L6-v2')"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://localhost:8000/ || exit 1

# Hosts like Render inject the port to listen on; default to 8000 for local Compose.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
