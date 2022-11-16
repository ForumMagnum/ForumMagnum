#!/bin/bash
# Measure from-scratch and incremental server startup times, from 'yarn start'
# to completion of a local pageload, and from changing a file in 
# packages/lesswrong/components to completion of a local pageload. Port 3000
# must be available while this runs.

mkdir -p tmp

# Start the server, asynchronously
yarn start-local-db &
# Repeatedly try to download localhost:3000, until successful. Output the time
# spent retrying and downloading.
time (
  while ! curl --silent -o tmp/localFrontPage http://localhost:3000/
  do
    sleep 2
  done
)

# Server gets killed by SIGHUP when this script exits
