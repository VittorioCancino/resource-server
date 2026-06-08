# Nest Feature Development

Use this skill when adding or changing backend functionality in this repository.

## Required context

Read these files before coding:

1. `AGENTS.md`
2. `docs/backend-structure.md`
3. `docs/skills/nest-feature-development.md`
4. `docs/skills/nest-endpoint-data-flow.md` when changing endpoints, service workflows, DTOs, or DB-backed behavior

## What this skill enforces

- Feature-first NestJS structure under `src/<feature>/`
- Thin controllers, business-logic services, feature-local mappers
- Separate request and response DTOs with `class-validator`
- Direct `PrismaService` usage from feature services unless abstraction is clearly justified
- `safeDbCall` for user-facing writes/mutations, mapped with `mapDbErrorToHttpException`
- `safeDbCall` for best-effort infrastructure logging, logged internally and swallowed
- Intentional Prisma schema changes plus reviewed SQL migrations
- Token-derived identity for self-service flows
- Persistent structured audit logging for important requests with sensitive data redacted
- Formatting, linting, and build verification after applied code changes when feasible

## Default feature shape

```text
src/<feature>/
  dto/
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.mapper.ts
  <feature>.module.ts
```

## Prisma guardrails

- Do not auto-generate exploratory migrations.
- Update `prisma/schema.prisma` intentionally.
- Add or edit SQL in `prisma/migrations/` intentionally.
- Inspect existing migrations before creating a new one.
- Keep `./init.sh` rebuild-safe.

## Completion checklist

- Structure follows `docs/backend-structure.md`
- Business logic lives in the service
- Controllers stay thin
- Mapper handles API response shaping
- Prisma schema and migration SQL stay aligned
- Auth and audit implications are handled explicitly
- Formatting, linting, and build verification are run when feasible
- Tests are run when the change is substantial

For the full playbook, follow `docs/skills/nest-feature-development.md`.
