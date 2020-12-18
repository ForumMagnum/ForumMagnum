#!/bin/bash

rm -f packages/lesswrong/platform/current
ln -s ./meteor packages/lesswrong/platform/current

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

