# Resource Server

Standalone NestJS resource server extracted from the former IdP monolith.

This service validates Hydra-issued bearer tokens from an externally managed Hydra/Ory deployment, enforces resource-server scopes, exposes protected domain APIs, and persists structured request audit logs.

## Responsibilities

- Validate OAuth2 access tokens through Ory Hydra introspection.
- Enforce `resource-server` audience checks.
- Enforce route-specific scopes for users and labs.
- Manage lab lifecycle through token-derived `clientId` ownership.
- Persist API request audit logs in `ApiRequestLog`.

## Repository Boundary

This repository owns only the resource-server backend, Prisma schema/migrations, local Postgres container, and resource-server bootstrap flow.

It does not own the Hydra auth server, admin panel, platform root Docker Compose, or cross-service bootstrap orchestration. Configure those systems separately and point this service at Hydra with `HYDRA_ADMIN_URL`.

## Main Modules

- `src/auth/` - Hydra introspection, audience guard, scope guard, scope constants.
- `src/internal-auth/` - login-app credential verification endpoint protected by Hydra scopes.
- `src/user-registration/` - lab-generated registration invitations and pending-user approval flow.
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

- `internal.auth.verify-credentials` - verify user credentials for the login app.
- `users.read` - read users.
- `users.write` - create/update user data.
- `users.delete` - delete users.
- `users.me.profile.read` - read the authenticated user's minimal profile.
- `users.me.services.<serviceKey>.roles.read` - read the authenticated user's roles for one service.
- `user-registration.codes.validate` - validate a registration invitation code.
- `user-registration.registrations.write` - claim a registration invitation and create a pending user.
- `user-registration.invitations.write` - create lab-scoped registration invitations.
- `user-registration.invitations.read` - list own lab registration invitations.
- `user-registration.invitations.approve` - activate a pending user registered from an invitation.
- `user-registration.invitations.delete` - delete an unused or pending registration invitation.
- `labs.read` - read own lab.
- `labs.self-update` - create/update/reactivate own lab.
- `labs.self-deregister` - deactivate own lab.

User-scoped endpoints:

```http
GET /users/me/profile
GET /users/me/services/:serviceKey/roles
```

For Hydra admin-panel integration, request `users.me.services.hydra.roles.read` and call `GET /users/me/services/hydra/roles`.

Registration endpoints:

```http
POST /labs/me/user-registration-invitations
GET /labs/me/user-registration-invitations
POST /labs/me/user-registration-invitations/:id/activate
DELETE /labs/me/user-registration-invitations/:id
POST /services/:serviceKey/user-registration-invitations
GET /services/:serviceKey/user-registration-invitations
POST /services/:serviceKey/user-registration-invitations/:id/activate
DELETE /services/:serviceKey/user-registration-invitations/:id
POST /user-registration/validate-code
POST /user-registration/register
```

Lab invitation management endpoints are Hydra-protected and derive the laboratory from the token `clientId`. Service invitation management endpoints are Hydra-protected and require the authenticated token subject to have the `admin` role for the target service. User-portal public registration endpoints are also Hydra-protected; the user-portal backend should call them with a client-credentials token for audience `resource-server`. Registration endpoints accept the generated 8-character code, create users as `PENDING`, and require service-admin activation before login succeeds.

## Service-Backed Laboratories

`Service` is the shared authorization domain for platform applications and laboratories.

Application services use `Service.type = APPLICATION`, for example `hydra` and `user-portal`. Laboratories keep lab-specific data in `Laboratory`, but each laboratory references one backing `Service` with `Service.type = LABORATORY`.

Generic service roles and memberships are represented by:

- `ServiceRole`
- `UserServiceMembership`
- `UserServiceMembershipRole`

Lab-specific role and membership tables have been replaced by service roles and memberships. Lab self-service APIs still resolve the lab from the token `clientId`, then use `Laboratory.serviceId` for registration and membership workflows.

## Audit Logging

Every HTTP request is persisted as an `ApiRequestLog` row when possible.

The logger captures request metadata, duration, status, success/failure, Hydra auth context, redacted headers/query/body, and exception metadata.

Logging is best-effort: audit persistence failures are logged internally and do not break the original API request.

## Login App Integration

The login application should use a Hydra client-credentials token with audience `resource-server` and scope `internal.auth.verify-credentials` to call:

```http
POST /auth/login
```

The legacy internal path `POST /internal/auth/verify-credentials` is also available for direct credential verification. These endpoints return `authenticated: false` for invalid credentials and return the user's `subject` only when credentials are valid. Grant this scope only to the login application's Hydra client.

## Agent Context

Future coding agents should read `AGENTS.md` first and use the project skills under `.agents/skills/`.
