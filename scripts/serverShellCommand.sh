#!/bin/bash
# Run Javascript in an existing server process - note that this is disabled on
# prod and staging servers for security reasons

WAIT=false
if [ "$1" = "--wait" ]; then
	WAIT=true
	shift
fi

COMMAND=`sed 's/"/\\\\"/g' <<< $1`
echo "Checking that a local server is running..."
scripts/waitForServer.sh

curl -X POST http://localhost:3000/api/serverShellCommand \
	-d "{\"command\": \"$COMMAND\", \"wait\": $WAIT}" \
	-H "Content-Type: application/json"
