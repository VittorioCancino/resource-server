# Nest Endpoint Data Flow Skill

Use this workflow when adding or changing HTTP endpoints, service workflows, DB-backed operations, or request/response contracts in this repository.

## Goal

Keep endpoint implementations consistent from route entrypoint to database operation and API response.

## Required Context

Before coding, read:

1. `AGENTS.md`
2. `docs/backend-structure.md`
3. `docs/skills/nest-feature-development.md`

Inspect the existing feature folder and follow nearby naming, DTO, mapper, and service patterns.

## Standard Endpoint Flow

Use this flow by default:

```text
HTTP request
  -> controller route
  -> guards/scopes/auth context
  -> request DTO validation
  -> service workflow
  -> Prisma operation
  -> mapper
  -> response DTO
```

Controllers should only coordinate transport-level details. Services own behavior and state changes.

## Controller Rules

- Keep controllers thin.
- Define routes, HTTP verbs, params, body DTOs, guards, and scopes.
- Read authenticated identity from `request.authToken` for self-service flows.
- Do not trust request body identity fields when token identity already exists.
- Do not call `PrismaService` from controllers.
- Do not implement business rules in controllers.
- Delegate workflow decisions to the service.

## DTO Rules

- Put request/response DTOs under `src/<feature>/dto/`.
- Use `class-validator` decorators on incoming request DTOs.
- Keep response DTOs explicit; do not expose Prisma models directly from controllers.
- For internal cross-cutting modules, separate data shapes and contracts when useful:
  - `dto/` for data transfer shapes
  - `interfaces/` for runtime contracts
  - `utils/` for pure reusable helpers

## Service Rules

- Services own business workflow and domain decisions.
- Use explicit method names tied to intent.
- Keep Prisma access in services or infrastructure services, not controllers.
- Handle nullable read results explicitly with domain exceptions where needed.
- Keep side effects easy to follow; avoid hidden framework-heavy abstractions.

## Prisma And DB Error Rules

Use the shared DB helpers consistently.

For user-facing feature endpoints:

```text
safeDbCall + mapDbErrorToHttpException + throw mapped exception
```

Use this for writes/mutations and DB operations that can fail from user/domain input, including:

- `create`
- `update`
- `delete`
- `upsert`
- `createMany`
- operations with unique constraints
- operations with relation connects
- operations where a missing record should become a domain HTTP error

For simple reads:

- Direct Prisma reads are acceptable.
- Still handle `null` or empty results intentionally.
- Throw domain-specific HTTP exceptions from the service when appropriate.

For best-effort infrastructure operations, such as request audit logging:

```text
safeDbCall + internal Logger + swallow failure
```

Do not use `mapDbErrorToHttpException` for best-effort logging because logging failure must not break the original request.

## Mapper Rules

- Keep mappers feature-local by default.
- Mappers convert Prisma results or service results into response DTOs.
- Mappers should be pure and side-effect free.
- Avoid response shaping inside controllers when a mapper already exists.

## Auth And Scope Rules

- Keep auth guards in `src/auth/guards/` unless there is a strong reason to move them.
- Define scope constants in `src/auth/constants/auth.constants.ts`.
- Apply route scopes with the `Scopes` decorator.
- For self-service endpoints, derive ownership from the token, not from request body fields.
- Only register guards globally from `src/common/http/` if the whole application should share that behavior.

## HTTP Infrastructure Rules

- Cross-cutting HTTP lifecycle registration belongs in `src/common/http/`.
- Concern-specific behavior stays in its concern folder.
- Examples:
  - logging behavior lives in `src/common/logging/`
  - middleware ordering lives in `src/common/http/http-middleware.module.ts`
  - global filter registration lives in `src/common/http/http-filters.module.ts`
  - global interceptor registration lives in `src/common/http/http-interceptors.module.ts`
- Do not scatter global middleware/filter/interceptor registration across feature modules.

## Logging And Audit Rules

- Persist security-sensitive and operationally important request activity as structured audit records.
- Redact bearer tokens, cookies, secrets, passwords, credentials, and token-like fields before persistence.
- Audit/logging writes must be best-effort and must not break the main request flow.

## Verification Rules

- Do not add new test suites or test scaffolding unless the user explicitly changes the project direction.
- After applying code changes, run when feasible:

```bash
pnpm run format
pnpm run lint
pnpm run build
```

- Report any verification command that could not be run.

## Endpoint Implementation Checklist

- Route is declared in the controller with the correct verb/path.
- Request DTO validates incoming data.
- Response DTO represents the public API shape.
- Guards/scopes are applied deliberately.
- Token-derived identity is used for self-service ownership.
- Controller delegates workflow to service.
- Service handles business rules and DB outcomes.
- DB writes/mutations use `safeDbCall`.
- User-facing DB failures are mapped with `mapDbErrorToHttpException`.
- Best-effort infrastructure DB failures are logged and swallowed.
- Mapper returns the response shape.
- Sensitive data is not persisted unsafely.
- Formatting, linting, and build verification pass when feasible.
