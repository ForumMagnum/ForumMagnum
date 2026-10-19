#!/bin/bash
# Run unit tests twice: the first time in a clean working directory (so things
# that would be cached are included), then again in the directory left behind
# by the first (so caches are populated).

scripts/clean.sh
mkdir -p tmp
/usr/bin/time -o tmp/yarnInstallTime yarn install
/usr/bin/time -o tmp/firstTestTime yarn run test |tee tmp/firstTestOutput
/usr/bin/time -o tmp/secondTestTime yarn run test |tee tmp/secondTestOutput

echo "Yarn install"
cat tmp/yarnInstallTime
echo
echo "First test run"
cat tmp/firstTestTime
echo
echo "Second test run"
cat tmp/secondTestTime

