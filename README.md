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
- Nginx reverse proxy
- Automated backend API tests

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
└── README.md
```

## Local Development

### Requirements

- Git
- Docker
- Docker Compose

### 1. Clone

```bash
git clone https://github.com/Tarbox/warehouse-inventory.git
cd warehouse-inventory
```

### 2. Configure environment

```bash
cp .env.example .env
```

Change the demo passwords before seeding the database.

### 3. Start the development stack

```bash
docker compose up -d --build
```

### 4. Apply migrations

```bash
docker compose exec backend npx prisma migrate deploy
```

### 5. Seed demo data

```bash
docker compose exec backend npx prisma db seed
```

### 6. Open the application

```text
http://localhost:8080
```

Development Nginx uses plain HTTP and Next.js HMR. PostgreSQL is bound to localhost on port `5433`.

The production Nginx configuration is separate and is used with `docker-compose.prod.yml`.

## Environment

Do not commit real secrets.

The root `.env.example` is intended for Docker Compose. The backend example file is intended for running Prisma/Node commands directly from the host.

See [docs/environment.md](docs/environment.md).

## Testing

Backend tests use a dedicated PostgreSQL test database.

Start the test database:

```bash
docker compose -f docker-compose.test.yml up -d
```

Create the test environment file:

```bash
cp backend/.env.test.example backend/.env.test
```

Apply migrations and run the backend suite:

```bash
cd backend
npx prisma migrate deploy
npm test
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run typecheck
```

The same checks run automatically in GitHub Actions.

## API

See [docs/api.md](docs/api.md).

## Security

The application includes server-side sessions, Argon2id password hashing, HttpOnly cookies, SameSite protection, origin validation for mutating requests, login rate limiting, authorization middleware, session expiration, disabled-user handling, and Nginx security headers.

See [SECURITY.md](SECURITY.md).

## Concurrency

Inventory changes are protected against lost updates:

- increment/decrement operations lock the inventory row inside a database transaction
- exact quantity updates require the expected inventory version
- stale writes return `409 VERSION_CONFLICT`
- inventory changes are recorded in the audit table

## Demo Accounts

The seed creates local demo accounts named `admin` and `worker`.

Passwords are supplied only through environment variables. Never use demo passwords in production.

## Deployment

Development and production are intentionally separated.

For a production Compose deployment:

```bash
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

Provide TLS certificates as `nginx/certs/fullchain.pem` and `nginx/certs/privkey.pem` before starting the production stack.

Production deployments should additionally provide:

- trusted TLS certificates
- production secrets through environment/secret management
- PostgreSQL backups
- restricted network access
- monitoring and log collection
- an image update strategy

Development and production Nginx configurations should remain separate.

## Project Status

The `v1.0.0` release marks the first documented release baseline. Future work may include material request workflows, QR-based workflows, richer reporting, OpenAPI documentation, and broader end-to-end coverage.

## License

MIT License. See [LICENSE](LICENSE).

## Security Policy

See [SECURITY.md](SECURITY.md).
