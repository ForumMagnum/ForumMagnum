#!/bin/bash
set -euo pipefail

# Start the SimpleMod Next app on :3030 with a working PG_URL / ENV_NAME.
# Worktrees don't share gitignored .env.local, so if this checkout doesn't
# have one we reuse another worktree's or pull from Vercel.

cd "$(dirname "$0")/.."

ensure_env_local() {
  if [[ -f .env.local ]]; then
    return 0
  fi

  if [[ -d .vercel ]] && [[ "${SKIP_VERCEL_CODE_PULL:-}" != true ]]; then
    echo "No .env.local — pulling from Vercel..."
    if vercel env pull .env.local --yes --environment=development 2>/dev/null \
      || vercel env pull .env.local --yes --environment=production; then
      return 0
    fi
    echo "Vercel env pull failed."
  fi

  local worktree
  while IFS= read -r worktree; do
    if [[ -n "$worktree" && "$worktree" != "$PWD" && -f "$worktree/.env.local" ]]; then
      echo "No .env.local — linking from $worktree"
      ln -s "$worktree/.env.local" .env.local
      return 0
    fi
  done < <(git worktree list --porcelain | awk '/^worktree / { print $2 }')

  echo "No .env.local found."
  echo "Fix: copy one from your main ForumMagnum checkout, or run:"
  echo "  vercel link && vercel env pull .env.local"
  exit 1
}

require_pg_url() {
  if ! grep -qE '^PG_URL=.+' .env.local; then
    echo ".env.local exists but PG_URL is missing or empty."
    exit 1
  fi
}

ensure_env_local
require_pg_url

echo "Starting SimpleMod on http://localhost:3030"
exec node --no-deprecation ./node_modules/.bin/next dev simplemod --turbopack -p 3030 "$@"
