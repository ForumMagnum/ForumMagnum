#!/bin/bash
# Capture the environment export from runDevInstance.ts, if present
ENV_EXPORT=$(yarn --silent ts-node -r tsconfig-paths/register --swc --project tsconfig-repl.json scripts/runDevInstance.ts $@)

# Check if the script succeeded
if [ $? -eq 0 ]; then
  # Evaluate the export command to set the environment variable
  eval "$ENV_EXPORT"
  
  # Now run node with the environment variable set
  # We use node directly rather than going through yarn so that we can use --inspect-publish-uid=http,
  # which silences most of the annoying debugger console logs on start.
  node --inspect --inspect-publish-uid=http --no-deprecation ./node_modules/.bin/next dev --turbopack
fi
