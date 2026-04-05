# MMSpace

MMSpace is a mentor-mentee management platform for institutes and training programs. It combines role-based workflows (admin, mentor, mentee, guardian), real-time communication, attendance and leave tracking, grievance handling, and an AI-powered placement predictor.

## Navigation

- [What This Repository Contains](#what-this-repository-contains)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Seeding Demo Data](#seeding-demo-data)
- [Important Functional Flows](#important-functional-flows)
- [Health and Debugging](#health-and-debugging)
- [Deployment (Production)](#deployment-production)
- [Docker (Local Alternative)](#docker-local-alternative)
- [Known Issues and Backlog](#known-issues-and-backlog)
- [Testing Checklist](#testing-checklist)
- [Contributing](#contributing)

## What This Repository Contains

- React + Vite frontend (`client`)
- Node.js + Express backend (`server`)
- Python FastAPI ML microservice (`ml_service`) for placement prediction
- MongoDB data layer
- Socket.IO real-time messaging and notifications

## Core Features

### User and Access Management
- Role-based authentication and authorization
- Admin user management (enable/disable, update, delete)
- Mentor-mentee assignment management by admin
- Mentor profile editing (email, phone, qualifications, citations/publications)

### Communication
- Real-time chat using Socket.IO
- Group messaging with proper mentee delivery
- Individual mentor-mentee chat
- Announcement feed with comment support

### Academic and Operations
- Attendance tracking and attendance management views
- Leave request workflow (submit, review, approve/reject)
- Grievance workflow (submit, review, resolve/reject)
- Admin analytics dashboard and system overview

### Data Operations
- CSV bulk upload for student onboarding
- CSV validation, create/update behavior, and failure reporting

### AI Placement Predictor
- Dedicated FastAPI microservice for inference
- TensorFlow/Keras ANN model + scaler metadata
- Node backend proxy endpoint: `POST /api/placement/predict`
- Frontend predictor UI with result insights

## Architecture

### Web Application
- Frontend talks to Node backend API
- Node backend handles auth, business logic, and DB operations
- Socket.IO provides real-time events for chat/notifications

### ML Integration
- Node backend forwards placement requests to ML service (`ML_SERVICE_URL`)
- ML service loads model artifacts at startup:
  - `ml_service/models/placement_ann.keras`
  - `ml_service/models/scaler.pkl`

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express, Mongoose, JWT, Socket.IO
- ML Service: FastAPI, Uvicorn, TensorFlow/Keras, scikit-learn, pandas, NumPy, mRMR
- Database: MongoDB (local or Atlas)
- Deployment: Render (server), Vercel (client)

## Repository Structure

```text
MMSpace/
  client/                  # React frontend
  server/                  # Express backend
  ml_service/              # FastAPI ML microservice
    models/                # placement_ann.keras, scaler.pkl
  dataset/                 # source/synthetic ML data
  render.yaml              # Render blueprint config
```

## Prerequisites

- Node.js 18+
- npm 8+
- Python 3.10+ (recommended for TensorFlow compatibility)
- MongoDB (Atlas or local)

## Local Setup

### 1. Clone and install JavaScript dependencies

```bash
git clone <repository-url>
cd MMSpace
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 2. Configure environment variables

Create `server/.env` (or copy from `server/.env.example`) with values like:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mmspace
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Set up ML service

```bash
cd ml_service
python3.10 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install fastapi uvicorn pandas numpy scikit-learn tensorflow mrmr-selection openpyxl xlrd requests
cd ..
```

### 4. Run the app

Terminal 1 (ML service):

```bash
cd ml_service
source .venv/bin/activate
python app.py
```

Terminal 2 (web app: server + client together):

```bash
cd MMSpace
npm run dev
```

### Local URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- ML service: `http://localhost:8000`

## Seeding Demo Data

The backend includes a seed script with demo users.

```bash
cd server
npm run seed
```

Default demo credentials:
- Admin: `admin@example.com` / `password123`
- Mentor: `mentor@example.com` / `password123`
- Mentee: `mentee@example.com` / `password123`

## Important Functional Flows

### CSV Bulk Upload (Admin)
- Endpoint: `POST /api/csv/upload-students`
- Template: `GET /api/csv/template`
- Required columns: `rollNo`, `studentEmail`, `studentPhone`
- Optional: `fullName`, `parentsPhone`, `parentsEmail`, `mentorEmail`, `class`, `section`

Default generated password for new student accounts:
- `{rollNo}@123`

### Grievance Workflow
- Submit grievance: `POST /api/grievances`
- Mentee grievances: `GET /api/grievances/mentee`
- Mentor grievances: `GET /api/grievances/mentor`
- Admin grievances: `GET /api/grievances/admin`
- Review/resolve/reject endpoints for mentors/admins

### Mentor Profile Update
- Endpoint: `PUT /api/mentors/profile`
- Editable fields include `email`, `phone`, `qualifications`, `citations`

### Placement Prediction
- Backend endpoint: `POST /api/placement/predict`
- Required payload fields:
  - `DSA_Skill`
  - `GP`
  - `Internships`
  - `Active_Backlogs`
  - `Tenth_Marks`
  - `Twelfth_Marks`

## Health and Debugging

- Health check: `GET /api/health`
- Additional health route: `GET /health`
- DB connection test:

```bash
cd server
npm run test-db
```

## Deployment (Production)

### Recommended Deployment
- Backend + ML: one Render web service (`deploy/Dockerfile.render`)
- Client: Vercel
- Database: MongoDB Atlas

### Server environment variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<mongodb-uri>
JWT_SECRET=<secure-secret>
CLIENT_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

### Client environment variable

```env
VITE_API_URL=https://your-server.onrender.com
```

### Deployment Notes
- On Vercel, set project root directory to `client`
- Keep Vite rewrite support for SPA routes (`client/vercel.json`)
- Ensure server CORS values exactly match deployed frontend origin(s)
- Render deploy uses one web service with `deploy/Dockerfile.render` (Node + ML in one container)
- `render.yaml` must stay at repository root (Render blueprint discovery)
- `.dockerignore` should stay at repository root (controls root Docker context for Render build)

## Docker (Local Alternative)

A new user can run MMSpace with Docker on Linux, macOS, and Windows (Docker Desktop + WSL2 recommended on Windows).

### Docker Quick Start

```bash
git clone <repository-url>
cd MMSpace/mmspace-docker
docker compose down --remove-orphans
docker compose up -d --build
docker compose ps
```

Open in browser:
- `http://localhost:3000`

Useful checks:

```bash
docker compose logs -f server
docker compose logs -f ml-service
curl http://localhost:5001/api/health
```

Stop containers:

```bash
docker compose down
```

Full reset (also triggers first-time seed again):

```bash
docker compose down -v
docker compose up -d --build
```

### Auto Seeding on First Init

Docker server startup runs `seed:if-empty`, which executes `scripts/seed.js` only when the database has no users.

### Will File Changes Reflect Immediately?

Not in this Docker setup by default.

- This stack runs production-style containers, so code edits on host do not hot-reload automatically.
- After code changes, rebuild and restart:

```bash
cd mmspace-docker
docker compose up -d --build
```

For instant hot reload while developing, use the non-Docker local dev flow (`npm run dev` for web app + `python app.py` for ML service).

## Known Issues and Backlog

The previous `issues.md` has been normalized into this list:

### Major
- Further admin dashboard hardening for complete mentor/mentee lifecycle
- Ensure mentor assignment remains strictly admin-controlled
- Attendance UX refinements for group-based detailed views
- Dashboard card improvements around leave/complaint indicators

### Minor
- Like/comment consistency edge cases
- Group deletion modal UX polish
- Leave cancel flow refinements
- Batch group operations improvements

## Testing Checklist

- Login/logout for all roles
- Admin CRUD and mentor assignment flows
- Group messaging and individual chat behavior
- Announcement creation and comment updates
- Leave submission and filtered state views
- Grievance submission and review lifecycle
- CSV upload happy path and validation errors
- Placement prediction end-to-end (`client -> server -> ml_service`)

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md).
