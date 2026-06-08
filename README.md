# Resource Server

Standalone NestJS resource server extracted from the former IdP monolith.

This service validates Hydra-issued bearer tokens from an externally managed Hydra/Ory deployment, enforces resource-server scopes, exposes protected domain APIs, and persists structured request audit logs.

## Responsibilities

- Validate OAuth2 access tokens through Ory Hydra introspection.
- Enforce `resource-server` audience checks.
- Enforce route-specific scopes for users and labs.
- Manage lab lifecycle through token-derived `clientId` ownership.
- Persist API request audit logs in `ApiRequestLog`.
- Store attendance schema foundations for future ingestion work.

## Repository Boundary

This repository owns only the resource-server backend, Prisma schema/migrations, local Postgres container, and resource-server bootstrap flow.

It does not own the Hydra auth server, admin panel, platform root Docker Compose, or cross-service bootstrap orchestration. Configure those systems separately and point this service at Hydra with `HYDRA_ADMIN_URL`.

## Main Modules

- `src/auth/` - Hydra introspection, audience guard, scope guard, scope constants.
- `src/users/` - user management endpoints.
- `src/labs/` - lab self-service lifecycle endpoints.
- `src/common/http/` - global HTTP lifecycle wiring for middleware, filters, and interceptors.
- `src/common/logging/` - structured request audit logging implementation.
- `src/prisma/` - Prisma service/module.

## Local Setup

Create a local env file:

```bash
cp .env.example .env
```

Default local database:

- Host: `localhost`
- Port: `5434`
- Database: `resource_server`
- User: `resource_server`
- Password: `resource_server`

The Hydra admin URL points to a separately running Hydra instance. The default assumes Hydra exposes its admin port on the host:

```env
HYDRA_ADMIN_URL=http://127.0.0.1:4445
```

If this service joins a Docker network where Hydra is reachable by service DNS, use that network name instead, for example:

```env
HYDRA_ADMIN_URL=http://hydra:4445
```

This repository's `docker-compose.yml` starts only the resource-server PostgreSQL database.

## Bootstrap

Use the local bootstrap script:

```bash
./init.sh
```

This installs dependencies, resets local Postgres, starts the database, runs Prisma generation/migrations/seed, and starts the dev server.

## Common Commands

```bash
pnpm install
pnpm run format
pnpm run lint
pnpm run build
pnpm run test
pnpm run test:e2e
```

Prisma commands:

```bash
pnpm run prisma:generate
pnpm run prisma:migrate:dev
pnpm run prisma:migrate:deploy
pnpm run prisma:seed
```

Docker database commands:

```bash
pnpm run db:up
pnpm run db:logs
pnpm run db:down
```

## Scope Policy

Current resource server scopes:

- `users.read` - read users.
- `users.write` - create/update user data.
- `users.delete` - delete users.
- `labs.read` - read own lab.
- `labs.self-update` - create/update/reactivate own lab.
- `labs.self-deregister` - deactivate own lab.

## Audit Logging

Every HTTP request is persisted as an `ApiRequestLog` row when possible.

The logger captures request metadata, duration, status, success/failure, Hydra auth context, redacted headers/query/body, and exception metadata.

Logging is best-effort: audit persistence failures are logged internally and do not break the original API request.

## Agent Context

Future coding agents should read `AGENTS.md` first and use the project skills under `.agents/skills/`.
