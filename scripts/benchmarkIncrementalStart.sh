#!/bin/bash
# benchmarkIncrementalStart: Given an already-running idle server on
# locahost:3000, make a spurious change (by writing a file
# packages/lesswrong/spuriousChange.js) and time how long it is until next
# completion of a load of the front page.
user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"

mkdir -p tmp

# Precondition: A server is running on localhost:3000 and ready to server
if ! curl --silent --show-error --user-agent "$user_agent" -o tmp/localFrontPage http://localhost:3000/; then
  echo "Server not ready on localhost:3000"
  exit 1
fi


# Make a change
echo "const someVar=${RANDOM}" >packages/lesswrong/spuriousChange.js

# Time how long until we get a successful page refresh
time (
  # Delay to make sure the server has noticed the change
  sleep 2
  # Retry until successful. The request that eventually succeeds will be a long
  # one (it gets picked up by meteor's proxy and held idle while compilation
  # happens), so the delay between retries doesn't matter.
  while ! curl --silent --show-error --user-agent "$user_agent" -o tmp/localFrontPage http://localhost:3000/
  do
    sleep 2
  done
)

