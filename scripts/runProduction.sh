echo "Running Production Site"
git clone https://Discordius:$GITHUB_CREDENTIALS_REPO_PAT@github.com/$GITHUB_CREDENTIALS_REPO_NAME.git Credentials 

./build.js -run --settings ./Credentials/$SETTINGS_FILE_NAME
