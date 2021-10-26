echo "Running Production Site"
git clone https://Discordius:$GITHUB_CREDENTIALS_REPO_PAT@github.com/$GITHUB_CREDENTIALS_REPO_NAME.git Credentials 

export NODE_OPTIONS="--max_old_space_size=2560 --heapsnapshot-signal=SIGUSR2"
./build.js -run --settings ./Credentials/$SETTINGS_FILE_NAME --production

