# CodeArena — Online Judge

A full-stack Online Judge, built end-to-end on the MERN stack, that lets users register, verify their email, solve coding problems in an in-browser editor, and get their code judged in real time inside isolated Docker sandboxes — deployed live on AWS.

**Live demo:** http://13.211.174.227:3000
*(Currently served over HTTP on a raw EC2 IP; a GitHub Student Pack domain + HTTPS is in progress — see [Roadmap](#roadmap).)*

**Repository:** https://github.com/DeonMBaby/Code-Arena-Online-Judge

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Security](#security)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Author](#author)

---

## Overview

CodeArena is a LeetCode/HackerRank-style competitive programming platform built as a final-year B.Tech Computer Science project. It covers the full lifecycle of an online judge — not just a UI mockup, but a working submission pipeline that actually compiles and executes untrusted user code safely, at scale, on a real deployed server.

The project was built to demonstrate practical, production-adjacent engineering: real auth flows (not just login forms), container-based sandboxing for arbitrary code execution, and a genuine cloud deployment — including the debugging that comes with it (TLS/SMTP certificate issues, Docker networking, environment variable precedence bugs, and more, documented as they were solved).

## Features

**Authentication**
- Registration with mandatory email verification (Nodemailer + Gmail SMTP) before login is allowed
- JWT-based session authentication
- Forgot password / reset password flow with time-limited, single-use tokens
- Resend verification email support
- Passwords hashed with bcrypt; verification and reset tokens generated with `crypto.randomBytes`

**Judging**
- In-browser Monaco Editor (the same editor that powers VS Code)
- Supports C++, Python, and Java
- Each submission compiles and runs inside a **fresh, disposable Docker container**, with:
  - 256MB memory limit
  - 0.5 CPU limit
  - No network access (`--network none`)
  - Read-only root filesystem, with a small writable/executable scratch mount for compiled output
  - 5-second hard execution timeout
  - Container destroyed immediately after judging, win or lose
- Verdicts: `Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Runtime Error`, `Compilation Error`

**Platform**
- Problem bank with search and difficulty filters (Easy / Medium / Hard)
- Problem creation for verified users
- Per-user submission history, per-problem submission history
- Leaderboard and recent-activity feed
- Profile page with accuracy, solved count, and attempt stats

## Architecture

```
┌─────────────┐      HTTPS/HTTP      ┌──────────────────┐
│   Browser   │ ───────────────────► │  React + Vite    │
│             │                      │  (nginx, :3000)  │
└─────────────┘                      └────────┬─────────┘
                                               │ REST API
                                               ▼
                                      ┌──────────────────┐
                                      │  Express Backend │
                                      │     (:5000)      │
                                      └──┬────────────┬──┘
                                         │            │
                          Docker socket  │            │  Mongoose
                       (spawns sandboxes)│            │
                                         ▼            ▼
                              ┌──────────────────┐  ┌──────────────┐
                              │  Per-submission  │  │  MongoDB     │
                              │  Docker sandbox  │  │  Atlas       │
                              │  (gcc / python /  │  │  (users,     │
                              │   java, isolated) │  │  problems,   │
                              └──────────────────┘  │  submissions)│
                                                      └──────────────┘
```

The backend itself runs inside a Docker container and is given access to the **host's** Docker socket, allowing it to spin up sibling sandbox containers for each submission — this is the same pattern tools like CI runners use to safely execute untrusted code without nesting Docker-in-Docker.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router, Axios, Monaco Editor |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT, bcryptjs |
| Email | Nodemailer via Gmail SMTP (explicit TLS config, port 465) |
| Sandboxing | Docker (gcc, python:3.11-slim, eclipse-temurin:17-jdk-jammy) |
| Deployment | AWS EC2 (Amazon Linux 2023), Docker Compose, Nginx |

## Security

- **Password storage:** bcrypt-hashed, never stored or returned in plaintext
- **Verification/reset tokens:** cryptographically random (`crypto.randomBytes(32)`), time-limited (15 min for email verification, 30 min for password reset), single-use
- **Email enumeration protection:** `/forgot-password` always returns the same generic response regardless of whether the email exists
- **Sandboxed execution:** every submission runs in an isolated, network-disabled, memory-and-time-limited container that is destroyed immediately after judging
- **Stored-content safety:** problem statements and submission output are rendered as plain text in React (no `dangerouslySetInnerHTML`), so injected `<script>` content is escaped, not executed
- **SMTP hardening:** explicit TLS 1.2+ Gmail SMTP configuration with sanitized error responses — raw SMTP/certificate errors are logged server-side only and never surfaced to the client
- **Reviewed and confirmed safe:** role cannot be self-assigned at registration; protected routes (`/api/problems` POST, `/api/submissions` POST) require a valid JWT

See [Known Limitations & Roadmap](#known-limitations--roadmap) for hardening still planned before this would be considered fully production-ready.

## Local Setup

### Prerequisites
- Node.js 20+
- Docker Desktop (running)
- A MongoDB Atlas connection string (or local MongoDB)
- A Gmail account with an App Password for sending verification emails

### 1. Clone and configure

```bash
git clone https://github.com/DeonMBaby/Code-Arena-Online-Judge.git
cd Code-Arena-Online-Judge/backend
cp .env.example .env
# then fill in MONGO_URI, JWT_SECRET, EMAIL_USER, EMAIL_PASS, CLIENT_URL
```

### 2. Backend

```bash
cd backend
npm install

# Pull the sandbox images used by the judge
docker pull gcc:latest
docker pull python:3.11-slim
docker pull eclipse-temurin:17-jdk-jammy

node seed.js      # optional: seeds sample problems
npm start
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**

### 4. Or run everything with Docker Compose

```bash
docker compose up -d --build
```

Visit **http://localhost:3000**

> **Note:** when running the backend itself inside Docker (as Compose does), set `TMPDIR` to a directory that is bind-mounted at the *same path* on both the host and the backend container. This is required because the backend uses the host's Docker socket to launch sibling sandbox containers, and those containers are created by the **host** daemon — so any temp path the backend hands to `docker run -v` must already exist at that path on the host, not just inside the backend's own container filesystem. See `docker-compose.yml` for the working configuration.

## Deployment

Deployed on an AWS EC2 (Amazon Linux 2023, `t3.micro`, free tier) instance:

1. Docker and Docker Compose installed on the instance
2. Repository cloned via Git
3. `backend/.env` populated directly on the server (never committed to version control)
4. `docker compose up -d --build` builds and runs all three services (MongoDB is run locally in a container for reference, but the app itself is configured via `.env` to use MongoDB Atlas)
5. EC2 Security Group opened for ports 22 (SSH), 80, 443, 3000 (frontend), and 5000 (backend API)

## Project Structure

```
Code-Arena-Online-Judge/
├── backend/
│   ├── config/          # DB connection, env validation
│   ├── middleware/       # JWT auth, global error handler
│   ├── models/           # User, Problem, Submission (Mongoose)
│   ├── routes/           # auth, problems, submissions, leaderboard
│   ├── sandbox/          # executor.js — Docker sandboxing logic
│   ├── utils/            # mail.js — Nodemailer + templated emails
│   ├── Dockerfile
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios instance
│   │   ├── components/   # Navbar, etc.
│   │   ├── context/      # AuthContext (JWT + user state)
│   │   └── pages/        # Login, Register, Problems, ProblemDetail,
│   │                     # Leaderboard, Profile, ForgotPassword,
│   │                     # ResetPassword, VerifyEmail, CreateProblem
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## API Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account, sends verification email |
| POST | `/auth/verify-email` | No | Verify account via emailed token |
| POST | `/auth/resend-verification` | No | Re-send verification email |
| POST | `/auth/login` | No | Returns JWT (requires verified email) |
| POST | `/auth/forgot-password` | No | Sends password reset email |
| POST | `/auth/reset-password` | No | Sets new password via emailed token |
| GET  | `/auth/profile` | Yes | Current user + submission stats |
| GET  | `/problems` | No | List problems (search + difficulty filter) |
| GET  | `/problems/:id` | No | Problem detail (test case outputs hidden) |
| POST | `/problems` | Yes | Create a new problem |
| POST | `/submissions` | Yes | Submit code for judging |
| GET  | `/submissions/my` | Yes | Current user's submission history + stats |
| GET  | `/submissions/problem/:problemId` | Yes | Current user's submissions for one problem |
| GET  | `/submissions/recent` | No | Recent activity feed (public) |
| GET  | `/leaderboard` | No | Top solvers |

## Known Limitations & Roadmap

Documented honestly rather than glossed over — this is the real state of the project:

- [ ] **Rate limiting** is not yet applied to `/auth/login`, despite `express-rate-limit` being installed as a dependency — planned before considering this production-ready
- [ ] **HTTPS/custom domain** — currently served over plain HTTP on a raw EC2 IP; a free domain + SSL certificate via the GitHub Student Developer Pack is in progress
- [ ] **Mobile editor experience** is not optimized; Monaco Editor is desktop-oriented
- [ ] **Onboarding** for first-time users could be clearer (a "start here" prompt is planned)
- [ ] **Dashboard/analytics** currently shows raw stats rather than visualized trends
- [ ] JWT is stored in `localStorage` rather than an `httpOnly` cookie; acceptable given no current XSS vector, but a stricter option for the future

## Author

**Deon M Baby**
B.Tech Computer Science, Vimal Jyothi Engineering College
GitHub: [@DeonMBaby](https://github.com/DeonMBaby)