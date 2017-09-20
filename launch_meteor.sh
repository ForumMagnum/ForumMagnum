dbname="lesswrong2"
password="imagingresidesenvelopecompact"
server="ds155813-a0.mlab.com"
port="55813"

MONGO_URL="mongodb://$dbname:$password@$server:$port,$server:$port/$dbname?replicaSet=rs-ds155813" meteor --settings settings.json;
