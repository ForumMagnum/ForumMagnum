#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: npm run create-collection -- PascalCasedPluralObjects"
    exit 1
fi

export SKIP_VERCEL_CODE_PULL=true
npm run repl dev "packages/lesswrong/server/codegen/generateNewCollection.ts" "generateNewCollection(\"$1\")"
status=$?

if [ $status -eq 0 ]; then
    npm run generate
fi

exit $status
