# ==============================================================================
# Multi-Stage Dockerfile for Indian School OS (CampusGrid + School OS Engine)
# Optimized for Render.com, Railway, Fly.io, and Local Containerization
# ==============================================================================

# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY campusgrid/package*.json ./
RUN npm install

COPY campusgrid ./
RUN npm run build

# --- Stage 2: Runtime Environment with Python ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends     curl     && rm -rf /var/lib/apt/lists/*

# Copy backend codebase
COPY school-os /app/school-os

# Copy compiled frontend from Stage 1 into the backend static folder
COPY --from=frontend-builder /build/dist /app/school-os/campusgrid_dist

# Install local python package
RUN pip install --no-cache-dir -e /app/school-os/product/school_india

# Initialize necessary data & backup folders
RUN mkdir -p /app/school-os/data              /app/school-os/backups/daily_snapshots              /app/school-os/backups/communication_outbox

# Default port for Render (Render dynamically provides PORT via env var)
ENV PORT=5050
ENV PYTHONUNBUFFERED=1
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3   CMD curl -f http://localhost:${PORT}/api/v1/health || exit 1

# Start the unified turnkey server
CMD ["python", "school-os/scripts/turnkey_server.py"]
