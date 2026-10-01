# Environment Configuration

## Root Compose variables

The root `.env.example` documents variables consumed by `docker-compose.yml`:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `CORS_ORIGIN`
- `SEED_ADMIN_PASSWORD`
- `SEED_WORKER_PASSWORD`

Do not commit a real `.env` file.

## Development

For the Docker Compose stack, PostgreSQL is published on localhost port `5433`. The backend container uses the internal hostname `postgres:5432`.

For direct host-side backend commands, use `backend/.env.example`, which points to `localhost:5433`.

## Production

Provide production values through the deployment environment or a secret manager. Do not reuse demo seed passwords in production.
