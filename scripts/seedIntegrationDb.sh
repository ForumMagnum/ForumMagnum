#!/bin/bash

yarn ea-start-testing-db &
./scripts/waitForServer.sh
./scripts/serverShellCommand.sh --wait "Vulcan.dropTestingDatabases()"
./scripts/serverShellCommand.sh --wait "Vulcan.dropAndSeedJestPg()"
