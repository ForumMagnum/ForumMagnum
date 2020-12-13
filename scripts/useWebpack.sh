#!/bin/bash

rm -f packages/lesswrong/platform/current
ln -s ./webpack packages/lesswrong/platform/current

rm -rf node_modules
(cd webpack && yarn install)
ln -s webpack/node_modules node_modules

