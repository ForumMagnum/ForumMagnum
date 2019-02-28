import Users from "meteor/vulcan:users";
import { addCallback } from 'meteor/vulcan:core';
import { Posts } from '../posts'

const MODERATE_OWN_PERSONAL_THRESHOLD = 50
const TRUSTLEVEL1_THRESHOLD = 2000
import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js'
import { makeEditableOptionsModeration } from './custom_fields.js'

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

function updateModerateOwnPersonal({newDocument, vote}) {
  const user = Users.findOne(newDocument.userId)
  if (user.karma >= MODERATE_OWN_PERSONAL_THRESHOLD && (!Users.getGroups(user).includes('canModeratePersonal'))) {
    Users.update(user._id, {$push: {groups: 'canModeratePersonal'}});
    const updatedUser = Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser.username, updatedUser._id, updatedUser.karma, updatedUser.groups)
  }
}
addCallback("votes.smallUpvote.async", updateModerateOwnPersonal);
addCallback("votes.bigUpvote.async", updateModerateOwnPersonal);

function maybeSendVerificationEmail (modifier, user)
{
  if(modifier.$set.whenConfirmationEmailSent
      && (!user.whenConfirmationEmailSent
          || user.whenConfirmationEmailSent.getTime() !== modifier.$set.whenConfirmationEmailSent.getTime()))
  {
    Accounts.sendVerificationEmail(user._id);
  }
}
addCallback("users.edit.sync", maybeSendVerificationEmail);

addEditableCallbacks({collection: Users, options: makeEditableOptionsModeration})

function approveUnreviewedPosts (newUser, oldUser)
{
  if(newUser.reviewedByUserId && !oldUser.reviewedByUserId)
  {
    Posts.update({userId:newUser._id, authorIsUnreviewed:true}, {$set:{authorIsUnreviewed:false, postedAt: new Date()}})
  }
}
addCallback("users.edit.async", approveUnreviewedPosts);

// When the very first user account is being created, add them to Sunshine
// Regiment. Patterned after a similar callback in
// vulcan-users/lib/server/callbacks.js which makes the first user an admin.
function makeFirstUserAdminAndApproved (user) {
  const realUsersCount = Users.find({'isDummy': {$in: [false,null]}}).count();
  if (realUsersCount === 0) {
    user.reviewedByUserId = "firstAccount"; //HACK
    
    // Add the first user to the Sunshine Regiment
    if (!user.groups) user.groups = [];
    user.groups.push("sunshineRegiment");
  }
  return user;
}
addCallback('users.new.sync', makeFirstUserAdminAndApproved);

function clearKarmaChangeBatchOnSettingsChange (modifier, user)
{
  if (modifier.$set && modifier.$set.karmaChangeNotifierSettings) {
    if (!user.karmaChangeNotifierSettings.updateFrequency
      || modifier.$set.karmaChangeNotifierSettings.updateFrequency !== user.karmaChangeNotifierSettings.updateFrequency) {
      modifier.$set.karmaChangeLastOpened = null;
      modifier.$set.karmaChangeBatchStart = null;
    }
  }
}
addCallback("users.edit.sync", clearKarmaChangeBatchOnSettingsChange);