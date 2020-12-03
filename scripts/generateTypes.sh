#!/bin/bash

echo "Checking that a local server is running..."
scripts/waitForServer.sh

echo "Using a running server to generating type definitions. Errors and warnings may"
echo "appear in the server's log output. If this fails, make sure a local server is"
echo "running and reachable with 'meteor shell'."

echo "Vulcan.generateTypes(\"${PWD}\")" \
  |meteor shell \
  >/dev/null

graphql-codegen --config codegen.yml

