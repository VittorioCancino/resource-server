---
name: structured-commit-layering
description: Plan a layered git commit sequence for the current worktree without creating commits. Use this skill whenever the user asks how to split changes into commits, wants a commit plan before opening a PR, asks for a clean git history, wants to group edited files by logical concern or dependency, or says things like "how should I commit this", "split this into layered commits", "prepare commit commands", "organize my branch history", or "prepare a PR commit plan".
compatibility:
  tools: Bash, Read, Glob, Grep
---

# Structured Commit Layering

Analyze the current branch changes and propose a clean commit sequence that the user can run manually.

Why this skill exists: a good history is easier to review when foundational changes, runtime behavior, docs/skills, and external integration context are separated instead of mixed into one large commit.

## Required Context

Read these files before preparing commit commands:

1. `AGENTS.md`
2. `docs/skills/structured-commit-layering.md`

## Core Rule

Do not create commits yourself.

Your job is to inspect the worktree, infer logical layers, and output exact commands the user should run.

## Required Checks

Start by gathering the branch state:

```bash
git status --short --untracked-files=all
git diff --stat
git diff --cached --stat
git log --oneline -10
```

Also inspect `git diff` and `git diff --cached` when needed to understand whether files belong together.

## Grouping Rules

- Build commits around meaning, not around directories alone.
- Keep schema and matching migration SQL together.
- Keep feature controller/service/mapper/DTO/module files together when they implement one feature.
- Keep documentation/agent workflow changes separate from runtime code.
- Keep Docker/package manager fixes separate from feature behavior when practical.
- Keep repository-boundary or integration-context docs separate from service implementation when practical.
- Call out shared files that mix multiple logical changes and require partial staging.

## Standalone Repository Rules

- Prepare commit groups for this standalone resource-server repository only.
- Runtime/backend changes under `src/`, `prisma/`, and local tests belong to this repo.
- Root `docker-compose.yml`, `.env.example`, `README.md`, and `init.sh` are local resource-server files, not platform orchestration files.
- Hydra auth-server and admin-panel changes are external integration work; document assumptions here instead of staging absent cross-repo files.
- Agent/skill/docs files inside this repository belong to the resource-server repo unless intentionally shared outside this repo.

## Command Format

Output exact commands using this shape:

```bash
git add 'file-a' 'file-b' && git commit -m "Commit message"
```

Quote every path with single quotes.

Never use interactive git commands.

For the full workflow, follow `docs/skills/structured-commit-layering.md`.
