#!/bin/bash

# need to install node first to be able to install yarn (as at prebuild no node is present yet)
sudo curl --silent --location https://rpm.nodesource.com/setup_12.x | sudo bash -
sudo yum -y install nodejs

# install yarn
sudo wget https://dl.yarnpkg.com/rpm/yarn.repo -O /etc/yum.repos.d/yarn.repo
sudo yum -y install yarn

# install
cd /var/app/staging/

# debugging..
ls -lah

yarn install --prod

chown -R webapp:webapp node_modules/ || true # allow to fail