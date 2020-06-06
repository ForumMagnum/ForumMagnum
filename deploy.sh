#!/usr/bin/env bash

# Install dependencies
yarn;
yarn global add mup https://github.com/jimrandomh/mup-aws-beanstalk;
yarn global add json;
yarn global add @sentry/cli;

# Variables & Arguments
settings_path="$1";
deploy_config_path="$2";
echo 'deploy_config_path'
echo $deploy_config_path
# sentry_version=$(sentry-cli releases propose-version);

git clone https://github.com/elasticdog/transcrypt.git
size=${#TRANSCRYPT_SECRET}
echo 'secret size'
echo $size
# Environment variables and secrets provided via travis-ci
./transcrypt/transcrypt -c aes-256-cbc -p $TRANSCRYPT_SECRET -y

# # Set up sentry configurations
# sentry-cli releases new -p lesswrong $sentry_version;
# sentry-cli releases set-commits --auto $sentry_version;
# json -I -f $settings_path -e "this.public.sentry.release=\"$sentry_version\"";

# Deploy
cp $deploy_config_path ./config.secret; # Have to copy this because mup deploy resolves in directory relative to config file
bash ./travis_wait "mup deploy --config config.secret --settings $settings_path";

echo 'oh bollucks'
