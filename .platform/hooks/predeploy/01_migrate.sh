#!/bin/bash
if [[ $EB_IS_COMMAND_LEADER == "true" ]]; then
	echo "Leading instance - running migrations"
	EB_APP_USER=$(/opt/elasticbeanstalk/bin/get-config platformconfig -k AppUser)
	EB_APP_CURRENT_DIR=$(/opt/elasticbeanstalk/bin/get-config platformconfig -k AppDeployDir)
	su -l ${EB_APP_USER} -c "cd $EB_APP_CURRENT_DIR; export FORUM_MAGNUM_MIGRATE_CI=1 node migrate up"
else
	echo "Skipping migrations - not leading instance";
fi
