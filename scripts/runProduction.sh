#!/bin/bash
echo "Running Production Site"

# Not setting bash strict flags because set -u makes the script abort if some
# variables are undefined, but those variables are optional.
set -ex

# Settings may be supplied from a separate credentials repo, or included in this repo.
# If all of $GITHUB_CREDENTIALS_REPO_USER, $GITHUB_CREDENTIALS_REPO_PAT, $GITHUB_CREDENTIALS_REPO_NAME.
# Require that all or none of these are provided
if [ -n "$GITHUB_CREDENTIALS_REPO_USER" ] && [ -n "$GITHUB_CREDENTIALS_REPO_PAT" ] && [ -n "$GITHUB_CREDENTIALS_REPO_NAME" ]; then
    echo "Cloning credentials repo"
    rm -rf Credentials/
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
    SETTINGS_PATH="./Credentials/$SETTINGS_FILE_NAME"
elif [ -z "$GITHUB_CREDENTIALS_REPO_USER" ] && [ -z "$GITHUB_CREDENTIALS_REPO_PAT" ] && [ -z "$GITHUB_CREDENTIALS_REPO_NAME" ]; then
    echo "Credentials repo not provided, using settings from current working directory"
    SETTINGS_PATH="./$SETTINGS_FILE_NAME"
else
    echo "Error: You must provide all or none of the GITHUB_CREDENTIALS_REPO_USER, GITHUB_CREDENTIALS_REPO_PAT, and GITHUB_CREDENTIALS_REPO_NAME environment variables."
    exit 1
fi

export NODE_OPTIONS="--max_old_space_size=2560 --heapsnapshot-signal=SIGUSR2"
./build.js -run --settings $SETTINGS_PATH --production