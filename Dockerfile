FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN pip install -e .

RUN mkdir -p /app/reports /app/config

EXPOSE 8000

CMD ["uvicorn", "corpusguard.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
