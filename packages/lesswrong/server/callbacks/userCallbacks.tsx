import React from 'react';
import md5 from "md5";
import Users from "../../lib/collections/users/collection";
import { userGetGroups } from '../../lib/vulcan-users/permissions';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { Posts } from '../../lib/collections/posts/collection'
import { Comments } from '../../lib/collections/comments/collection'
import { bellNotifyEmailVerificationRequired } from '../notificationCallbacks';
import { isAnyTest } from '../../lib/executionEnvironment';
import { getCollectionHooks, UpdateCallbackProperties } from '../mutationCallbacks';
import { VoteDocTuple } from '../../lib/voting/vote';
import { encodeIntlError } from '../../lib/vulcan-lib/utils';
import { sendVerificationEmail } from "../vulcan-lib/apollo-server/authentication";
import { isEAForum, isLW, isLWorAF, verifyEmailsSetting } from "../../lib/instanceSettings";
import { mailchimpEAForumListIdSetting, mailchimpForumDigestListIdSetting, recombeeEnabledSetting } from "../../lib/publicSettings";
import { mailchimpAPIKeySetting } from "../../server/serverSettings";
import {userGetLocation, getUserEmail, userShortformPostTitle} from "../../lib/collections/users/helpers";
import { captureException } from "@sentry/core";
import { getAdminTeamAccount } from './commentCallbacks';
import { wrapAndSendEmail } from '../emails/renderEmail';
import { DatabaseServerSetting } from "../databaseSettings";
import { EventDebouncer } from '../debouncer';
import { Components } from '../../lib/vulcan-lib/components';
import { Conversations } from '../../lib/collections/conversations/collection';
import { Messages } from '../../lib/collections/messages/collection';
import { getAuth0Profile, updateAuth0Email } from '../authentication/auth0';
import { triggerReviewIfNeeded } from './sunshineCallbackUtils';
import isEqual from 'lodash/isEqual';
import {userFindOneByEmail} from "../commonQueries";
import { hasDigests } from '../../lib/betas';
import { recombeeApi } from '../recombee/client';
import { editableUserProfileFields, simpleUserProfileFields } from '../userProfileUpdates';
import { fetchFragmentSingle } from '../fetchFragment';
import { hasAuth0 } from '../authenticationMiddlewares';
import { hasType3ApiAccess, regenerateAllType3AudioForUser } from '../type3';

const MODERATE_OWN_PERSONAL_THRESHOLD = 50
const TRUSTLEVEL1_THRESHOLD = 2000

