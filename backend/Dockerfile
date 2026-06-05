FROM python:3.10-slim

# Cleaner container behavior: unbuffered logs, no .pyc files, no pip cache.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# No system build toolchain needed: every pinned dependency ships a prebuilt
# manylinux/arm64 wheel, and psycopg2-binary bundles libpq.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN DJANGO_SECRET_KEY=build-placeholder python manage.py collectstatic --noinput

EXPOSE 8000
