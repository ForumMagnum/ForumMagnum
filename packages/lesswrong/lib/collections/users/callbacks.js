import Users from "meteor/vulcan:users";
import { addCallback } from 'meteor/vulcan:core';

const TRUSTLEVEL1_THRESHOLD = 2000

function updateTrustedStatus ({newDocument, vote}) {

  const user = Users.findOne(newDocument.userId)
  if (user.karma >= TRUSTLEVEL1_THRESHOLD && (!Users.getGroups(user).includes('trustLevel1'))) {
    Users.update(user._id, {$push: {groups: 'trustLevel1'}});
    const updatedUser = Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser.username, updatedUser._id, updatedUser.karma, updatedUser.groups)
  }
}

addCallback("votes.smallUpvote.async", updateTrustedStatus);
addCallback("votes.bigUpvote.async", updateTrustedStatus);
