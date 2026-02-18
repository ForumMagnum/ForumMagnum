#!/bin/bash
# Run unit tests twice: the first time in a clean working directory (so things
# that would be cached are included), then again in the directory left behind
# by the first (so caches are populated).

scripts/clean.sh
mkdir -p tmp
/usr/bin/time -o tmp/npmInstallTime npm install
/usr/bin/time -o tmp/firstTestTime npm run test |tee tmp/firstTestOutput
/usr/bin/time -o tmp/secondTestTime npm run test |tee tmp/secondTestOutput

echo "npm install"
cat tmp/npmInstallTime
echo
echo "First test run"
cat tmp/firstTestTime
echo
echo "Second test run"
cat tmp/secondTestTime
