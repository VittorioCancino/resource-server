# Agent Context

This repository is a standalone NestJS resource-server extracted from the former IdP monolith. Future coding agents should use this file as the first-stop context.

## Project Purpose

- Validate Hydra-issued bearer tokens for protected resource APIs.
- Enforce resource-server audience and route-specific scopes.
- Own users, labs, and structured API audit logging.
- Treat Hydra/Ory, auth-server, and auth-admin-panel as external integration peers; do not assume co-located repositories, shared root Docker Compose, or monolith bootstrap scripts.

## Project Guardrails

- Treat `./init.sh` as the canonical local bootstrap flow.
- `./init.sh` is responsible for resetting Postgres, running `prisma generate`, `prisma migrate:dev`, seeding, and starting the dev server.
- Local Docker ownership is limited to this repository's Postgres service; Hydra must be provided separately and configured through `HYDRA_ADMIN_URL`.
- Do not introduce alternate local bootstrap scripts unless the user explicitly asks for them.
- Do not reintroduce platform root orchestration or cross-repository bootstrap coupling unless the user explicitly asks for that integration work.

## Prisma Migration Guardrails

- Do not run `prisma migrate dev` just to auto-generate a new migration unless the user explicitly asks for that workflow.
- Prefer deterministic, reviewed schema changes:
  - update `prisma/schema.prisma`
  - add or edit the corresponding SQL migration intentionally in `prisma/migrations/`
- Avoid leaving behind throwaway, malformed, or exploratory migration folders.
- Before adding a migration, inspect existing migrations so the new change fits the established sequence and does not duplicate earlier work.
- Keep migration SQL simple and explicit so `./init.sh` can rebuild the database from scratch without drift.

## Logging / Audit Direction

- Structured request auditing is a desired resource-server feature.
- Prefer persistent, queryable audit records over console-only logging for security-sensitive or operationally important events.
- Redact sensitive values like bearer tokens, secrets, and credentials before persisting request metadata.

## Working Style

- Follow the existing NestJS module structure and keep helpers feature-local when practical.
- Prefer small, understandable changes over broad framework-heavy abstractions.
- If a change affects database lifecycle or auth behavior, explain the impact clearly in the final response.
- After applying code changes for a prompt, run formatting, linting, and build verification when feasible; report any command that could not be run.

## Service Structure

- Follow `docs/backend-structure.md` as the default NestJS backend structure and naming guide.
- Keep controllers thin, services responsible for business logic, mappers feature-local, and shared utilities limited to truly cross-cutting concerns.
- When adding a new feature, default to `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.mapper.ts`, and `dto/` first.
- When adding or changing endpoints, service workflows, or DB-backed request handling, follow `docs/skills/nest-endpoint-data-flow.md`.
- For user-facing DB writes/mutations, use `safeDbCall` and map failures with `mapDbErrorToHttpException`; for best-effort infrastructure logging, use `safeDbCall`, log internally, and swallow persistence failures.

## Feature Skill

- Use `docs/skills/nest-feature-development.md` as the default implementation playbook for new backend functionality and significant feature changes.
- Use `docs/skills/nest-endpoint-data-flow.md` when implementing or modifying HTTP endpoints, service workflows, request/response DTOs, or DB-backed behavior.
- Use `docs/skills/structured-commit-layering.md` when preparing staged commit groups or commit commands for current worktree changes.
