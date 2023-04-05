OP=$1
ENV=$2
SCHEMA=./schema/atlas_schema.sql

if [ "$OP" = "generate" ]; then
	./scripts/serverShellCommand.sh --wait "Globals.generateAtlasSchema('${SCHEMA}')"
	exit 0
fi

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

atlas schema $OP --from $CONN --to file://$PWD/$SCHEMA --dev-url $DEVURL
