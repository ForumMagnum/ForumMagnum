echo "Running Production Site"
git clone https://Discordius:$GITHUB_CREDENTIALS_REPO_PAT@github.com/$GITHUB_CREDENTIALS_REPO_NAME.git Credentials 

NODE_OPTIONS=--max_old_space_size=3072 ./build.js -run --settings ./Credentials/$SETTINGS_FILE_NAME --production
