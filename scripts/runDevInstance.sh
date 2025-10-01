#!/bin/bash

# We use node directly rather than going through yarn so that we can use --inspect-publish-uid=http,
# which silences most of the annoying debugger console logs on start.
vercel env pull .env.local --environment=${1:-development} 2> /dev/null && \
node --inspect --inspect-publish-uid=http --no-deprecation ./node_modules/.bin/next dev --turbopack
