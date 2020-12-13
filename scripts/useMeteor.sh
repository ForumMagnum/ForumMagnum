#!/bin/bash

rm -f packages/lesswrong/platform/current
ln -s ./meteor packages/lesswrong/platform/current

rm -rf node_modules
yarn install

