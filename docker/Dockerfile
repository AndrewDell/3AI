# docker/Dockerfile

# Use a slim base image and multi-stage build
FROM python:3.10-slim AS builder

# Install only essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment and activate it
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install pip tools first
RUN pip install --no-cache-dir -U pip wheel setuptools

# Copy and install only production requirements
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Final stage
FROM python:3.10-slim

# Install curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Create necessary directories
RUN mkdir -p /app/src/ui /app/src/core /app/logs && \
    chmod 777 /app/logs

# Copy only the necessary Python files
COPY src/ui/dashboard.py ./src/ui/
COPY src/ui/templates ./src/ui/templates
COPY src/ui/static ./src/ui/static
COPY src/core/config.py ./src/core/
COPY src/core/utils.py ./src/core/
COPY src/core/agent_orchestration.py ./src/core/

# Create __init__.py files for Python packages
RUN touch /app/src/__init__.py /app/src/core/__init__.py /app/src/ui/__init__.py

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    FLASK_APP=src/ui/dashboard.py \
    FLASK_ENV=production \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Add a health check endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000

CMD ["gunicorn", "--worker-class", "eventlet", "--workers", "1", "--bind", "0.0.0.0:5000", "src.ui.dashboard:app"]