#!/usr/bin/env bash
echo "=== School OS Healthcheck ==="
docker compose -f infrastructure/docker-compose.yml ps
