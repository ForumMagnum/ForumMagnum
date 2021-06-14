echo "Running Production Site"

git clone https://forum-read-only:$GITHUB_CREDENTIALS_REPO_PAT@github.com/$GITHUB_CREDENTIALS_REPO_NAME.git Credentials

# Decrypt credentials
cd Credentials
transcrypt -c aes-256-cbc -p $TRANSCRYPT_SECRET -y
cd ..

NODE_OPTIONS=--max_old_space_size=2560 ./build.js -run --settings ./Credentials/$SETTINGS_FILE_NAME --production
