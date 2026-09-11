#!/bin/bash

# Spins up everything needed to exercise the research-sandbox feature locally:
#   1. A Tailscale Funnel pointing at the Next.js dev server so the
#      Vercel-hosted supervisor can call back to this machine.
#   2. The local hocuspocus collab server (fly/hocuspocusServer).
#   3. The Next.js dev server with RESEARCH_BACKEND_PUBLIC_URL wired to the
#      funnel URL and HOCUSPOCUS_URL wired to ws://localhost:8080.
#
# Each developer gets a stable per-machine URL (<host>.<tailnet>.ts.net) from
# their own tailnet, so no shared infra or per-dev env-var coordination is
# needed. Extra args are forwarded to scripts/runDevInstance.sh (e.g. dev|prod,
# or nextjs flags like --port).

print_help () {
  cat <<-END
		Usage: scripts/runDevWithResearchSandbox.sh [environment-name] [nextjs-options]

		Starts a Tailscale Funnel, the local hocuspocus server, and the Next.js
		dev server with the environment variables needed by the research sandbox
		feature. Use Ctrl+C to shut everything down.

		Prerequisites:
		  - Tailscale installed (brew install tailscale) and signed in.
		  - HTTPS + Funnel enabled for your tailnet in the admin console.
	END
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  print_help
  exit 0
fi

if ! command -v tailscale >/dev/null 2>&1; then
  echo "Error: tailscale not found on PATH. Install with: brew install tailscale" >&2
  echo "       (App Store installs require running 'Install CLI' from the menubar.)" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOCUSPOCUS_DIR="$REPO_ROOT/fly/hocuspocusServer"
DEV_PORT=3000

# Only the supervisor-callback prefix is exposed through the funnel. The
# tailnet hostname is published in public Certificate Transparency logs the
# moment its HTTPS cert is issued, so opportunistic scrapers find it within
# minutes; scoping the funnel to this prefix keeps `/.env`/`/v2/_catalog`/etc.
# from ever reaching the dev server.
FUNNEL_PATH="/api/research/agent"

HOCUSPOCUS_PID=""

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
  echo "[run-research] Resetting Tailscale Funnel"
  tailscale funnel reset >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# 1. Resolve this machine's stable funnel hostname from tailscaled. The funnel
#    URL is `https://<Self.DNSName>` (a permanent property of the tailnet
#    node), so we can compute it before the funnel is even configured.
TUNNEL_HOST="$(tailscale status --json 2>/dev/null | \
  python3 -c 'import json, sys
data = json.load(sys.stdin)
print(data.get("Self", {}).get("DNSName", "").rstrip("."))' 2>/dev/null)"
if [[ -z "$TUNNEL_HOST" ]]; then
  echo "[run-research] Could not resolve Tailscale hostname. Is tailscaled running and signed in?" >&2
  exit 1
fi
# The supervisor uses this as its `backendBaseUrl`; it always appends
# `/api/research/agent/...`, so the public URL must be the funnel host root.
TUNNEL_URL="https://${TUNNEL_HOST}"
echo "[run-research] Funnel URL: $TUNNEL_URL (scoped to $FUNNEL_PATH)"

# 2. Configure the Tailscale Funnel to proxy a single path prefix to the dev
#    server. `--bg` writes the config to tailscaled and returns; the funnel
#    itself is served by tailscaled, so there is no long-running process for
#    this script to babysit. `--yes` suppresses the interactive enablement
#    prompt that would otherwise hang the script when the node lacks the
#    `funnel` ACL attribute — we want a fast failure with a clear error
#    instead. `--set-path` strips the public prefix before proxying, so the
#    backend target URL has to include the same prefix to round-trip the path.
echo "[run-research] Starting Tailscale Funnel ${FUNNEL_PATH} -> http://localhost:${DEV_PORT}${FUNNEL_PATH}"
if ! tailscale funnel --bg --yes \
    --set-path="$FUNNEL_PATH" \
    "http://localhost:${DEV_PORT}${FUNNEL_PATH}" >/dev/null; then
  echo "[run-research] tailscale funnel failed. Check that HTTPS + Funnel are enabled for your tailnet." >&2
  exit 1
fi

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
