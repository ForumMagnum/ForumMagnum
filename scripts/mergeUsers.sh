#!/bin/bash

Help()
{
   echo "Merges accounts."
   echo
   echo "Syntax: mergeUsers [-h] sourceId targetId"
   echo "options:"
   echo "h         Print this Help."
   echo "sourceId  User id of the source user (the one which will get deleted and merged into the target user)."
   echo "targetId  User id of the target user."
   echo
   echo "Example: scripts/mergeUsers.sh xxCmncgCqPxyymEKW QQyWAsWK7PggCXttz"
}

while getopts "h" flag; do
case "$flag" in
    h) 
        Help
        exit 0
        ;;
esac
done

if [ $# -ne 2 ]; then
    echo "Error: Invalid number of arguments."
    Help
    exit 1
fi

SOURCE_ID=${@:$OPTIND:1}
TARGET_ID=${@:$OPTIND+1:1}

echo "Merging user $SOURCE_ID into $TARGET_ID"

scripts/serverShellCommand.sh "Vulcan.mergeAccounts({sourceUserId:'$SOURCE_ID', targetUserId:'$TARGET_ID', dryRun:false})"
