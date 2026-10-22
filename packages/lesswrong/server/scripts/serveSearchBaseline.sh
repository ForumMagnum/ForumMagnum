#!/usr/bin/env bash
# Serve the search baseline viewer and restart it whenever search code changes,
# so live results and "Run current code" always use the code on disk.
# A start that fails within 30 seconds is retried, because concurrent
# `yarn repl` starts can collide while pulling the Vercel environment.
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)" || exit 1
failures=0
while true; do
  started=$SECONDS
  yarn -s repl dev lw packages/lesswrong/server/scripts/searchBaseline.ts "serveSearchBaseline(${1:-4111}, true)"
  status=$?
  if [ "$status" -eq 75 ]; then
    failures=0
  elif [ $((SECONDS - started)) -lt 30 ] && [ "$failures" -lt 5 ]; then
    failures=$((failures + 1))
    echo "Search baseline server failed to start; retrying ($failures/5)"
    sleep 3
  else
    break
  fi
done
