#!/usr/bin/env bash
set -e
echo "=== Resetting Development Environment ==="
docker compose -f infrastructure/docker-compose.yml down -v
rm -rf frappe-bench/sites/*
echo "Cleaned containers, volumes, and temporary site data."
