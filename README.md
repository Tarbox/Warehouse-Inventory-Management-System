# Warehouse Inventory

A full-stack warehouse inventory management application for tracking consumable materials, stock levels, users, and inventory changes.

The project is designed as a portfolio-quality systems-oriented application demonstrating authentication, role-based authorization, transactional inventory updates, concurrency control, audit history, realtime events, Docker, PostgreSQL, Prisma, and Nginx.

## Features

- Inventory browsing, filtering, sorting, and low-stock detection
- Increment/decrement inventory operations
- Exact quantity updates with optimistic version checks
- PostgreSQL row locking for concurrent increment/decrement operations
- Server-side sessions with HttpOnly cookies
- Argon2id password hashing
- Role- and permission-based authorization
- User, category, material, settings, and history administration
- WebSocket realtime updates
- Docker Compose development stack
- Separate development and production Nginx configurations
- Automated backend API tests
- CI checks for backend, frontend, Docker images, Compose, and Nginx configuration

## Architecture

```text
Browser
   |
   v
 Nginx
   |-------------------|
   v                   v
Next.js             Fastify
Frontend             Backend
                       |
                       v
                  PostgreSQL
                       ^
                       |
                    Prisma
```

See [docs/architecture.md](docs/architecture.md).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Fastify, TypeScript, Zod |
| Authentication | Argon2id, server-side sessions, HttpOnly cookies |
| Database | PostgreSQL, Prisma |
| Realtime | WebSocket |
| Infrastructure | Docker, Docker Compose, Nginx |
| Testing | Vitest |
| CI | GitHub Actions |

## Repository Structure

```text
warehouse-inventory/
├── backend/
│   ├── prisma/
│   └── src/
├── frontend/
├── nginx/
├── docs/
├── scripts/
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.test.yml
└── README.md
```

# Quick Start

The fastest way to run the project from a clean clone is the Docker-based development stack.

## Requirements

Install:

- Git
- Docker Engine
- Docker Compose
- Node.js 24+
- npm

Node.js/npm are required for Prisma migrations and seeding from the host. Frontend and backend application dependencies are installed automatically inside the Docker build.

## 1. Clone the repository

```bash
git clone https://github.com/Tarbox/warehouse-inventory.git
cd warehouse-inventory
```

## 2. Configure environment

Create the Docker environment:

```bash
cp .env.example .env
```

Create the host environment used by Prisma:

```bash
cp backend/.env.example backend/.env
```

Use the same `SEED_ADMIN_PASSWORD` and `SEED_WORKER_PASSWORD` values in both files.

Do not commit either `.env` file.

## 3. Start PostgreSQL, backend, frontend, and Nginx

```bash
docker compose up -d --build
```

The development stack provides:

- PostgreSQL on `localhost:5433`
- Nginx on `localhost:8080`
- Backend and frontend behind the Nginx reverse proxy

## 4. Install backend tooling for Prisma

```bash
cd backend
npm ci
npx prisma generate
cd ..
```

## 5. Apply database migrations

```bash
cd backend
npx prisma migrate deploy
cd ..
```

## 6. Seed demo data

```bash
cd backend
npx prisma db seed
cd ..
```

The seed creates the local `admin` and `worker` demo accounts.

## 7. Open the application

Open:

```text
http://localhost:8080
```

The development Nginx configuration supports Next.js HMR and WebSocket realtime connections.

## Demo Accounts

The seed creates:

- `admin`
- `worker`

Passwords are taken from `SEED_ADMIN_PASSWORD` and `SEED_WORKER_PASSWORD`.

Change the example passwords before using the application outside a local development environment.

# Host Development

You can also run the frontend and backend directly with Node.js instead of using their Docker containers.

## Backend

```bash
cd backend
npm ci
npx prisma generate
npm run dev
```

The host backend uses the connection configured in `backend/.env`.

## Frontend

```bash
cd frontend
npm ci
npm run dev
```

When running the frontend directly, configure the appropriate API URL for the environment.

# Testing

Backend tests use a dedicated PostgreSQL test database.

## 1. Start the test database

From the repository root:

```bash
docker compose -f docker-compose.test.yml up -d
```

The test database is published on `localhost:5434`.

## 2. Configure the test environment

```bash
cp backend/.env.test.example backend/.env.test
```

## 3. Install backend dependencies

```bash
cd backend
npm ci
npx prisma generate
```

## 4. Apply test migrations

```bash
npx prisma migrate deploy
```

## 5. Run the test suite

```bash
npm test
```

Frontend checks:

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run build
```

The same backend, frontend, Docker, Compose, and Nginx checks run automatically in GitHub Actions.

# Environment

Do not commit real secrets.

The root `.env.example` contains variables used by Docker Compose:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `CORS_ORIGIN`
- `SEED_ADMIN_PASSWORD`
- `SEED_WORKER_PASSWORD`

The `backend/.env.example` file is for Prisma/Node commands executed directly from the host.

The `backend/.env.test.example` file is for the dedicated test database.

See [docs/environment.md](docs/environment.md).

# API

See [docs/api.md](docs/api.md).

# Security

The application includes server-side sessions, Argon2id password hashing, HttpOnly cookies, SameSite protection, origin validation for mutating requests, login rate limiting, authorization middleware, session expiration, disabled-user handling, and Nginx security headers.

See [SECURITY.md](SECURITY.md).

# Concurrency

Inventory changes are protected against lost updates:

- increment/decrement operations lock the inventory row inside a database transaction
- exact quantity updates require the expected inventory version
- stale writes return `409 VERSION_CONFLICT`
- inventory changes are recorded in the audit table

# Deployment

Development and production are intentionally separated.

The production stack is defined in [docker-compose.prod.yml](docker-compose.prod.yml) and uses [nginx/nginx.prod.conf](nginx/nginx.prod.conf).

Before starting a production deployment, provide:

- production environment variables and secrets
- trusted TLS certificates at `nginx/certs/fullchain.pem` and `nginx/certs/privkey.pem`
- PostgreSQL backups
- restricted network access
- monitoring and log collection
- an image update strategy

Production PostgreSQL is not published outside the Compose network.

Database migrations and seeding must be executed from an environment that has both Prisma CLI tooling and network access to the production PostgreSQL instance. Do not rely on the development host configuration for production database access.

See [docs/environment.md](docs/environment.md) for environment details.

# CI

GitHub Actions validates:

- backend dependency installation
- Prisma client generation
- database migrations
- backend build
- backend tests
- frontend linting
- frontend type checking
- frontend build
- Docker image builds
- Docker Compose configuration
- development Nginx configuration
- production Nginx configuration

The CI workflow is defined in [.github/workflows/ci.yml](.github/workflows/ci.yml).

# Project Status

The `v1.0.0` release marks the first documented release baseline. Future work may include material request workflows, QR-based workflows, richer reporting, OpenAPI documentation, and broader end-to-end coverage.

# License

MIT License. See [LICENSE](LICENSE).

# Security Policy

See [SECURITY.md](SECURITY.md).
