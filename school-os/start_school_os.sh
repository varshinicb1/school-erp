#!/usr/bin/env bash
set -e

echo "====================================================================="
echo "               INDIAN SCHOOL OS — TURNKEY LAUNCHER                   "
echo "====================================================================="
echo ""

# Check python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+."
    exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export PYTHONPATH="$DIR/product/school_india:$PYTHONPATH"
mkdir -p "$DIR/data" "$DIR/backups/daily_snapshots" "$DIR/backups/communication_outbox"

echo "[1/2] Initializing Embedded SQLite Database..."
python3 -c "from school_india.database.sqlite_db import initialize_database; initialize_database(); print('[OK] Database initialized successfully.')"

echo "[2/2] Starting School OS Server on port 5050..."
echo "====================================================================="
echo "  School OS is running!"
echo "  Open your browser at: http://localhost:5050"
echo "  Default Admin: admin / admin123"
echo "====================================================================="
echo ""

# Open browser if desktop environment available
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:5050" &
elif command -v open &> /dev/null; then
    open "http://localhost:5050" &
fi

exec python3 scripts/turnkey_server.py 5050
