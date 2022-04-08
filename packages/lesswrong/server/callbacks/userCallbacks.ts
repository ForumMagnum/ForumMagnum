import fetch from "node-fetch";
import md5 from "md5";
import Users from "../../lib/collections/users/collection";
import { userGetGroups } from '../../lib/vulcan-users/permissions';
import { updateMutator } from '../vulcan-lib/mutators';
import { Posts } from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import { bellNotifyEmailVerificationRequired } from '../notificationCallbacks';
import { isAnyTest } from '../../lib/executionEnvironment';
import { randomId } from '../../lib/random';
import { getCollectionHooks } from '../mutationCallbacks';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { encodeIntlError } from '../../lib/vulcan-lib/utils';
import { userFindByEmail } from '../../lib/vulcan-users/helpers';
import { sendVerificationEmail } from "../vulcan-lib/apollo-server/authentication";
import { forumTypeSetting } from "../../lib/instanceSettings";
import { mailchimpEAForumListIdSetting, mailchimpForumDigestListIdSetting } from "../../lib/publicSettings";
import { mailchimpAPIKeySetting } from "../../server/serverSettings";
import { userGetLocation } from "../../lib/collections/users/helpers";
import { captureException } from "@sentry/core";

const MODERATE_OWN_PERSONAL_THRESHOLD = 50
const TRUSTLEVEL1_THRESHOLD = 2000

