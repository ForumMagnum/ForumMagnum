#!/bin/bash
set -euxo pipefail
# ---
# In order to have different application names for LW and the EA Forum, we need
# to edit the config file. This is a bit of a hack.
#
# usage: deploy.sh application_name environment_name
# ---

# Bless you stack overflow:
# https://stackoverflow.com/questions/5694228/sed-in-place-flag-that-works-both-on-mac-bsd-and-linux
sed -i.bak "s/APPLICATION_NAME$/$1/" .elasticbeanstalk/config.yml
# Remove backup file that occurs as a result of the above beautiful hack
rm .elasticbeanstalk/config.yml.bak

# Actual deployment
eb deploy --timeout 30 $2

# Return things to how they were
sed -i.bak "s/$1$/APPLICATION_NAME/" .elasticbeanstalk/config.yml
rm .elasticbeanstalk/config.yml.bak
