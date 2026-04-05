#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "Starting MMSpace containers (frontend + backend + mongodb + ml-service)..."
docker compose up -d --build

echo
echo "MMSpace is up:"
echo "Frontend:   http://localhost:3000"
echo "Backend:    http://localhost:5001/api/health"
echo "ML Service: internal only (container: ml-service:8000)"
echo "MongoDB:    mongodb://admin:password123@localhost:27018/mmspace?authSource=admin"