export async function updateTrustedStatus ({newDocument, vote}: VoteDocTuple) {
  const user = await Users.findOne(newDocument.userId)
  if (user && (user?.karma) >= TRUSTLEVEL1_THRESHOLD && (!userGetGroups(user).includes('trustLevel1'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'trustLevel1'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser?.username, updatedUser?._id, updatedUser?.karma, updatedUser?.groups)
  }
}

export async function updateModerateOwnPersonal({newDocument, vote}: VoteDocTuple) {
  const user = await Users.findOne(newDocument.userId)
  if (!user) throw Error("Couldn't find user")
  if ((user.karma) >= MODERATE_OWN_PERSONAL_THRESHOLD && (!userGetGroups(user).includes('canModeratePersonal'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'canModeratePersonal'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    if (!updatedUser) throw Error("Couldn't find user to update")
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser.username, updatedUser._id, updatedUser.karma, updatedUser.groups)
  }
}

getCollectionHooks("Users").editSync.add(function maybeSendVerificationEmail (modifier, user: DbUser)
{
  if(modifier.$set.whenConfirmationEmailSent
      && (!user.whenConfirmationEmailSent
          || user.whenConfirmationEmailSent.getTime() !== modifier.$set.whenConfirmationEmailSent.getTime()))
  {
    void sendVerificationEmailConditional(user);
  }
});

getCollectionHooks("Users").editAsync.add(async function approveUnreviewedSubmissions (newUser: DbUser, oldUser: DbUser)
{
  if(newUser.reviewedByUserId && !oldUser.reviewedByUserId)
  {
    // For each post by this author which has the authorIsUnreviewed flag set,
    // clear the authorIsUnreviewed flag so it's visible, and update postedAt
    // to now so that it goes to the right place int he latest posts list.
    const unreviewedPosts = await Posts.find({userId: newUser._id, authorIsUnreviewed: true}).fetch();
    for (let post of unreviewedPosts) {
      await updateMutator<"Posts">({
        collection: Posts,
        documentId: post._id,
        set: {
          authorIsUnreviewed: false,
          postedAt: new Date(),
        },
        validate: false
      });
    }
    
    // For each comment by this author which has the authorIsUnreviewed flag set, clear the authorIsUnreviewed flag.
    // This only matters if the hideUnreviewedAuthorComments setting is active -
    // in that case, we want to trigger the relevant comment notifications once the author is reviewed.
    const unreviewedComments = await Comments.find({userId: newUser._id, authorIsUnreviewed: true}).fetch();
    for (let comment of unreviewedComments) {
      await updateMutator<"Comments">({
        collection: Comments,
        documentId: comment._id,
        set: {
          authorIsUnreviewed: false,
        },
        validate: false
      });
    }
  }
});

getCollectionHooks("Users").updateAsync.add(function updateUserMayTriggerReview({document, data}: UpdateCallbackProperties<"Users">) {
  const reviewTriggerFields: (keyof DbUser)[] = ['voteCount', 'mapLocation', 'postCount', 'commentCount', 'biography', 'profileImageId'];
  if (reviewTriggerFields.some(field => field in data)) {
    void triggerReviewIfNeeded(document._id)
  }
})

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
  // Skip email confirmation if no email address is attached to the account.
  // An email address is required when signing up normally, but might not exist
  // for users created by data import, eg importing Arbital
  if (!user.email)
    return;

  await sendVerificationEmailConditional(user);
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

const sendVerificationEmailConditional = async  (user: DbUser) => {
  if (!isAnyTest && verifyEmailsSetting.get()) {
    void sendVerificationEmail(user);
    await bellNotifyEmailVerificationRequired(user);
  }
}

getCollectionHooks("Users").editSync.add(async function usersEditCheckEmail (modifier, user: DbUser) {
  // if email is being modified, update user.emails too
  if (modifier.$set && modifier.$set.email && modifier.$set.email !== user.email) {

    const newEmail = modifier.$set.email;

    // check for existing emails and throw error if necessary
    const userWithSameEmail = await userFindOneByEmail(newEmail);
    if (userWithSameEmail && userWithSameEmail._id !== user._id) {
      throw new Error(encodeIntlError({id:'users.email_already_taken', value: newEmail}));
    }

    // if user.emails exists, change it too
    if (!!user.emails && user.emails.length) {
      if (user.emails[0].address !== newEmail) {
        user.emails[0].address = newEmail;
        user.emails[0].verified = false;
        modifier.$set.emails = user.emails;
        await sendVerificationEmailConditional(user)
      }
    } else {
      modifier.$set.emails = [{address: newEmail, verified: false}];
      await sendVerificationEmailConditional(user)
    }

    if (hasAuth0()) {
      await updateAuth0Email(user, newEmail);
      /*
       * Be careful here: DbUser does NOT includes services, so overwriting
       * modifier.$set.services is both very easy and very bad (amongst other
       * things, it will invalidate the user's session)
       */
      modifier.$set["services.auth0"] = await getAuth0Profile(user);
    }
  }
  return modifier;
});

/**
 * Handle subscribing/unsubscribing in mailchimp when `subscribedToDigest` is changed, including cases where this
 * happens implicitly due to changing another field
 */
getCollectionHooks("Users").updateBefore.add(async function updateDigestSubscription(data: DbUser, {oldDocument}) {
  // Handle cases which force you to unsubscribe from the digest:
  // - When a user explicitly unsubscribes from all emails. If they want they can then explicitly re-subscribe
  // to the digest while keeping "unsubscribeFromAll" checked
  // - When a user deactivates their account
  const unsubscribedFromAll = data.unsubscribeFromAll && !oldDocument.unsubscribeFromAll
  const deactivatedAccount = data.deleted && !oldDocument.deleted
  if (hasDigests && (unsubscribedFromAll || deactivatedAccount)) {
    data.subscribedToDigest = false
  }

  const handleErrorCase = (errorMessage: string) => {
    // If the user is deactivating their account, allow the update to continue. Otherwise,
    // the user is explicitly trying to update their subscription, so throw and block the update
    const err = new Error(errorMessage)
    captureException(err)
    if (!deactivatedAccount) {
      throw err
    }
    data.subscribedToDigest = false
    return data;
  }

  if (
    isAnyTest ||
    !hasDigests ||
    data.subscribedToDigest === undefined || // When a mutation doesn't reference subscribedToDigest
    data.subscribedToDigest === oldDocument.subscribedToDigest
  ) {
    return data;
  }

  const mailchimpAPIKey = mailchimpAPIKeySetting.get();
  const mailchimpForumDigestListId = mailchimpForumDigestListIdSetting.get();
  if (!mailchimpAPIKey || !mailchimpForumDigestListId) {
    return handleErrorCase("Error updating digest subscription: Mailchimp not configured")
  }

  const email = getUserEmail(data)
  if (!email) {
    return handleErrorCase(`Error updating digest subscription: no email for user ${data.displayName}`)
  }

  const { lat: latitude, lng: longitude, known } = userGetLocation(data);
  const status = data.subscribedToDigest ? 'subscribed' : 'unsubscribed';
  const emailHash = md5(email!.toLowerCase());

  const res = await fetch(`https://us8.api.mailchimp.com/3.0/lists/${mailchimpForumDigestListId}/members/${emailHash}`, {
    method: 'PUT',
    body: JSON.stringify({
      email_address: email,
      email_type: 'html', 
      ...(known && {location: {
        latitude,
        longitude,
      }}),
      merge_fields: {
        FNAME: data.displayName,
      },
      status,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `API_KEY ${mailchimpAPIKey}`,
    },
  });

  if (res?.status === 200) {
    return data;
  }

  const json = await res.json()
  return handleErrorCase(`Error updating digest subscription: ${json.detail || res?.statusText || 'Unknown error'}`)
});

/**
 * This callback adds all new users to an audience in Mailchimp which will be used for a forthcoming
 * (as of 2021-08-11) drip campaign.
 */
getCollectionHooks("Users").newAsync.add(async function subscribeToEAForumAudience(user: DbUser) {
  if (isAnyTest || !isEAForum) {
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

const welcomeMessageDelayer = new EventDebouncer({
  name: "welcomeMessageDelay",
  
  // Delay is by default 5 minutes between when you create an account, and
  // when we send the welcome email. The theory is that users creating new
  // accounts are often doing so because they're about to write a comment or
  // something, and derailing them with a bunch of stuff to read at that
  // particular moment could be bad.
  // LW wants people to see site intro before posting
  defaultTiming: isLW ? {type: "none"} : {type: "delayed", delayMinutes: 5},
  
  callback: (userId: string) => {
    void sendWelcomeMessageTo(userId);
  },
});

getCollectionHooks("Users").newAsync.add(async function sendWelcomingPM(user: DbUser) {
  await welcomeMessageDelayer.recordEvent({
    key: user._id,
  });
});

const welcomeEmailPostId = new DatabaseServerSetting<string|null>("welcomeEmailPostId", null);
const forumTeamUserId = new DatabaseServerSetting<string|null>("forumTeamUserId", null);

async function sendWelcomeMessageTo(userId: string) {
  const postId = welcomeEmailPostId.get();
  if (!postId || !postId.length) {
    // eslint-disable-next-line no-console
    console.log("Not sending welcome email, welcomeEmailPostId setting is not configured");
    return;
  }
  const welcomePost = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentName: "PostsHTML",
    selector: {_id: postId},
    currentUser: null,
  });
  if (!welcomePost) {
    // eslint-disable-next-line no-console
    console.error(`Not sending welcome email, welcomeEmailPostId of ${postId} does not match any post`);
    return;
  }
  
  const user = await Users.findOne(userId);
  if (!user) throw new Error(`Could not find ${userId}`);
  
  // try to use forumTeamUserId as the sender,
  // and default to the admin account if not found
  const adminUserId = forumTeamUserId.get()
  let adminsAccount = adminUserId ? await Users.findOne({_id: adminUserId}) : null
  if (!adminsAccount) {
    adminsAccount = await getAdminTeamAccount()
    if (!adminsAccount) {
      throw new Error("Could not find admin account")
    }
  }
  
  const subjectLine = welcomePost.title;
  const welcomeMessageBody = welcomePost.contents?.html ?? "";
  
  const conversationData = {
    participantIds: [user._id, adminsAccount._id],
    title: subjectLine,
  }
  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: adminsAccount,
    validate: false
  });
  
  const messageDocument = {
    userId: adminsAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: welcomeMessageBody,
      }
    },
    conversationId: conversation.data._id,
    noEmail: true,
  }
  await createMutator({
    collection: Messages,
    document: messageDocument,
    currentUser: adminsAccount,
    validate: false
  })
  
  // the EA Forum has a separate "welcome email" series that is sent via mailchimp,
  // so we're not sending the email notification for this welcome PM
  if (!isEAForum) {
    await wrapAndSendEmail({
      user,
      subject: subjectLine,
      body: <Components.EmailContentItemBody dangerouslySetInnerHTML={{ __html: welcomeMessageBody }}/>
    })
  }
}

