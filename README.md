# Warehouse Inventory

A full-stack warehouse inventory management application designed for tracking consumable materials, inventory levels, users, and inventory changes.

The project was built as a practical systems-oriented application with a focus on authentication, role-based access control, inventory concurrency, audit history, realtime updates, containerization, and production-style deployment.

## Features

### Inventory Management

- View current inventory levels
- Increase and decrease material quantities
- Set exact inventory quantities
- Low-stock detection based on minimum quantity
- Sort and filter inventory
- Organize materials by category
- Optimistic concurrency control using inventory versions

### Authentication & Authorization

- Server-side session authentication
- HttpOnly session cookies
- Argon2id password hashing
- Session expiration
- Configurable session duration
- User enable/disable management
- Role-based access control
- Permission-based authorization

Built-in roles:

| Role | Description |
|------|-------------|
| `WORKER` | Can view and update inventory |
| `ADMIN` | Can manage inventory, users, categories, settings and history |

### Realtime Updates

Inventory, material and category changes can be propagated to connected clients through WebSocket realtime events.

### Audit History

Inventory changes are stored with:

- user
- material
- previous quantity
- new quantity
- difference
- operation type
- timestamp

### Administration

Administrators can manage:

- users
- roles
- materials
- categories
- inventory settings
- session duration
- inventory history

## Architecture

```text
                         Browser
                            │
                         HTTPS
                            │
                            ▼
                       ┌─────────┐
                       │  Nginx  │
                       └────┬────┘
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
        ┌─────────────┐           ┌─────────────┐
        │   Next.js   │           │   Fastify   │
        │   Frontend  │           │   Backend   │
        └─────────────┘           └──────┬──────┘
                                         │
                      ┌──────────────────┼──────────────────┐
                      │                  │                  │
                      ▼                  ▼                  ▼
                   Auth             Inventory          Realtime
                      │                  │                  │
                      └──────────────────┼──────────────────┘
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │ PostgreSQL  │
                                  └─────────────┘
```

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Fastify
- TypeScript
- Zod
- Argon2
- WebSocket

### Database

- PostgreSQL
- Prisma ORM

### Infrastructure

- Docker
- Docker Compose
- Nginx
- HTTPS
- WebSocket reverse proxy

## Project Structure

```text
warehouse-inventory/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── lib/
│       ├── modules/
│       │   ├── auth/
│       │   ├── categories/
│       │   ├── history/
│       │   ├── inventory/
│       │   ├── materials/
│       │   ├── realtime/
│       │   ├── settings/
│       │   └── users/
│       ├── plugins/
│       ├── routes/
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       └── lib/
│
├── nginx/
├── docs/
├── docker-compose.yml
└── README.md
```

## Local Development

### Requirements

- Git
- Docker
- Docker Compose

Node.js is only required when running the frontend or backend directly outside Docker.

### 1. Clone the repository

```bash
git clone https://github.com/Tarbox/warehouse-inventory.git
cd warehouse-inventory
```

### 2. Create environment configuration

```bash
cp .env.example .env
```

Review the values in `.env` before starting the application.

The seed credentials are used only to create local demo accounts.

### 3. Start the stack

```bash
docker compose up -d --build
```

### 4. Apply database migrations

```bash
docker compose exec backend npx prisma migrate deploy
```

### 5. Seed demo data

```bash
docker compose exec backend npx prisma db seed
```

### 6. Open the application

The local development stack is exposed through Nginx.

```text
http://localhost:8080
```

HTTPS is also configured for the local environment when certificates are provided.

## Environment Variables

Example configuration:

```env
POSTGRES_DB=warehouse
POSTGRES_USER=warehouse
POSTGRES_PASSWORD=change_me

DATABASE_URL=postgresql://warehouse:change_me@localhost:5432/warehouse?schema=public

CORS_ORIGIN=http://localhost:8080

SEED_ADMIN_PASSWORD=change_me_admin
SEED_WORKER_PASSWORD=change_me_worker

NEXT_PUBLIC_API_URL=
```

### Important

Never commit real secrets, passwords, session tokens, certificates or production configuration to Git.

Use environment variables or a secret-management solution for production deployments.

## Database

The backend uses Prisma with PostgreSQL.

Create and apply a development migration:

```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

Deploy existing migrations:

```bash
npx prisma migrate deploy
```

Generate Prisma Client:

```bash
npx prisma generate
```

Seed the database:

```bash
npx prisma db seed
```

## Testing

The project includes tests for critical authentication and authorization flows.

The test suite covers scenarios such as:

- successful login
- invalid password
- missing session cookie
- invalid session
- expired session
- `/auth/me`
- logout
- disabled user
- dynamic session duration
- authorization by role and permission
- inventory concurrency handling

Run backend tests:

```bash
cd backend
npm test
```

Run frontend checks:

```bash
cd frontend
npm run lint
npm run typecheck
```

## API

Main API areas:

```text
/api/auth
/api/inventory
/api/materials
/api/categories
/api/users
/api/history
/api/settings
/api/realtime
```

Detailed API documentation is available in:

```text
docs/api.md
```

## Security

The application uses several security mechanisms:

- Argon2id password hashing
- HttpOnly authentication cookies
- Secure cookies in production
- SameSite cookie protection
- Origin validation for mutating requests
- Login rate limiting
- Role-based authorization
- Server-side session validation
- Session expiration
- Disabled-user session invalidation
- Generic production error responses
- Nginx security headers

For security-related reports, see:

```text
SECURITY.md
```

## Deployment

The project is containerized and can be deployed using Docker Compose or adapted to a cloud/container platform.

A production deployment should additionally provide:

- HTTPS with a trusted certificate
- secure environment variables
- PostgreSQL backups
- database monitoring
- log aggregation
- restricted network access
- container/image update strategy
- infrastructure-specific secret management

The included Nginx configuration demonstrates reverse proxying for:

- frontend traffic
- backend API traffic
- WebSocket traffic
- HTTPS termination

## Realtime Architecture

The application uses WebSockets for realtime updates.

Example event types include:

```text
connection.ready
inventory.updated
material.created
material.updated
material.deleted
category.created
category.updated
category.deleted
```

Connected clients can update their UI without manually refreshing the page.

## Concurrency Control

Inventory updates use version-based optimistic concurrency control.

Each inventory record contains:

```text
quantity
version
```

Clients send the version they last observed when updating an exact inventory quantity.

This prevents one user from silently overwriting an update made by another user.

## Roadmap

Planned improvements include:

- material request workflow
- inventory issue/receive workflows
- transaction history improvements
- QR-based workflows
- reorder points
- consumption statistics
- additional employee roles
- expanded reporting
- improved observability
- OpenAPI documentation
- end-to-end testing

## Project Status

This project is under active development.

The repository is primarily intended as a portfolio and engineering project demonstrating full-stack application development, backend architecture, authentication, database design, realtime communication, containerization and infrastructure-oriented practices.

## License

This project is licensed under the MIT License.

See `LICENSE` for details.
