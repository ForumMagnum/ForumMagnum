#!/bin/bash

# Use the first argument as the environment, and the second as the forumType, or dev/lw if not provided
export BROWSERSLIST_IGNORE_OLD_DATA=1
export NEXT_TELEMETRY_DISABLED=1

mkdir -p tmp

# Generate Next route types in the background; print output after main codegen.
yarn --silent next typegen >tmp/next_typegen_result.txt 2>&1 &
next_typegen_pid=$!

yarn --silent \
  repl-codegen ${1:-dev} ${2:-lw} codegen \
  "packages/lesswrong/server/codegen/generateTypes.ts" "generateTypesAndSQLSchema('.')"
codegen_result=$?

wait $next_typegen_pid
next_typegen_result=$?

cat tmp/next_typegen_result.txt

exit_status=$(( $codegen_result || $next_typegen_result ))
exit $exit_status
