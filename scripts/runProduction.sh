echo "Running Production Site"

# lw-look here: you must define GITHUB_CREDENTIALS_REPO_USER in your AWS EBS config
git clone https://$GITHUB_CREDENTIALS_REPO_USER:$GITHUB_CREDENTIALS_REPO_PAT@github.com/$GITHUB_CREDENTIALS_REPO_NAME.git Credentials

# Decrypt credentials if encrypted
if [ -n "$TRANSCRYPT_SECRET" ]; then
    cd Credentials
    transcrypt -c aes-256-cbc -p "$TRANSCRYPT_SECRET" -y
    cd ..
fi

export NODE_OPTIONS="--max_old_space_size=12800 --heapsnapshot-signal=SIGUSR2"
./build.js -run --settings ./Credentials/$SETTINGS_FILE_NAME --production
