echo "Running Production Site"
sudo chmod 755 ./
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install
nvm use
yarn
./build.js -run --settings settings.json