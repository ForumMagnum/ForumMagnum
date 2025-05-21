#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: yarn create-collection PascalCasedPluralObjects"
    exit 1
fi

yarn repl dev "packages/lesswrong/server/codegen/generateNewCollection.ts" "generateNewCollection(\"$1\")"
status=$?

if [ $status -eq 0 ]; then
    yarn generate
fi

exit $status
