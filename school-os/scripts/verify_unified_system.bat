@echo off
echo ===================================================
echo [1/3] Verifying Python package: school_india...
python -c "import school_india; print('school_india version:', school_india.__version__)" || exit /b 1

echo ===================================================
echo [2/3] Executing Master Test Verification Loop (21 Assertions)...
python tests\master_test_loop.py || exit /b 1

echo ===================================================
echo [3/3] Checking Live Backend Server ^& CampusGrid Build...
python -c "import urllib.request; res = urllib.request.urlopen('http://127.0.0.1:5050/api/v1/health'); print('Server Status:', res.read().decode('utf-8'))" || exit /b 1

echo ===================================================
echo [SUCCESS] Unified School OS System is Bundled, Tested and Operational.
