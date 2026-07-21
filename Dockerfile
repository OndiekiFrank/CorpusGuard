FROM python:3.11-slim

WORKDIR /app

# Only curl is needed (for the compose healthcheck). The lean runtime deps in
# requirements-api.txt are all manylinux wheels, so no build toolchain is required.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Lean runtime deps only — the API's simulate path does not need the heavy
# ML stack (torch/faiss/sentence-transformers). See requirements-api.txt.
COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

COPY . .
RUN pip install -e . --no-deps

RUN mkdir -p /app/reports /app/config

EXPOSE 8000

CMD ["uvicorn", "corpusguard.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
