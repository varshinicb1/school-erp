@echo off
TITLE Indian School OS — Turnkey Standalone Server
COLOR 0A
cls
echo =====================================================================
echo                INDIAN SCHOOL OS — TURNKEY LAUNCHER                   
echo =====================================================================
echo.
echo [1/3] Verifying Python Environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not added to PATH.
    echo Please install Python 3.10+ from python.org and re-run.
    pause
    exit /b 1
)

echo [2/3] Initializing Embedded SQLite Database and Environment...
set "PYTHONPATH=%~dp0product\school_india;%PYTHONPATH%"
if not exist "%~dp0data" mkdir "%~dp0data"
if not exist "%~dp0backups\daily_snapshots" mkdir "%~dp0backups\daily_snapshots"
if not exist "%~dp0backups\communication_outbox" mkdir "%~dp0backups\communication_outbox"

python -c "from school_india.database.sqlite_db import initialize_database; initialize_database(); print('[OK] Database initialized successfully.')"
if %errorlevel% neq 0 (
    echo [WARN] Installing local editable package...
    pip install -e product\school_india >nul 2>&1
)

echo [3/3] Starting School OS Standalone Server on Port 5050...
echo.
echo =====================================================================
echo   School OS is running!
echo   Open your browser at: http://localhost:5050
echo   Admin Default Credentials:
echo     Username: admin
echo     Password: admin123
echo =====================================================================
echo.

start http://localhost:5050
python scripts\turnkey_server.py 5050
pause
