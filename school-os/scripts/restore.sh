#!/usr/bin/env bash
set -e
if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <path_to_sql_file>"
    exit 1
fi
echo "Restoring database from $1..."
docker compose -f infrastructure/docker-compose.yml exec -T mariadb mysql -u root -padmin < "$1"
echo "Database restore completed successfully."
