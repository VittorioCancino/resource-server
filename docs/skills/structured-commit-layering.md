# Structured Commit Layering Skill

Use this workflow when the user wants help staging and committing current repository changes in smaller, ordered commits.

## Goal

Split all changes since the last commit into coherent implementation layers, then provide sequential `git add ... && git commit -m "..."` command blocks for each layer.

This is especially important now that the resource server is a standalone repository: clean commit layers keep runtime behavior, database changes, docs, and integration context reviewable without assuming the former monolith exists.

## Core Rule

Do not create commits yourself while using this skill.

Inspect the worktree, infer logical layers, and output exact commands the user should run manually.

## Inspection Workflow

Run these checks before proposing commit groups:

1. `git status --short --untracked-files=all`
2. `git diff --stat`
3. `git diff`
4. `git diff --cached --stat`
5. `git diff --cached` if anything is staged
6. `git log --oneline -10`

If the branch purpose matters, inspect `git diff <base-branch>...HEAD --stat` when the base branch is known or can be safely inferred.

Read files only when the diff alone is not enough to understand whether two changes belong together.

## Grouping Strategy

Build commits around meaning, not around directories alone.

Prefer this order:

1. Foundations: schema, migrations, shared types, low-level utilities, reusable helpers.
2. Infrastructure: HTTP lifecycle wiring, logging/audit plumbing, auth/scope plumbing, Docker/package manager fixes.
3. Domain logic: API routes, database logic, services, state transitions.
4. Integration/context: local Docker/bootstrap/env docs, external Hydra connection notes, repository boundary updates.
5. Docs, skills, fixtures, or cleanup that support earlier commits.

Keep files together when one change does not make sense without the other.

Split files apart when they represent separate reviewable concerns even if they touched the same feature.

## Good Reasons To Keep Files Together

- Prisma schema changes with matching SQL migrations.
- Route contracts with the service, mapper, and DTOs they introduce.
- A helper plus the single caller that only exists because of that helper.
- Docker/package manager fixes with the package metadata required for the image to build.
- Global HTTP lifecycle modules with the app module wiring that activates them.

## Good Reasons To Split Files Apart

- Docs or agent skills after behavior is implemented.
- Refactors not required for the main feature.
- Formatting-only changes.
- Repository-boundary or integration-context updates that are separate from service implementation.
- Scope/auth policy changes that are independent from logging or infrastructure changes.

## Standalone Repository Heuristics

Prepare commits for this standalone resource-server repository only. Do not propose changes under `auth-server/` or `auth-admin-panel/` unless those directories actually exist in this worktree and the user explicitly includes them.

- Runtime/backend changes under `src/`, `prisma/`, and local verification files belong to the resource-server repo.
- Root `docker-compose.yml`, `.env.example`, `README.md`, and `init.sh` are local resource-server files in this repo, not platform orchestration files.
- Hydra auth-server and admin-panel changes are external integration work; document assumptions here instead of staging absent cross-repo files.
- Agent/skill/docs files inside this repository belong to the resource-server repo unless they are intentionally shared outside this repo.

If a change affects an external service contract, call out the cross-repo coordination needed while keeping this repo's commit self-contained.

## Layering Heuristics

- Put shared contracts before code that consumes them.
- Put migrations with the schema/database layer they belong to.
- Put backend behavior before clients or consumers that depend on it.
- Put generated files with the source change that requires them, unless the repository convention says otherwise.
- Avoid commits that would obviously fail lint/typecheck unless the repository routinely tolerates that during intermediate steps.
- If current changes include unrelated work, call it out explicitly and leave it out of proposed commands unless the user clearly asked for everything.

## Commit Message Guidance

Follow the repository's recent commit style when possible.

Default to concise action-oriented messages such as:

- `Added request audit logging pipeline`
- `Added global HTTP lifecycle modules`
- `Updated users endpoint scopes`
- `Added endpoint data flow agent skill`

Focus the message on why that layer exists, not just a file list.

## Command Format

For each proposed commit, output:

- short label for the layer
- why those files belong together
- file list
- exact command block the user should run

Use explicit `git add <file>... && git commit -m "..."` commands. Do not use interactive git commands.

Quote every path in command blocks with single quotes, even if it looks simple. This keeps generated commands safe to paste into shells such as zsh and bash, where route segment names like `[id]`, wildcard characters such as `*` or `?`, spaces, parentheses, and other metacharacters can be expanded before Git receives them.

Example:

```bash
git add 'src/common/logging/request-logging.middleware.ts' 'src/common/logging/request-logging.service.ts' && git commit -m "Added request audit logging pipeline"
```

If a commit depends on partial-file staging and there is no safe file-level split, say so clearly instead of inventing a command.

## Output Format

Use this plain-text structure:

```text
Commit 1: <label>
Why: <1-2 sentences>
Files:
- path/a
- path/b
Command:
git add 'path/a' 'path/b' && git commit -m "scope: message"

Commit 2: <label>
Why: <1-2 sentences>
Files:
- path/c
Command:
git add 'path/c' && git commit -m "scope: message"

Notes:
- <optional blockers, unrelated files, partial-staging warnings, or cross-repo coordination notes>
```

## Safety Notes

- Never run `git commit`, `git add`, `git reset`, or any other mutating git command as part of this skill.
- Never hide ambiguity. If one file mixes two concerns, say that partial staging or a code split is needed.
- Never suggest committing likely secret files such as `.env` without an explicit warning.
- Prefer a smaller number of meaningful commits over a long list of tiny mechanical ones.
- If the user asks the agent to run commits directly, switch to the repository git safety protocol first and re-check staged/unstaged state.
