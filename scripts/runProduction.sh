#!/bin/bash
echo "Running Production Site"

set -eux

# lw-look here: you must define GITHUB_CREDENTIALS_REPO_USER in your AWS EBS config
git clone https://$GITHUB_CREDENTIALS_REPO_USER:$GITHUB_CREDENTIALS_REPO_PAT@github.com/$GITHUB_CREDENTIALS_REPO_NAME.git Credentials

# Decrypt credentials if encrypted
if [ -n "$TRANSCRYPT_SECRET" ]; then
    cd Credentials
    transcrypt -c aes-256-cbc -p "$TRANSCRYPT_SECRET" -y
    cd ..
fi

# Run outstanding database migrations
MODE=$NODE_ENV
if [ "$MODE" = "production" ]; then
    MODE=prod
fi
PG_FILE=./Credentials/$MODE-pg-conn.txt
if test -f "$PG_FILE"; then
    export PG_URL=`cat $PG_FILE`
    yes n | head | yarn migrate up $MODE
fi

export NODE_OPTIONS="--max_old_space_size=2560 --heapsnapshot-signal=SIGUSR2"
./build.js -run --settings ./Credentials/$SETTINGS_FILE_NAME --production
