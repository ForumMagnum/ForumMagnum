#!/bin/bash

echo "Using a running server to generating type definitions. Errors and warnings may"
echo "appear in the server's log output. If this fails, make sure a local server is"
echo "running and reachable with 'meteor shell'."

echo "Vulcan.generateFragmentTypes(\"${PWD}/packages/lesswrong/lib/fragmentTypes.d.ts\")" \
  |meteor shell \
  >/dev/null

graphql-codegen --config codegen.yml

