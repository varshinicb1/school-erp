#!/usr/bin/env bash
set -e
echo "=== [1/5] Initializing School-OS Development Environment ==="
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

echo "=== [2/5] Checking Docker daemon ==="
docker info > /dev/null 2>&1 || { echo "Error: Docker daemon is not running."; exit 1; }

echo "=== [3/5] Starting Infrastructure Containers (MariaDB, Redis) ==="
docker compose -f infrastructure/docker-compose.yml up -d mariadb redis-cache redis-queue

echo "=== [4/5] Preparing Site and Database ==="
echo "Waiting for MariaDB..."
until docker compose -f infrastructure/docker-compose.yml exec -T mariadb mysqladmin ping -h localhost -u root -padmin --silent; do
    sleep 2
done

echo "=== [5/5] Environment is Ready ==="
echo "Access points:"
echo "  Frappe Backend: http://school.localhost:8000"
echo "  CampusGrid Frontend: http://localhost:3000"
