#!/bin/bash

yarn ea-start-testing-db &
./scripts/waitForServer.sh
curl -X POST http://localhost:3000/api/dropAndCreatePg -d '{"seed": false, "templateId": "jest_template"}' -H "Content-Type: application/json"
