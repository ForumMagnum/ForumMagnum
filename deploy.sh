#!/usr/bin/env bash

settings_path="$1";
deploy_config_path="$2";
sentry_version=$(sentry-cli releases propose-version);

# Environment variables provided via travis-ci
openssl aes-256-cbc -K $encrypted_f7bd7c62657c_key -iv $encrypted_f7bd7c62657c_iv -in credentials.tar.gz.enc -out credentials.tar.gz -d;
tar xvf credentials.tar.gz --strip-components=1;

# Install dependencies
yarn;
yarn global add mup https://github.com/jimrandomh/mup-aws-beanstalk;
yarn global add json;
yarn global add @sentry/cli;

# Set up sentry configurations
sentry-cli releases new -p lesswrong $sentry_version;
sentry-cli releases set-commits --auto $sentry_version;
json -I -f $settings_path -e "this.public.sentry.release=\"$sentry_version\"";

# Deploy
cp $deploy_config_path ./config.secret; # Have to copy this because mup deploy resolves in directory relative to config file
bash ./travis_wait "mup deploy --config config.secret --settings $settings_path";