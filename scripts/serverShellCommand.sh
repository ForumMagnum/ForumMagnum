#!/bin/bash
# Run Javascript in an existing server process. This works by putting the script
# into ./tmp/pendingShellCommands, where the server will detect it, run it then
# delete it. (See watchForShellCommands in serverStartup.ts)

COMMAND="$1"
scripts/waitForServer.sh

echo "$COMMAND" >tmp/pendingShellCommands/command$$.js

