#!/bin/bash
echo "Running Production Site"

# Not setting bash strict flags because set -u makes the script abort if some
# variables are undefined, but those variables are optional.
set -ex

# lw-look here: you must define GITHUB_CREDENTIALS_REPO_USER in your AWS EBS config
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

export NODE_OPTIONS="--max_old_space_size=2560 --heapsnapshot-signal=SIGUSR2"
yarn build -run --settings ./Credentials/$SETTINGS_FILE_NAME --production