voteCallbacks.castVoteAsync.add(async function updateTrustedStatus ({newDocument, vote}: VoteDocTuple) {
  const user = await Users.findOne(newDocument.userId)
  if (user && user.karma >= TRUSTLEVEL1_THRESHOLD && (!userGetGroups(user).includes('trustLevel1'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'trustLevel1'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser?.username, updatedUser?._id, updatedUser?.karma, updatedUser?.groups)
  }
});

voteCallbacks.castVoteAsync.add(async function updateModerateOwnPersonal({newDocument, vote}: VoteDocTuple) {
  const user = await Users.findOne(newDocument.userId)
  if (!user) throw Error("Couldn't find user")
  if (user.karma >= MODERATE_OWN_PERSONAL_THRESHOLD && (!userGetGroups(user).includes('canModeratePersonal'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'canModeratePersonal'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    if (!updatedUser) throw Error("Couldn't find user to update")
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser.username, updatedUser._id, updatedUser.karma, updatedUser.groups)
  }
});

getCollectionHooks("Users").editSync.add(function maybeSendVerificationEmail (modifier, user: DbUser)
{
  if(modifier.$set.whenConfirmationEmailSent
      && (!user.whenConfirmationEmailSent
          || user.whenConfirmationEmailSent.getTime() !== modifier.$set.whenConfirmationEmailSent.getTime()))
  {
    void sendVerificationEmail(user);
  }
});

getCollectionHooks("Users").editAsync.add(async function approveUnreviewedSubmissions (newUser: DbUser, oldUser: DbUser)
{
  if(newUser.reviewedByUserId && !oldUser.reviewedByUserId)
  {
    // For each post by this author which has the authorIsUnreviewed flag set,
    // clear the authorIsUnreviewed flag so it's visible, and update postedAt
    // to now so that it goes to the right place int he latest posts list.
    const unreviewedPosts = await Posts.find({userId:newUser._id, authorIsUnreviewed:true}).fetch();
    for (let post of unreviewedPosts) {
      await updateMutator<DbPost>({
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
    await Comments.rawUpdateMany({userId:newUser._id, authorIsUnreviewed:true}, {$set:{authorIsUnreviewed:false}}, {multi: true})
  }
});

// When the very first user account is being created, add them to Sunshine
// Regiment. Patterned after a similar callback in
// vulcan-users/lib/server/callbacks.js which makes the first user an admin.
getCollectionHooks("Users").newSync.add(async function makeFirstUserAdminAndApproved (user: DbUser) {
  if (isAnyTest) return user;
  const realUsersCount = await Users.find({}).count();
  if (realUsersCount === 0) {
    user.reviewedByUserId = "firstAccount"; //HACK
    
    // Add the first user to the Sunshine Regiment
    if (!user.groups) user.groups = [];
    user.groups.push("sunshineRegiment");
  }
  return user;
});

getCollectionHooks("Users").editSync.add(function clearKarmaChangeBatchOnSettingsChange (modifier, user: DbUser)
{
  if (modifier.$set && modifier.$set.karmaChangeNotifierSettings) {
    if (!user.karmaChangeNotifierSettings.updateFrequency
      || modifier.$set.karmaChangeNotifierSettings.updateFrequency !== user.karmaChangeNotifierSettings.updateFrequency) {
      modifier.$set.karmaChangeLastOpened = null;
      modifier.$set.karmaChangeBatchStart = null;
    }
  }
});

getCollectionHooks("Users").newAsync.add(async function subscribeOnSignup (user: DbUser) {
  // Regardless of the config setting, try to confirm the user's email address
  // (But not in unit-test contexts, where this function is unavailable and sending
  // emails doesn't make sense.)
  if (!isAnyTest && forumTypeSetting.get() !== 'EAForum') {
    void sendVerificationEmail(user);
    
    if (user.emailSubscribedToCurated) {
      await bellNotifyEmailVerificationRequired(user);
    }
  }
});

// When creating a new account, populate their A/B test group key from their
// client ID, so that their A/B test groups will persist from when they were
// logged out.
getCollectionHooks("Users").newAsync.add(async function setABTestKeyOnSignup (user: DbInsertion<DbUser>) {
  if (!user.abTestKey) {
    const abTestKey = user.profile?.clientId || randomId();
    await Users.rawUpdateOne(user._id, {$set: {abTestKey: abTestKey}});
  }
});

getCollectionHooks("Users").editAsync.add(async function handleSetShortformPost (newUser: DbUser, oldUser: DbUser) {
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
    await updateMutator({
      collection: Posts,
      documentId: post._id,
      set: { shortform: true },
      unset: {},
      validate: false,
    });
  }
});


getCollectionHooks("Users").newSync.add(async function usersMakeAdmin (user: DbUser) {
  if (isAnyTest) return user;
  // if this is not a dummy account, and is the first user ever, make them an admin
  // TODO: should use await Connectors.count() instead, but cannot await inside Accounts.onCreateUser. Fix later. 
  if (typeof user.isAdmin === 'undefined') {
    const realUsersCount = await Users.find({}).count();
    user.isAdmin = (realUsersCount === 0);
  }
  return user;
});

getCollectionHooks("Users").editSync.add(async function usersEditCheckEmail (modifier, user: DbUser) {
  // if email is being modified, update user.emails too
  if (modifier.$set && modifier.$set.email) {

    const newEmail = modifier.$set.email;

    // check for existing emails and throw error if necessary
    const userWithSameEmail = await userFindByEmail(newEmail);
    if (userWithSameEmail && userWithSameEmail._id !== user._id) {
      throw new Error(encodeIntlError({id:'users.email_already_taken', value: newEmail}));
    }

    // if user.emails exists, change it too
    if (!!user.emails && user.emails.length) {
      if (user.emails[0].address !== newEmail) {
        user.emails[0].address = newEmail;
        user.emails[0].verified = false;
        modifier.$set.emails = user.emails;
      }
    } else {
      modifier.$set.emails = [{address: newEmail, verified: false}];
    }
  }
  return modifier;
});

getCollectionHooks("Users").editAsync.add(async function subscribeToForumDigest (newUser: DbUser, oldUser: DbUser) {
  if (
    isAnyTest ||
    forumTypeSetting.get() !== 'EAForum' ||
    newUser.subscribedToDigest === oldUser.subscribedToDigest
  ) {
    return;
  }

  const mailchimpAPIKey = mailchimpAPIKeySetting.get();
  const mailchimpForumDigestListId = mailchimpForumDigestListIdSetting.get();
  if (!mailchimpAPIKey || !mailchimpForumDigestListId) {
    return;
  }
  if (!newUser.email) {
    captureException(new Error(`Forum digest subscription failed: no email for user ${newUser.displayName}`))
    return;
  }
  const { lat: latitude, lng: longitude, known } = userGetLocation(newUser);
  const status = newUser.subscribedToDigest ? 'subscribed' : 'unsubscribed'; 
  
  const emailHash = md5(newUser.email.toLowerCase());

  void fetch(`https://us8.api.mailchimp.com/3.0/lists/${mailchimpForumDigestListId}/members/${emailHash}`, {
    method: 'PUT',
    body: JSON.stringify({
      email_address: newUser.email,
      email_type: 'html', 
      ...(known && {location: {
        latitude,
        longitude,
      }}),
      merge_fields: {
        FNAME: newUser.displayName,
      },
      status,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `API_KEY ${mailchimpAPIKey}`,
    },
  }).catch(e => {
    captureException(e);
    // eslint-disable-next-line no-console
    console.log(e);
  });
});

/**
 * This callback adds all new users to an audience in Mailchimp which will be used for a forthcoming
 * (as of 2021-08-11) drip campaign.
 */
getCollectionHooks("Users").newAsync.add(async function subscribeToEAForumAudience(user: DbUser) {
  if (isAnyTest || forumTypeSetting.get() !== 'EAForum') {
    return;
  }
  const mailchimpAPIKey = mailchimpAPIKeySetting.get();
  const mailchimpEAForumListId = mailchimpEAForumListIdSetting.get();
  if (!mailchimpAPIKey || !mailchimpEAForumListId) {
    return;
  }
  if (!user.email) {
    captureException(new Error(`Subscription to EA Forum audience failed: no email for user ${user.displayName}`))
    return;
  }
  const { lat: latitude, lng: longitude, known } = userGetLocation(user);
  void fetch(`https://us8.api.mailchimp.com/3.0/lists/${mailchimpEAForumListId}/members`, {
    method: 'POST',
    body: JSON.stringify({
      email_address: user.email,
      email_type: 'html', 
      ...(known && {location: {
        latitude,
        longitude,
      }}),
      status: "subscribed",
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `API_KEY ${mailchimpAPIKey}`,
    },
  }).catch(e => {
    captureException(e);
    // eslint-disable-next-line no-console
    console.log(e);
  });
});
