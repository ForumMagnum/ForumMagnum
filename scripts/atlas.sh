OP=$1
ENV=$2

if ! [[ "$OP" =~ ^(apply|diff)$ ]]; then
	echo "Invalid operation:" $OP
	echo "Allowed operations are 'apply' and 'diff'"
	exit 1
fi

if ! [[ "$ENV" =~ ^(dev|staging|prod)$ ]]; then
	echo "Invalid environment:" $ENV
	echo "Allowed environments are 'dev', 'staging' and 'prod'"
	exit 1
fi

CONN=`cat ../ForumCredentials/$ENV-pg-conn.txt`?search_path=public
DEVURL=`cat ../ForumCredentials/atlas-schema-diff-conn.txt`?search_path=public
SCHEMA=file://$PWD/schema/accepted_schema.sql

atlas schema $OP --from $CONN --to $SCHEMA --dev-url $DEVURL
