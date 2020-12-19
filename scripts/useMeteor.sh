#!/bin/bash

# If we're not in the root of the repo, cd there
SCRIPTS_DIR="$(dirname "$(readlink -f "$0")")"
REPO_DIR="$SCRIPTS_DIR/.."
cd "$REPO_DIR"

rm -f packages/lesswrong/platform/current
(cd packages/lesswrong/platform; ln -s -T ./meteor current)

if [ -d node_modules.meteor ]; then
  echo "Switching to Meteor version"
  # Remove node_modules (this will just be a symlink, belonging to webpack)
  rm -rf node_modules
  mv node_modules.meteor node_modules
  yarn install
elif [ -d node_modules/webpack ]; then
  echo "Switching to Meteor version"
  rm -rf node_modules
  yarn install
else
  # Meteor already selected; nothing to do
  echo "Meteor already selected"
fi

