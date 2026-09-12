#!/usr/bin/env bash
set -e
echo "Building Indian School OS for Render Native..."
pip install -e school-os/product/school_india
cd campusgrid
npm install
npm run build
cd ..
mkdir -p school-os/data school-os/backups/daily_snapshots school-os/backups/communication_outbox
cp -r campusgrid/dist school-os/campusgrid_dist
echo "Build complete."