getCollectionHooks("Users").updateBefore.add(async function UpdateDisplayName(data: DbUser, {oldDocument}) {
  if (data.displayName !== undefined && data.displayName !== oldDocument.displayName) {
    if (!data.displayName) {
      throw new Error("You must enter a display name");
    }
    if (await Users.findOne({displayName: data.displayName})) {
      throw new Error("This display name is already taken");
    }
    if (data.shortformFeedId && !isLWorAF) {
      void updateMutator({
        collection: Posts,
        documentId: data.shortformFeedId,
        set: {title: userShortformPostTitle(data)},
        validate: false,
      });
    }
  }
  return data;
});

getCollectionHooks("Users").createAsync.add(({ document }) => {
  if (!recombeeEnabledSetting.get()) return;

  // Skip users without email addresses because that means they're imported
  if (!document.email)
    return;

  void recombeeApi.createUser(document)
    // eslint-disable-next-line no-console
    .catch(e => console.log('Error when sending created user to recombee', { e }));
});

getCollectionHooks("Users").editSync.add(function syncProfileUpdatedAt(modifier, user: DbUser) {
  for (const field of simpleUserProfileFields) {
    if (
      (field in modifier.$set && !isEqual(modifier.$set[field], user[field])) ||
      (field in modifier.$unset && (user[field] !== null && user[field] !== undefined))
    ) {
      modifier.$set.profileUpdatedAt = new Date();
      return modifier;
    }
  }
  for (const field of editableUserProfileFields) {
    if (field in modifier.$set && modifier.$set[field]?.html !== user[field]?.html) {
      modifier.$set.profileUpdatedAt = new Date();
      return modifier;
    }
  }
  return modifier;
});

getCollectionHooks("Users").editAsync.add(async function updatingPostAudio(newUser: DbUser, oldUser: DbUser) {
  if (!hasType3ApiAccess()) {
    return;
  }
  const deletedChanged = newUser.deleted !== oldUser.deleted;
  const nameChanged = newUser.displayName !== oldUser.displayName;
  if (nameChanged || deletedChanged) {
    await regenerateAllType3AudioForUser(newUser._id);
  }
});
