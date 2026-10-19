#!/bin/bash
# Remove all intermediate files from the working directory, restoring it to a
# fresh checkout. (Like "make clean")

rm -f .eslintcache settings-dev.json
rm -rf node_modules .meteor/local

