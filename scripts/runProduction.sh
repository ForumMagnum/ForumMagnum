echo "Running Production Site"
sudo chmod 755 ./
. ~/.nvm/nvm.sh
nvm use
yarn
./build.js -run --settings settings.json