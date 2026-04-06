FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi \
    sqlmodel \
    psycopg2-binary \
    python-jose[cryptography] \
    passlib \
    pydantic-settings \
    uvicorn[standard] \
    httpx \
    python-multipart \
    email-validator

COPY . /app

EXPOSE 10000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "10000"]
