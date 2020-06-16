#!/usr/bin/env bash

# Install dependencies
yarn;
yarn global add mup@1.4.6 https://github.com/jimrandomh/mup-aws-beanstalk;
yarn global add json;
yarn global add @sentry/cli;

# Variables & Arguments
settings_path="$1";
deploy_config_path="$2";

git clone https://github.com/elasticdog/transcrypt.git
# Environment variables and secrets provided via travis-ci
./transcrypt/transcrypt -c aes-256-cbc -p $TRANSCRYPT_SECRET -y

# Deploy
cp $deploy_config_path ./config.secret; # Have to copy this because mup deploy resolves in directory relative to config file
bash ./travis_wait "mup deploy --config config.secret --settings $settings_path";
