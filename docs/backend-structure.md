# Backend Structure

This document defines the desired NestJS service structure for this repository so future features follow the same shape and stay easy to maintain.

## Goals

- Keep features easy to find and reason about.
- Keep request/auth/database flow explicit.
- Prefer simple feature-local helpers over shared abstractions too early.
- Make new modules look familiar across the project.

## Folder Shape

Each domain feature should live in its own folder under `src/`.

Example:

```text
src/
  labs/
    dto/
      create-lab.dto.ts
      delete-lab.dto.ts
    labs.controller.ts
    labs.service.ts
    labs.mapper.ts
    labs.module.ts
```

Recommended growth path for a feature:

```text
src/
  <feature>/
    dto/
    <feature>.controller.ts
    <feature>.service.ts
    <feature>.mapper.ts
    <feature>.module.ts
```

Add more files only when complexity justifies them:

```text
src/
  <feature>/
    dto/
    policies/
    helpers/
    constants/
    <feature>.controller.ts
    <feature>.service.ts
    <feature>.mapper.ts
    <feature>.module.ts
```

## Module Responsibilities

### Controller

- Owns HTTP route definitions only.
- Applies guards, scopes, params, and DTO validation.
- Reads authenticated request context.
- Delegates business logic to the service.
- Should stay thin and avoid direct Prisma calls.

### Service

- Owns business logic and workflow decisions.
- Coordinates Prisma reads/writes.
- Enforces domain rules and state transitions.
- Uses shared DB error mapping helpers where relevant.
- Returns domain-oriented DTO data or mapped response shapes.

### Mapper

- Converts Prisma models into API response DTOs.
- Stays feature-local unless two or more modules truly share the same mapping.
- Should be pure and side-effect free.

### DTOs

- Separate request and response DTOs.
- Use `class-validator` on incoming request DTOs.
- Keep DTO names explicit, even if slightly verbose.
- Do not expose Prisma models directly from controllers.

## Shared Modules

### `auth/`

- Holds token introspection, guards, decorators, and auth constants.
- Guards should authenticate/authorize, not contain feature business logic.
- Request auth context should be attached once and reused downstream.

### `prisma/`

- Holds the Prisma service/module only.
- Keep database access explicit from feature services.
- Avoid building a generic repository layer unless repeated patterns become painful.

### `common/`

- Only for truly shared utilities.
- Good candidates: DB error mapping, logging infrastructure, exception filters, interceptors.
- Do not move feature-specific helpers here too early.

## Service Design Rules

- Prefer one main service per feature module first.
- Split services only when there is a clear sub-domain or workflow boundary.
- Use method names that describe intent, not transport details.
  - Good: `getLabByClientId`, `deregisterOwnLab`, `ingestAttendanceBatch`
  - Avoid vague names like `handle`, `processData`, `executeTask`
- Keep service methods cohesive: one workflow, one clear outcome.

## Data Access Rules

- Feature services may use `PrismaService` directly.
- Wrap writes that can fail with `safeDbCall` when user-facing error mapping matters.
- Map Prisma errors into HTTP exceptions close to the service boundary.
- Keep raw query logic readable; avoid clever abstractions that hide domain meaning.

## API Design Rules

- Prefer resource-oriented routes.
- Use authenticated identity from the token for self-service flows instead of trusting request body identity fields.
- Keep lifecycle behavior explicit in responses when helpful.
  - Example: `action: 'created' | 'updated' | 'reactivated'`
- Favor predictable status codes and response shapes.

## Logging And Auditing

- Security-sensitive and operationally important requests should be persisted as structured audit records.
- Redact bearer tokens, secrets, credentials, and similar sensitive values before storage.
- Logging should not break the main request flow if persistence fails.

## Testing Direction

- Add e2e coverage for HTTP contract and auth behavior.
- Add focused unit tests only where logic becomes branch-heavy or easy to regress.
- Prefer testing service behavior through real module wiring when practical.

## Naming Conventions

- Files: kebab-case.
- Classes: PascalCase.
- DTOs: suffix with `Dto` or `ResponseDto` consistently.
- Controller methods and service methods: explicit verbs tied to business meaning.
- Scope constants: uppercase keys, string values matching OAuth scope names.

## Decision Biases

- Prefer simple over abstract.
- Prefer explicit over magical.
- Prefer feature-local over shared-until-reuse-is-real.
- Prefer durable auditability for auth and DB-impacting workflows.
- Prefer schema and migration review over generated drift.

## Suggested Default For New Features

When adding a new feature, start with:

```text
src/<feature>/
  dto/
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.mapper.ts
  <feature>.module.ts
```

Only introduce extra layers after a concrete need appears.
