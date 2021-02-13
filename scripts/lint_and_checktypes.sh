#!/bin/bash
# Run eslint and typescript typechecker in parallel. To keep the outputs from
# awkwardly intermingling, the linter runs redirected to a file, which is then
# printed after the type-checker has finished.

mkdir -p tmp

# Run the linter in the background, redirected to a file, and get its pid
yarn run --silent eslint 2>&1 >tmp/lint_result.txt &
lint_pid=$!

# Run the typechecker, not in the background
yarn run --silent tsc
tsc_result=$?

# Wait for the linter to finish
wait $lint_pid
lint_result=$?

# Output the lint results
cat tmp/lint_result.txt

# Exit with failure status if either tsc or lint returned failure
exit_status=$(( $tsc_result || $lint_result ))
exit $exit_status
