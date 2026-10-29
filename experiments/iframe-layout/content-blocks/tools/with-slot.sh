#!/bin/zsh
# Runs a command while holding one of 3 browser slots against the shared dev server (port 3000), so
# parallel agents queue their browser runs instead of piling onto it. Usage: with-slot.sh <cmd...>
# Also sets PW_CHROMIUM (Chrome for Testing 156) and PATH (node 24).
export PATH="$HOME/.local/node/bin:$HOME/.local/bin:$PATH"
export PW_CHROMIUM="$HOME/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
LOCKS="$HOME/lw-exp3-proto/.slots"; mkdir -p "$LOCKS"
slot=""
while [ -z "$slot" ]; do
  for i in 1 2 3; do
    if mkdir "$LOCKS/$i" 2>/dev/null; then slot=$i; echo $$ > "$LOCKS/$i/pid"; break; fi
    # a slot whose holder died is free again
    holder=$(cat "$LOCKS/$i/pid" 2>/dev/null); [ -n "$holder" ] && ! kill -0 $holder 2>/dev/null && rm -rf "$LOCKS/$i"
  done
  [ -z "$slot" ] && sleep 2
done
trap 'rm -rf "$LOCKS/$slot"' EXIT INT TERM
"$@"
