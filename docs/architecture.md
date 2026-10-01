# Architecture

## Overview

Warehouse Inventory is a containerized full-stack application with a Next.js frontend, Fastify backend, PostgreSQL database, Prisma ORM, Nginx reverse proxy, and WebSocket-based realtime updates.

```text
Browser
  |
  | HTTP/HTTPS
  v
Nginx
  |--------------------|
  v                    v
Next.js              Fastify
Frontend              Backend
                         |
                         v
                    PostgreSQL

Fastify <---- WebSocket ----> Browser
```

## Backend boundaries

- `auth`: login, sessions, logout, current-user lookup
- `users`: user administration
- `categories`: category CRUD and activation state
- `materials`: material CRUD and validation
- `inventory`: quantity changes and concurrency control
- `history`: inventory audit trail
- `settings`: system configuration
- `realtime`: WebSocket connection management and broadcast events

## Authentication

Sessions are stored server-side in PostgreSQL and referenced by an HttpOnly cookie. Passwords are hashed with Argon2id. Session expiration is persisted and can be configured through the system settings.

## Authorization

Protected routes use authentication middleware followed by permission checks. Roles such as `WORKER` and `ADMIN` are mapped to permissions in the backend.

## Inventory concurrency

Increment/decrement operations lock the inventory row with PostgreSQL `FOR UPDATE` inside a transaction. Exact quantity updates additionally require the client to provide the expected inventory version; stale versions return a conflict instead of silently overwriting another user's change.

## Realtime flow

After a successful inventory or material/category mutation, the backend broadcasts a typed event to connected WebSocket clients. Clients use the event version to ignore stale inventory updates.

## Deployment

Development and production should use separate Nginx configurations. Production terminates trusted HTTPS traffic and proxies requests to the frontend and backend containers. Secrets and certificates are supplied at deployment time rather than committed to the repository.
