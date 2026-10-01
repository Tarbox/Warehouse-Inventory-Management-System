# API Overview

All application API routes are prefixed with `/api`.

## Authentication

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Authentication uses an HttpOnly session cookie.

## Inventory

- `GET /api/inventory`
- `POST /api/inventory/:materialId/increment`
- `POST /api/inventory/:materialId/decrement`
- `PUT /api/inventory/:materialId`

Exact inventory updates require `expectedVersion`. A stale version returns `409 VERSION_CONFLICT`.

## Other resources

- `/api/materials`
- `/api/categories`
- `/api/users`
- `/api/history`
- `/api/settings`

## Realtime

- `GET /api/realtime` via WebSocket

Events include inventory, material, and category updates.

## Health checks

- `GET /health`
- `GET /health/db`
