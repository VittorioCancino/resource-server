# Nest Feature Development Skill

Use this document as the implementation playbook for adding or changing backend features in this repository.

## Goal

Produce consistent NestJS features that match the project's module shape, migration rules, auth approach, and logging/audit expectations.

## Before Writing Code

1. Read `AGENTS.md`.
2. Read `docs/backend-structure.md`.
3. Read `docs/skills/nest-endpoint-data-flow.md` when the change adds or modifies endpoints, service workflows, DTOs, or DB-backed behavior.
4. Inspect the target feature folder for existing patterns.
5. If the change touches Prisma, inspect existing migrations before editing schema or adding SQL.

## Default Feature Shape

Create or extend features using this layout first:

```text
src/<feature>/
  dto/
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.mapper.ts
  <feature>.module.ts
```

Only add more layers when there is a concrete need.

## Controller Rules

- Keep controllers thin.
- Define routes, guards, scopes, params, and DTOs.
- Read auth context from the request.
- Delegate business logic to the service.
- Do not call Prisma directly from controllers.

## Service Rules

- Put workflow and business rules in services.
- Use `PrismaService` directly unless a new abstraction is clearly justified.
- Use `safeDbCall` and `mapDbErrorToHttpException` when user-facing DB errors matter.
- For best-effort infrastructure logging, use `safeDbCall`, log internally, and swallow persistence failures.
- Use explicit method names tied to domain intent.

## Mapper Rules

- Keep mappers feature-local.
- Map Prisma results into response DTOs.
- Keep mappers pure.

## DTO Rules

- Separate request and response DTOs.
- Validate input DTOs with `class-validator`.
- Do not expose Prisma models directly from controllers.

## Prisma Rules

- Do not auto-generate exploratory migrations.
- Update `prisma/schema.prisma` intentionally.
- Add or edit SQL in `prisma/migrations/` intentionally.
- Keep migration SQL simple and deterministic.
- Make sure `./init.sh` can rebuild from scratch cleanly.

## Auth Rules

- Prefer token-derived identity for self-service flows.
- Do not trust client identity fields from request bodies when the token already provides identity.
- Keep guards focused on authn/authz, not domain workflow.

## Logging Rules

- Prefer persistent structured audit records for important requests.
- Redact bearer tokens, secrets, and credentials before storage.
- Logging failures must not break the main request flow.

## Response Design Rules

- Prefer predictable route shapes and status codes.
- Return explicit lifecycle outcomes when useful.
- Keep API contracts stable and easy to test.

## Testing Rules

- Add e2e tests for new routes or changed HTTP behavior.
- Add unit tests for branch-heavy service logic when useful.
- Verify build/test commands when the change is substantial.
- After applying code changes, run formatting, linting, and build verification when feasible.

## Completion Checklist

- Module structure matches the project convention.
- DTOs exist for request/response shapes.
- Controller stays thin.
- Service owns workflow logic.
- Mapper converts persistence models to API shapes.
- Prisma schema and SQL migration are aligned.
- No sensitive values are logged or persisted unsafely.
- Formatting, linting, and build verification were run when feasible.
- Tests were run when appropriate.
- Final explanation mentions auth or DB lifecycle impact when relevant.
