if tput setaf 1 &> /dev/null; then
  blue=$(tput setaf 153)
  bold=$(tput bold)
else
  blue=""
  bold=""
fi


command -v jq >/dev/null 2>&1 || { echo >&2 ${bold}${blue}"
LessWrong2 requires the commandline tool 'jq' to launch a local server.
Please install jq (on Mac, 'brew install jq')"; exit 1; }

dbname=$(cat settings.json | jq -r .localServer.dbname)
password=$(cat settings.json | jq -r .localServer.password)
server=$(cat settings.json | jq -r .localServer.server)
port=$(cat settings.json | jq -r .localServer.port)

if [ "$password" != "example" ]; then
  url="mongodb://$dbname:$password@$server:$port,$server:$port/$dbname?replicaSet=rs-ds155813"
  echo $url
  MONGO_URL="$url" meteor --settings settings.json;
else
  echo "Failed to launch server."
  echo "Please ask for the development database password, and add it to settings.json under 'localServer'"
fi
