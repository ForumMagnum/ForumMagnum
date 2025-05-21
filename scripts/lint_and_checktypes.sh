#!/bin/bash
# Run eslint and the typescript typechecker on the main project, and eslint and
# the typescript typechecker on CkEditor plugins, in parallel. To keep the
# outputs from awkwardly intermingling, three of these four jobs run run
# redirected to a file, which is then printed after all four have finished.

CKEDITOR_DIR="ckEditor"
mkdir -p tmp

# Run the linter on the main project in the background, redirected to a file,
# and get its pid
yarn run --silent eslint 2>&1 >tmp/lint_result.txt &
lint_pid=$!

# Run the linter for ckeditor plugins
(cd "$CKEDITOR_DIR" && yarn run --silent lint 2>&1 >../tmp/ckeditor_lint_result.txt) &
ckeditor_lint_pid=$!

# Run the typechecker on ckeditor plugins
(cd "$CKEDITOR_DIR" && yarn run --silent tsc 2>&1 >../tmp/ckeditor_tsc_result.txt) &
ckeditor_tsc_pid=$!

# Run the typechecker on the main project, not in the background
yarn run --silent tsc
tsc_result=$?

# Wait for background tasks to finish
wait $lint_pid
lint_result=$?
wait $ckeditor_lint_pid
ckeditor_lint_result=$?
wait $ckeditor_tsc_pid
ckeditor_tsc_result=$?

# Output the lint results
cat tmp/lint_result.txt
cat tmp/ckeditor_lint_result.txt
cat tmp/ckeditor_tsc_result.txt

# Exit with failure status if either tsc or lint returned failure
exit_status=$(( $tsc_result || $lint_result || $ckeditor_lint_result || $ckeditor_tsc_result ))
exit $exit_status
