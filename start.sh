#!/usr/bin/env bash
echo "Starting Indian School OS on Render..."
export PYTHONPATH="$(pwd)/school-os/product/school_india:$PYTHONPATH"
python school-os/scripts/turnkey_server.py
