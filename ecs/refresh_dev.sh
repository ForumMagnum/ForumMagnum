#!/usr/bin/env bash
set -euo pipefail

: "${PROD_CONNECTION_STRING:?}"
: "${DEV_CONNECTION_STRING:?}"

pg_dump -w -Fc -d "$PROD_CONNECTION_STRING" \
  -T '"ClientIds"' -T '"LWEvents"' -T '"FieldChanges"' -T '"PostEmbeddings"' -T '"DebouncerEvents"' \
  -x --no-owner \
| pg_restore -w -c -n public -d "$DEV_CONNECTION_STRING" -x --no-owner
