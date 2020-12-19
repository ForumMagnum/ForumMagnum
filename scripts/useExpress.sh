#!/bin/bash

# If we're not in the root of the repo, cd there
SCRIPTS_DIR="$(dirname "$(readlink -f "$0")")"
REPO_DIR="$SCRIPTS_DIR/.."
cd "$REPO_DIR"

rm -f packages/lesswrong/platform/current
(cd packages/lesswrong/platform; ln -s -T ./express current)

if [ -d node_modules ] && [ ! -d node_modules/esbuild ]; then
  # If node_modules exists but belongs to Meteor, move it to
  # node_modules.meteor, then set up symlinks and yarn install.
  echo "Switching to Express version"
  mv node_modules node_modules.meteor
  ln -s express/node_modules node_modules
  (cd express && yarn install)
elif [ -d node_modules/esbuild ]; then
  # If node_modules exists and belongs to Express version, do nothing
  echo "Express already selected"
else
  # If node_modules doesn't exist or isn't a directory, remove it, set up
  # symlinks and yarn install.
  echo "Switching to Express version"
  rm -rf node_modules
  ln -s express/node_modules node_modules
  (cd express && yarn install)
fi

