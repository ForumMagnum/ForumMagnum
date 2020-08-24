import Users from "../../lib/collections/users/collection";
import { addCallback, editMutation } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import request from 'request';
import { bellNotifyEmailVerificationRequired } from '../notificationCallbacks';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

const MODERATE_OWN_PERSONAL_THRESHOLD = 50
const TRUSTLEVEL1_THRESHOLD = 2000
import { addEditableCallbacks } from '../editor/make_editable_callbacks'
import { makeEditableOptionsModeration } from '../../lib/collections/users/custom_fields'
import { DatabaseServerSetting } from "../databaseSettings";

function updateTrustedStatus ({newDocument, vote}) {

  const user = Users.findOne(newDocument.userId)
  if (user && user.karma >= TRUSTLEVEL1_THRESHOLD && (!Users.getGroups(user).includes('trustLevel1'))) {
    Users.update(user._id, {$push: {groups: 'trustLevel1'}});
    const updatedUser = Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser?.username, updatedUser?._id, updatedUser?.karma, updatedUser?.groups)
  }
}
addCallback("votes.smallUpvote.async", updateTrustedStatus);
addCallback("votes.bigUpvote.async", updateTrustedStatus);

function updateModerateOwnPersonal({newDocument, vote}) {
  const user = Users.findOne(newDocument.userId)
  if (!user) throw Error("Couldn't find user")
  if (user.karma >= MODERATE_OWN_PERSONAL_THRESHOLD && (!Users.getGroups(user).includes('canModeratePersonal'))) {
    Users.update(user._id, {$push: {groups: 'canModeratePersonal'}});
    const updatedUser = Users.findOne(newDocument.userId)
    if (!updatedUser) throw Error("Couldn't find user to update")
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser.username, updatedUser._id, updatedUser.karma, updatedUser.groups)
  }
}
addCallback("votes.smallUpvote.async", updateModerateOwnPersonal);
addCallback("votes.bigUpvote.async", updateModerateOwnPersonal);

function maybeSendVerificationEmail (modifier: SimpleModifier<DbUser>, user: DbUser)
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

async function approveUnreviewedSubmissions (newUser: DbUser, oldUser: DbUser)
{
  if(newUser.reviewedByUserId && !oldUser.reviewedByUserId)
  {
    // For each post by this author which has the authorIsUnreviewed flag set,
    // clear the authorIsUnreviewed flag so it's visible, and update postedAt
    // to now so that it goes to the right place int he latest posts list.
    const unreviewedPosts = Posts.find({userId:newUser._id, authorIsUnreviewed:true}).fetch();
    for (let post of unreviewedPosts) {
      await editMutation<DbPost>({
        collection: Posts,
        documentId: post._id,
        set: {
          authorIsUnreviewed: false,
          postedAt: new Date(),
        },
        validate: false
      });
    }
    
    // Also clear the authorIsUnreviewed flag on comments. We don't want to
    // reset the postedAt for comments, since those are by default visible
    // almost everywhere. This can bypass the mutation system fine, because the
    // flag doesn't control whether they're indexed in Algolia.
    Comments.update({userId:newUser._id, authorIsUnreviewed:true}, {$set:{authorIsUnreviewed:false}}, {multi: true})
  }
}
addCallback("users.edit.async", approveUnreviewedSubmissions);

// When the very first user account is being created, add them to Sunshine
// Regiment. Patterned after a similar callback in
// vulcan-users/lib/server/callbacks.js which makes the first user an admin.
function makeFirstUserAdminAndApproved (user: DbUser) {
  const realUsersCount = Users.find({}).count();
  if (realUsersCount === 0) {
    user.reviewedByUserId = "firstAccount"; //HACK
    
    // Add the first user to the Sunshine Regiment
    if (!user.groups) user.groups = [];
    user.groups.push("sunshineRegiment");
  }
  return user;
}
addCallback('users.new.sync', makeFirstUserAdminAndApproved);

function clearKarmaChangeBatchOnSettingsChange (modifier: SimpleModifier<DbUser>, user: DbUser)
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

const reCaptchaSecretSetting = new DatabaseServerSetting<string | null>('reCaptcha.secret', null) // ReCaptcha Secret
const getCaptchaRating = async (token: string): Promise<string> => {
  // Make an HTTP POST request to get reply text
  return new Promise((resolve, reject) => {
    request.post({url: 'https://www.google.com/recaptcha/api/siteverify',
        form: {
          secret: reCaptchaSecretSetting.get(),
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
async function addReCaptchaRating (user: DbUser) {
  if (reCaptchaSecretSetting.get()) {
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

async function subscribeOnSignup (user: DbUser) {
  // If the subscribed-to-curated checkbox was checked, set the corresponding config setting
  const subscribeToCurated = user.profile?.subscribeToCurated;
  if (subscribeToCurated) {
    Users.update(user._id, {$set: {emailSubscribedToCurated: true}});
  }
  
  // Regardless of the config setting, try to confirm the user's email address
  // (But not in unit-test contexts, where this function is unavailable and sending
  // emails doesn't make sense.)
  if (!Meteor.isTest && !Meteor.isAppTest && !Meteor.isPackageTest) {
    Accounts.sendVerificationEmail(user._id);
    
    if (subscribeToCurated) {
      await bellNotifyEmailVerificationRequired(user);
    }
  }
}
addCallback('users.new.async', subscribeOnSignup);

// When creating a new account, populate their A/B test group key from their
// client ID, so that their A/B test groups will persist from when they were
// logged out.
async function setABTestKeyOnSignup (user: DbUser) {
  Users.update(user._id, {$set: {abTestKey: user.profile?.clientId}});
}
addCallback('users.new.async', setABTestKeyOnSignup);

async function handleSetShortformPost (newUser: DbUser, oldUser: DbUser) {
  if (newUser.shortformFeedId !== oldUser.shortformFeedId)
  {
    const post = await Posts.findOne({_id: newUser.shortformFeedId});
    if (!post)
      throw new Error("Invalid post ID for shortform");
    if (post.userId !== newUser._id)
      throw new Error("Post can only be an author's short-form post if they are the post's author");
    if (post.draft)
      throw new Error("Draft post cannot be a user's short-form post");
    // @ts-ignore -- this should be something with post.status; post.deleted doesn't exist
    if (post.deleted)
      throw new Error("Deleted post cannot be a user's short-form post");
    
    // In theory, we should check here whether the user already had a short-form
    // post which is getting un-set, and clear the short-form flag from it. But
    // in the long run we won't need to do this, because creation of short-form
    // posts will be automatic-only, and as admins we can just not click the
    // set-as-shortform button on posts for users that already have a shortform.
    // So, don't bother checking for an old post in the shortformFeedId field.
    
    // Mark the post as shortform
    await editMutation({
      collection: Posts,
      documentId: post._id,
      set: { shortform: true },
      unset: {},
      validate: false,
    });
  }
}
addCallback("users.edit.async", handleSetShortformPost);
