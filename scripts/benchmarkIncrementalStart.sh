#!/bin/bash
# benchmarkIncrementalStart: Given an already-running idle server on
# locahost:3000, make a spurious change (by writing a file
# packages/lesswrong/spuriousChange.js) and time how long it is until next
# completion of a load of the front page.
#
# Precondition: A server is running on localhost:3000 and ready to server

user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"

mkdir -p tmp

# Make a change
cat <<END >packages/lesswrong/components/spuriousChange.ts
// GENERATED FILE
// This file gets rewritten by scripts/benchmarkIncrementalStart.sh as a way
// of realistically triggering a server restart, as though a source file had
// been edited.
const someVar = ${RANDOM}

END

# Time how long until we get a successful page refresh
time (
  # Delay to make sure the server has noticed the change
  # This is necessary under Meteor, which will keep routing requests to the old
  # version for a little while after the change has happened. Make sure this
  # minimum delay is shorter than the actual incremental reload time, but
  # long enough to avoid this issue.
  sleep 5
  # Retry until successful. The request that eventually succeeds will be a long
  # one (it gets picked up by meteor's proxy and held idle while compilation
  # happens), so the delay between retries doesn't matter.
  while ! curl --silent --show-error --user-agent "$user_agent" -o tmp/localFrontPage http://localhost:3000/
  do
    sleep 0.5
  done
)

