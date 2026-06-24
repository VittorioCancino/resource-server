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

create_env_file_from_contract() {
  local env_file=".env.local"
  local tmp_file="${env_file}.tmp"

  [[ -f idp-client.yaml ]] || fail 'Missing idp-client.yaml. Cannot generate .env.local.'
  [[ -f scripts/render-env.mjs ]] || fail 'Missing scripts/render-env.mjs. Cannot generate .env.local.'

  node scripts/render-env.mjs >"${tmp_file}"
  chmod 600 "${tmp_file}"
  mv "${tmp_file}" "${env_file}"

  printf 'Created %s from idp-client.yaml.\n' "${env_file}"
}

require_env_var() {
  local name="$1"
  local value="${!name:-}"

  [[ -n "${value//[[:space:]]/}" ]] || fail "Missing required env variable: ${name}. Regenerate or fill .env.local before rerunning this script."
}

require_env_vars() {
  local name
  local required=(
    DATABASE_HOST
    DATABASE_PORT
    DATABASE_USER
    DATABASE_PASSWORD
    DATABASE_NAME
    DATABASE_URL
    HYDRA_ADMIN_URL
    PORT
  )

  for name in "${required[@]}"; do
    require_env_var "${name}"
  done
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

  if ! ((found)); then
    create_env_file_from_contract
    loaded_env_files+=(".env.local")
    set -a
    # shellcheck disable=SC1091
    source .env.local
    set +a
  fi
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
  require_command node

  load_env_files
  require_env_vars
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

  log_step 'Running database seed hook'
  pnpm run prisma:seed

  log_step 'Starting development server'
  exec pnpm run start:dev
}

main "$@"
