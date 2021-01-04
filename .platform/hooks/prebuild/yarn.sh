#!/bin/bash

# need to install node first to be able to install yarn (as at prebuild no node is present yet)
curl --silent --location https://rpm.nodesource.com/setup_15.x | sudo bash -
yum -y install nodejs

# install
cd /var/app/staging/

# debugging..
ls -lah

yarn install --prod

chown -R webapp:webapp node_modules/ || true # allow to fail


