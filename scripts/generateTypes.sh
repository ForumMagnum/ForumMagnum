#!/bin/bash

echo "Checking that a local server is running..."
scripts/waitForServer.sh  > /dev/tty 2>&1

echo "Using a running server to generating type definitions. Errors and warnings may"
echo "appear in the server's log output. If this fails, make sure a local server is"
echo "running."

scripts/serverShellCommand.sh "Globals.generateTypes(\"${PWD}\")"
graphql-codegen --config codegen.yml
