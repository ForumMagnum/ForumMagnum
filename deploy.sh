#!/usr/bin/env bash

# Install dependencies
yarn;
yarn global add mup@1.5 mup-aws-beanstalk@0.6
yarn global add json;
yarn global add @sentry/cli;

# Variables & Arguments
settings_path="$1";
deploy_config_path="$2";
sentry_version=$(sentry-cli releases propose-version);

# Environment variables and secrets provided via travis-ci
git clone https://Discordius:$GITHUB_TOKEN@github.com/LessWrong2/LessWrong-Credentials.git

# Set up sentry configurations
sentry-cli releases new -p lesswrong $sentry_version;
sentry-cli releases set-commits --auto $sentry_version;
json -I -f $settings_path -e "this.public.sentry.release=\"$sentry_version\"";

# Deploy
cp $deploy_config_path ./config.secret; # Have to copy this because mup deploy resolves in directory relative to config file
bash ./travis_wait "mup deploy --config config.secret --settings $settings_path";
