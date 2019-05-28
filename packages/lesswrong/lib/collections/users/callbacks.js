import Users from "meteor/vulcan:users";
import { addCallback, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../posts'
import { Comments } from '../comments'
import request from 'request';

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

// TODO; rename?
function approveUnreviewedPosts (newUser, oldUser)
{
  if(newUser.reviewedByUserId && !oldUser.reviewedByUserId)
  {
    Posts.update({userId:newUser._id, authorIsUnreviewed:true}, {$set:{authorIsUnreviewed:false, postedAt: new Date()}})
    Comments.update({userId:newUser._id, authorIsUnreviewed:true}, {$set:{authorIsUnreviewed:false, postedAt: new Date()}})
  }
}
addCallback("users.edit.async", approveUnreviewedPosts);

function approveUnreviewedComments (newUser, oldUser)
{
  if(newUser.reviewedByUserId && !oldUser.reviewedByUserId)
  {
    Posts.update({userId:newUser._id, authorIsUnreviewed:true}, {$set:{authorIsUnreviewed:false, postedAt: new Date()}})
  }
}
addCallback("users.edit.async", approveUnreviewedComments);

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

const reCaptchaSecret = getSetting('reCaptcha.secret')
const getCaptchaRating = async (token) => {
  // Make an HTTP POST request to get reply text
  return new Promise((resolve, reject) => {
    request.post({url: 'https://www.google.com/recaptcha/api/siteverify',
        form: {
          secret: reCaptchaSecret,
          response: token
        }
      },
      function(err, httpResponse, body) {
        if (err) reject(err);
        return resolve(body);
      }
    );
  });
}
async function addReCaptchaRating (user) {
  if (reCaptchaSecret) {
    const reCaptchaToken = user?.profile?.reCaptchaToken 
    if (reCaptchaToken) {
      const reCaptchaResponse = await getCaptchaRating(reCaptchaToken)
      const reCaptchaData = JSON.parse(reCaptchaResponse)
      if (reCaptchaData.success && reCaptchaData.action == "login/signup") {
        Users.update(user._id, {$set: {signUpReCaptchaRating: reCaptchaData.score}})
      } else {
        // eslint-disable-next-line no-console
        console.log("reCaptcha check failed:", reCaptchaData)
      }
    }
  }
}

addCallback('users.new.async', addReCaptchaRating);
