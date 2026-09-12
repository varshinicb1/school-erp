#!/usr/bin/env bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
echo "Backing up MariaDB database to $BACKUP_DIR..."
docker compose -f infrastructure/docker-compose.yml exec -T mariadb mysqldump -u root -padmin --all-databases > "$BACKUP_DIR/full_backup.sql"
echo "Backup complete: $BACKUP_DIR/full_backup.sql"
