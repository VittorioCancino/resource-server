#!/usr/bin/env bash

set -Eeuo pipefail

readonly SPINNER_FRAMES=(
  '|'
  '/'
  '-'
  '\\'
)

spinner_active=0
loaded_env_files=()

cleanup() {
  if ((spinner_active)); then
    printf '\n'
  fi
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

log_step() {
  printf '\n==> %s\n' "$1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

load_env_files() {
  local found=0
  local env_file

  for env_file in ../.env .env .env.local; do
    if [[ -f "$env_file" ]]; then
      loaded_env_files+=("$env_file")
      set -a
      # shellcheck disable=SC1090
      source "$env_file"
      set +a
      found=1
    fi
  done

  ((found)) || fail 'Missing env file. Copy .env.example to .env or create ../.env before running this script.'
}

format_env_files() {
  local IFS=', '
  printf '%s' "${loaded_env_files[*]}"
}

wait_for_postgres() {
  local timeout_seconds="${1:-60}"
  local message="${2:-Waiting for PostgreSQL to accept connections}"
  local start_time=$SECONDS
  local frame_index=0

  spinner_active=1

  while true; do
    if docker compose exec -T postgres sh -c \
      'pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
      >/dev/null 2>&1; then
      spinner_active=0
      printf '\r%s done.\033[K\n' "$message"
      return 0
    fi

    if ((SECONDS - start_time >= timeout_seconds)); then
      spinner_active=0
      printf '\r%s timed out after %ss.\033[K\n' "$message" "$timeout_seconds" >&2
      return 1
    fi

    printf '\r%s %s' \
      "$message" \
      "${SPINNER_FRAMES[frame_index % ${#SPINNER_FRAMES[@]}]}"
    sleep 0.1
    ((frame_index += 1))
  done
}

main() {
  trap cleanup EXIT INT TERM

  require_command docker
  require_command pnpm

  load_env_files
  log_step "Using env files: $(format_env_files)"

  export PORT="${PORT:-3003}"

  docker compose version >/dev/null 2>&1 || fail 'Docker Compose plugin is required.'
  docker compose config >/dev/null

  log_step 'Installing dependencies'
  pnpm install

  log_step 'Resetting PostgreSQL data'
  docker compose down -v --remove-orphans

  log_step 'Starting PostgreSQL container'
  docker compose up -d postgres

  printf '\n'
  wait_for_postgres 60 'Waiting for PostgreSQL to accept connections'

  log_step 'Generating Prisma client'
  pnpm run prisma:generate

  log_step 'Running Prisma migrations'
  pnpm run prisma:migrate:dev

  log_step 'Seeding database'
  pnpm run prisma:seed

  log_step 'Starting development server'
  pnpm run start:dev
}

main "$@"
