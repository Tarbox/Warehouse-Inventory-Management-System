# Environment Configuration

## Docker Compose

The root `.env.example` documents the variables consumed by the Compose files:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `CORS_ORIGIN`
- `SEED_ADMIN_PASSWORD`
- `SEED_WORKER_PASSWORD`

Create it locally with:

```bash
cp .env.example .env
```

Do not commit the resulting `.env` file.

## Backend commands from the host

Use `backend/.env.example` for Prisma or Node commands executed directly on the host. The development Compose PostgreSQL service is published on `localhost:5433`.

For a separate local test database, use `backend/.env.test.example` and the test Compose file, which publishes PostgreSQL test on `localhost:5434`.

## Production

Provide production values through the deployment environment or a secret manager. Do not reuse demo seed passwords in production.

The production Compose file does not publish PostgreSQL outside the Compose network.
