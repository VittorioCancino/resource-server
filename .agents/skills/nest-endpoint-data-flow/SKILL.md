# Nest Endpoint Data Flow

Use this skill when adding or changing HTTP endpoints, service workflows, DB-backed behavior, or request/response contracts in this repository.

## Required context

Read these files before coding:

1. `AGENTS.md`
2. `docs/backend-structure.md`
3. `docs/skills/nest-feature-development.md`
4. `docs/skills/nest-endpoint-data-flow.md`

## Standard flow

Use this endpoint flow by default:

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

## Required conventions

- Controllers stay thin and do not call Prisma.
- Services own business workflow and DB outcomes.
- Request DTOs use `class-validator`.
- Response DTOs define API shape; do not expose Prisma models directly.
- Mappers convert Prisma/service results into response DTOs.
- Self-service ownership comes from `request.authToken`, not body identity fields.
- Scope constants live in `src/auth/constants/auth.constants.ts`.
- Cross-cutting HTTP lifecycle registration lives in `src/common/http/`.
- Concern-specific implementations stay in their concern folder.

## DB error handling convention

For user-facing feature endpoints:

```text
safeDbCall + mapDbErrorToHttpException + throw mapped exception
```

Use this for writes, mutations, unique constraints, relation connects, upserts, deletes, and DB operations where user/domain input can fail.

For simple reads:

- direct Prisma reads are acceptable
- handle `null` or empty results explicitly

For best-effort infrastructure logging:

```text
safeDbCall + internal Logger + swallow failure
```

Do not let audit/log persistence failures break the original request.

## Verification

After applied code changes, run when feasible:

```bash
pnpm run format
pnpm run lint
pnpm run build
```

For the full workflow, follow `docs/skills/nest-endpoint-data-flow.md`.
