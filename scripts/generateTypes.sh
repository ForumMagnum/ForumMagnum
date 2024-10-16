#!/bin/bash

scripts/waitForServer.sh

echo "Using a running server to generating type definitions. Errors and warnings may"
echo "appear in the server's log output. If this fails, make sure a local server is"
echo "running."

scripts/serverShellCommand.sh "Globals.generateTypesAndSQLSchema(\"${PWD}\")"
graphql-codegen --config codegen.yml
