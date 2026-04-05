# Deploy Files

This folder contains deployment assets for Render single-service mode:

- `Dockerfile.render`: combined image for Node server + ML service
- `supervisord.render.conf`: starts both processes in one container

Notes:
- Keep `render.yaml` at repository root so Render detects blueprint config.
- Keep `.dockerignore` at repository root because Docker build context is the repo root.
