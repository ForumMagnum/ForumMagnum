# This script is used for generating the site database schema and synching it
# with a Postgres database.
#
# Generally, you should use the yarn wrapper in package.json instead of calling
# it directly.
#
# Usage:
#   Generate a new database schema from the code
#     yarn schema generate
#   Perform a diff of the current generated schema against the database
#     yarn schema diff [dev|staging|prod]
#   Apply the current schema to the database
#     yarn schema apply [dev|staging|prod]
#
# You should always run `yarn schema diff ...` and sanity check the output
# before running `yarn schema apply ...`.

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
