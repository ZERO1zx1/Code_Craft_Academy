FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=5000

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY run.py .
COPY content ./content
COPY backend ./backend
COPY frontend ./frontend
COPY sandbox ./sandbox
COPY config ./config

EXPOSE 5000

CMD ["python", "run.py"]
