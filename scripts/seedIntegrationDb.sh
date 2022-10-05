#!/bin/bash

./build.js -run --mongoUrl ${TESTING_DB_URL:=$(cat ../ForumCredentials/testing-db-conn.txt)} --settings ./settings-test.json & SERVER_PID=$!
./scripts/waitForServer.sh
./scripts/serverShellCommand.sh --wait "Vulcan.dropTestingDatabases()"
./scripts/serverShellCommand.sh --wait "Vulcan.dropAndSeedJestPg()"
kill $SERVER_PID
