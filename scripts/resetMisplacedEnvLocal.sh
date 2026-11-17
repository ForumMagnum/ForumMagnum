#!/bin/bash

# Environment variables synced from Vercel used to be written to .env.local,
# which is meant for local overrides; they are now written to .env. A leftover
# synced .env.local would shadow .env with stale values, so empty it if it
# still has the header that `vercel env pull` puts at the top of its output.

if [[ -f .env.local && "$(head -n 1 .env.local)" == "# Created by Vercel CLI" ]]; then
  echo "Emptying .env.local, which was written by an old Vercel sync. Synced environment variables are now in .env; .env.local is for local overrides."
  : > .env.local
fi
