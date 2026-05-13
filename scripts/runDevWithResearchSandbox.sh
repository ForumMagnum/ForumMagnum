#!/bin/bash

# Spins up everything needed to exercise the research-sandbox feature locally:
#   1. A cloudflared quick tunnel pointing at the Next.js dev server so the
#      Vercel-hosted supervisor can call back to this machine.
#   2. The local hocuspocus collab server (fly/hocuspocusServer).
#   3. The Next.js dev server with RESEARCH_BACKEND_PUBLIC_URL wired to the
#      tunnel and HOCUSPOCUS_URL wired to ws://localhost:8080.
#
# Extra args are forwarded to scripts/runDevInstance.sh (e.g. dev|prod, or
# nextjs flags like --port).

print_help () {
  cat <<-END
		Usage: scripts/runDevWithResearchSandbox.sh [environment-name] [nextjs-options]

		Starts a cloudflared quick tunnel, the local hocuspocus server, and the
		Next.js dev server with the environment variables needed by the research
		sandbox feature. Use Ctrl+C to shut everything down.
	END
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  print_help
  exit 0
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "Error: cloudflared not found on PATH. Install with: brew install cloudflared" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOCUSPOCUS_DIR="$REPO_ROOT/fly/hocuspocusServer"
DEV_PORT=3000

CLOUDFLARED_PID=""
HOCUSPOCUS_PID=""
TUNNEL_LOG=""

stop_pid_tree () {
  local pid="$1"
  [[ -z "$pid" ]] && return 0
  if kill -0 "$pid" 2>/dev/null; then
    pkill -P "$pid" 2>/dev/null || true
    kill "$pid" 2>/dev/null || true
  fi
}

cleanup () {
  trap - EXIT INT TERM
  echo ""
  echo "[run-research] Stopping background processes..."
  stop_pid_tree "$HOCUSPOCUS_PID"
  stop_pid_tree "$CLOUDFLARED_PID"
  if [[ -n "$TUNNEL_LOG" && -f "$TUNNEL_LOG" ]]; then
    rm -f "$TUNNEL_LOG"
  fi
}
trap cleanup EXIT INT TERM

# 1. Start cloudflare quick tunnel pointing at the dev server.
TUNNEL_LOG="$(mktemp -t cloudflared-tunnel.XXXXXX)"
echo "[run-research] Starting cloudflared quick tunnel -> http://localhost:$DEV_PORT"
cloudflared tunnel --no-autoupdate --url "http://localhost:$DEV_PORT" \
  >"$TUNNEL_LOG" 2>&1 &
CLOUDFLARED_PID=$!

# 2. Wait for the trycloudflare.com URL to appear (usually a few seconds).
TUNNEL_URL=""
for _ in $(seq 1 60); do
  if ! kill -0 "$CLOUDFLARED_PID" 2>/dev/null; then
    echo "[run-research] cloudflared exited before publishing a URL. Log:" >&2
    cat "$TUNNEL_LOG" >&2
    exit 1
  fi
  TUNNEL_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1)"
  [[ -n "$TUNNEL_URL" ]] && break
  sleep 1
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "[run-research] Timed out waiting for cloudflare tunnel URL. Last log:" >&2
  cat "$TUNNEL_LOG" >&2
  exit 1
fi

echo "[run-research] Tunnel URL: $TUNNEL_URL"

# 3. Start the local hocuspocus server in the background.
echo "[run-research] Starting hocuspocus server (yarn start:dev in fly/hocuspocusServer)"
(cd "$HOCUSPOCUS_DIR" && yarn start:dev) &
HOCUSPOCUS_PID=$!

# 4. Run the dev server in the foreground via the existing helper.
echo "[run-research] Starting Next.js dev server"
echo "[run-research]   RESEARCH_BACKEND_PUBLIC_URL=$TUNNEL_URL"
echo "[run-research]   HOCUSPOCUS_URL=ws://localhost:8080"
RESEARCH_BACKEND_PUBLIC_URL="$TUNNEL_URL" \
HOCUSPOCUS_URL="ws://localhost:8080" \
  "$REPO_ROOT/scripts/runDevInstance.sh" "$@"
