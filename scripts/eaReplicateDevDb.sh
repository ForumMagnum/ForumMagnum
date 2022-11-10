#!/bin/bash
set -euxo pipefail

PG_URL=`cat ../ForumCredentials/dev-staging-admin-pg-conn.txt`

# Kill connections to this replica db

psql $PG_URL -c "DROP DATABASE IF EXISTS " #replica db

# Kill connections to the main dev db

# create with template
