#!/bin/bash

Help()
{
   echo "Merges accounts."
   echo
   echo "Syntax: mergeUsers [-h] environment sourceId targetId"
   echo "options:"
   echo "h            Print this Help."
   echo "environment  The environment in which to perform the merge (ie dev, prod, local)"
   echo "sourceId     User id of the source user (the one which will get deleted and merged into the target user)."
   echo "targetId     User id of the target user."
   echo
   echo "Example: scripts/mergeUsers.sh dev xxCmncgCqPxyymEKW QQyWAsWK7PggCXttz"
}

while getopts "h" flag; do
case "$flag" in
    h) 
        Help
        exit 0
        ;;
esac
done

if [ $# -ne 3 ]; then
    echo "Error: Invalid number of arguments."
    Help
    exit 1
fi

ENVIRONMENT_NAME=${@:$OPTIND:1}
SOURCE_ID=${@:$OPTIND+1:1}
TARGET_ID=${@:$OPTIND+2:1}

echo "Merging user $SOURCE_ID into $TARGET_ID"
yarn repl "packages/lesswrong/server/scripts/mergeAccounts.ts" "$ENVIRONMENT_NAME" "mergeAccounts({sourceUserId:'$SOURCE_ID', targetUserId:'$TARGET_ID', dryRun:false})"
