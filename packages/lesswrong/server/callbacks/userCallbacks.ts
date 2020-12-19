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

const MODERATE_OWN_PERSONAL_THRESHOLD = 50
const TRUSTLEVEL1_THRESHOLD = 2000
import { addEditableCallbacks } from '../editor/make_editable_callbacks'
import { makeEditableOptionsModeration } from '../../lib/collections/users/custom_fields'
import { sendVerificationEmail } from "../vulcan-lib/apollo-server/authentication";

voteCallbacks.castVoteAsync.add(async function updateTrustedStatus ({newDocument, vote}: VoteDocTuple) {
  const user = await Users.findOne(newDocument.userId)
  if (user && user.karma >= TRUSTLEVEL1_THRESHOLD && (!userGetGroups(user).includes('trustLevel1'))) {
    await Users.update(user._id, {$push: {groups: 'trustLevel1'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser?.username, updatedUser?._id, updatedUser?.karma, updatedUser?.groups)
  }
});

voteCallbacks.castVoteAsync.add(async function updateModerateOwnPersonal({newDocument, vote}: VoteDocTuple) {
  const user = await Users.findOne(newDocument.userId)
  if (!user) throw Error("Couldn't find user")
  if (user.karma >= MODERATE_OWN_PERSONAL_THRESHOLD && (!userGetGroups(user).includes('canModeratePersonal'))) {
    await Users.update(user._id, {$push: {groups: 'canModeratePersonal'}});
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

addEditableCallbacks({collection: Users, options: makeEditableOptionsModeration})

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
    await Comments.update({userId:newUser._id, authorIsUnreviewed:true}, {$set:{authorIsUnreviewed:false}}, {multi: true})
  }
});

// When the very first user account is being created, add them to Sunshine
// Regiment. Patterned after a similar callback in
// vulcan-users/lib/server/callbacks.js which makes the first user an admin.
getCollectionHooks("Users").newSync.add(async function makeFirstUserAdminAndApproved (user: DbUser) {
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
  if (!isAnyTest) {
    void sendVerificationEmail(user);
    
    if (user.emailSubscribedToCurated) {
      await bellNotifyEmailVerificationRequired(user);
    }
  }
});

// When creating a new account, populate their A/B test group key from their
// client ID, so that their A/B test groups will persist from when they were
// logged out.
getCollectionHooks("Users").newAsync.add(async function setABTestKeyOnSignup (user) {
  const abTestKey = user.profile?.clientId || randomId();
  await Users.update(user._id, {$set: {abTestKey: abTestKey}});
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
