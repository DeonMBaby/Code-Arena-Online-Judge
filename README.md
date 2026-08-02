# CodeArena — Online Judge

A full-stack Online Judge built with MERN stack. Supports C++, Python, and Java with Docker sandboxing.

## Fixes applied to this copy

- **`backend/sandbox/executor.js`** — C++ and Java submissions previously
  couldn't compile at all: the container mounted `/code` read-only, but
  `g++`/`javac` tried to write compiled output into that same folder. Added
  a second writable+executable tmpfs mount (`/workdir`) so compilation
  actually succeeds now. Python was unaffected since it never compiles.
- **`backend/package.json`** — removed a bogus `child_process` npm
  dependency (it's a Node.js built-in, not something to install) and added
  the missing `start`/`dev`/`seed` scripts so `npm start` and `npm run seed`
  actually work.
- **`backend/seed.js`** — was hardcoded to `mongodb://localhost:27017`,
  which breaks when run inside the Docker container. Now reads `MONGO_URI`
  from the environment, same as `server.js`.
- **`backend/.env` / `.env.example`** — were empty; filled in with working
  defaults (`PORT`, `MONGO_URI`, `JWT_SECRET`).


## Features
- User registration & login (JWT auth)
- Problem list with difficulty filter
- Monaco code editor (VS Code in browser)
- Docker-sandboxed code execution (memory + time limits, no network)
- Verdicts: Accepted, Wrong Answer, TLE, Runtime Error, Compilation Error
- Leaderboard (recent submissions + top solvers)
- Submission history per user

## Tech Stack
- **Frontend**: React + Vite, React Router, Monaco Editor
- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Sandbox**: Docker (gcc, python:3.11-slim, openjdk:17-slim)
- **Auth**: JWT + bcrypt

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally OR Docker
- Docker installed and running

### 1. Backend
```bash
cd backend
npm install
# Pull sandbox Docker images
docker pull gcc:latest
docker pull python:3.11-slim
docker pull openjdk:17-slim
# Start MongoDB locally
mongod
# Seed sample problems
node seed.js
# Start server
node server.js
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:5173

---

### Docker Compose (full stack)
```bash
docker-compose up --build
```
Visit: http://localhost:3000

---

## Security (Sandbox)
Each submission runs in an isolated Docker container with:
- `--memory 256m` — memory limit
- `--network none` — no internet access
- `--read-only` filesystem
- `timeout 5` — 5 second time limit
- Container auto-removed after execution

## Adding Problems
Use the seed script or POST to `/api/problems` (requires auth token):
```json
{
  "name": "Problem Name",
  "code": "P006",
  "difficulty": "Medium",
  "statement": "Problem description...",
  "testCases": [
    { "input": "1 2", "output": "3" }
  ]
}
```
