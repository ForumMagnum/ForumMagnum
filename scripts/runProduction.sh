#!/bin/bash
echo "Running Production Site"

# Not setting bash strict flags because set -u makes the script abort if some
# variables are undefined, but those variables are optional.
#set -eux

# lw-look here: you must define GITHUB_CREDENTIALS_REPO_USER in your AWS EBS config
echo "Cloning credentials repo"
git clone https://$GITHUB_CREDENTIALS_REPO_USER:$GITHUB_CREDENTIALS_REPO_PAT@github.com/$GITHUB_CREDENTIALS_REPO_NAME.git Credentials

# Decrypt credentials if encrypted
if [ -n "$TRANSCRYPT_SECRET" ]; then
    echo "Using transcrypt to decrypt credentials"
    cd Credentials
    transcrypt -c aes-256-cbc -p "$TRANSCRYPT_SECRET" -y
    cd ..
else
    echo "Not using transcrypt"
fi

# Run outstanding database migrations
MODE=$NODE_ENV
if [ "$MODE" = "production" ]; then
    MODE=prod
fi
PG_FILE=./Credentials/$MODE-pg-conn.txt
if test -f "$PG_FILE"; then
    export PG_URL=`cat $PG_FILE`
    export FORUM_MAGNUM_MIGRATE_CI=1
    # TODO FIXME
    # yarn migrate up $MODE
fi

export NODE_OPTIONS="--max_old_space_size=2560 --heapsnapshot-signal=SIGUSR2"
./build.js -run --settings ./Credentials/$SETTINGS_FILE_NAME --production
