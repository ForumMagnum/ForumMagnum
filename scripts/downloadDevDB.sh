#!/bin/bash

mkdir -p tmp/db
mongodump -o tmp/db "$(cat ../LessWrong-Credentials/connectionStrings/dev-db.txt)"

