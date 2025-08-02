import React from "react";
import { hasDigests, hasNewsletter } from "@/lib/betas";
import Conversations from "@/server/collections/conversations/collection";
import Users from "@/server/collections/users/collection";
import { getUserEmail, userGetLocation, userShortformPostTitle } from "@/lib/collections/users/helpers";
import { isAnyTest } from "@/lib/executionEnvironment";
import { forumTitleSetting, isEAForum, isLW, isLWorAF, verifyEmailsSetting, mailchimpEAForumListIdSetting, mailchimpForumDigestListIdSetting, mailchimpEAForumNewsletterListIdSetting, recombeeEnabledSetting } from '@/lib/instanceSettings';
import { encodeIntlError } from "@/lib/vulcan-lib/utils";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { captureException } from "@sentry/nextjs";
import { getAuth0Profile, updateAuth0Email } from "../authentication/auth0";
import { userFindOneByEmail } from "../commonQueries";
import { changesAllowedSetting, forumTeamUserId, sinceDaysAgoSetting, welcomeEmailPostId, mailchimpAPIKeySetting, hasAuth0 } from "../databaseSettings";
import { EventDebouncer } from "../debouncer";
import { wrapAndSendEmail } from "../emails/renderEmail";
import { fetchFragmentSingle } from "../fetchFragment";
import { UpdateCallbackProperties } from "../mutationCallbacks";
import { bellNotifyEmailVerificationRequired } from "../notificationCallbacks";
import { createNotifications } from "../notificationCallbacksHelpers";
import { recombeeApi } from "../recombee/client";
import ElasticClient from "../search/elastic/ElasticClient";
import ElasticExporter from "../search/elastic/ElasticExporter";
import { hasType3ApiAccess, regenerateAllType3AudioForUser } from "../type3";
import { editableUserProfileFields, simpleUserProfileFields } from "../userProfileUpdates";
import { userDeleteContent, userIPBanAndResetLoginTokens } from "../users/moderationUtils";
import { getAdminTeamAccount } from "../utils/adminTeamAccount";
import { nullifyVotesForUser } from '../nullifyVotesForUser';
import { triggerReviewIfNeeded } from "./sunshineCallbackUtils";
import difference from "lodash/difference";
import isEqual from "lodash/isEqual";
import md5 from "md5";
import { FieldChanges } from "@/server/collections/fieldChanges/collection";
import { createConversation } from "../collections/conversations/mutations";
import { createMessage } from "../collections/messages/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updatePost } from "../collections/posts/mutations";
import { updateComment } from "../collections/comments/mutations";
import { createUser, updateUser } from "../collections/users/mutations";
import { EmailContentItemBody } from "../emailComponents/EmailContentItemBody";
import { PostsHTML } from "@/lib/collections/posts/fragments";
import { emailTokenTypesByName } from "../emails/emailTokens";
import { backgroundTask } from "../utils/backgroundTask";


async function sendWelcomeMessageTo(userId: string) {
  const context = createAnonymousContext();
  const postId = welcomeEmailPostId.get();
  if (!postId || !postId.length) {
    // eslint-disable-next-line no-console
    console.log("Not sending welcome email, welcomeEmailPostId setting is not configured");
    return;
  }
  const welcomePost = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentDoc: PostsHTML,
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
    adminsAccount = await getAdminTeamAccount(context)
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

  const adminAccountContext = computeContextFromUser({ user: adminsAccount, isSSR: context.isSSR });
  const conversation = await createConversation({ data: conversationData }, adminAccountContext);
  
  const messageDocument = {
    userId: adminsAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: welcomeMessageBody,
      }
    },
    conversationId: conversation._id,
    noEmail: true,
  };

  await createMessage({ data: messageDocument }, adminAccountContext);
  
  // the EA Forum has a separate "welcome email" series that is sent via mailchimp,
  // so we're not sending the email notification for this welcome PM
  if (!isEAForum) {
    await wrapAndSendEmail({
      user,
      subject: subjectLine,
      body: <EmailContentItemBody dangerouslySetInnerHTML={{ __html: welcomeMessageBody }}/>
    })
  }
}

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
    backgroundTask(sendWelcomeMessageTo(userId));
  },
});

async function sendVerificationEmail(user: DbUser) {
  const verifyEmailLink = await emailTokenTypesByName.verifyEmail.generateLink(user._id);
  await wrapAndSendEmail({
    user,
    force: true,
    subject: `Verify your ${forumTitleSetting.get()} email`,
    body: <div>
      <p>
        Click here to verify your {forumTitleSetting.get()} email
      </p>
      <p>
        <a href={verifyEmailLink}>
          {verifyEmailLink}
        </a>
      </p>
    </div>
  });
}


const utils = {
  enforceDisplayNameRateLimit: async ({userToUpdate, currentUser}: {userToUpdate: DbUser, currentUser: DbUser}, context: ResolverContext) => {
    const { repos } = context;
  
    if (userIsAdminOrMod(currentUser)) return;
  
    if (!userOwns(currentUser, userToUpdate)) {
      throw new Error(`You do not have permission to update this user`)
    }
  
    if (!isEAForum) return;
  
    const sinceDaysAgo = sinceDaysAgoSetting.get();
    const MS_PER_DAY = 24*60*60*1000;
    const sinceDate = new Date(new Date().getTime() - (sinceDaysAgo*MS_PER_DAY))
    const changesAllowed = changesAllowedSetting.get();
  
    // Count username changes in the relevant timeframe
    const nameChangeCount = await FieldChanges.find({
      documentId: userToUpdate._id,
      fieldName: "displayName",
      userId: userToUpdate._id, // Only count changes the user made themself (ie, not changes by admins)
      createdAt: {$gt: sinceDate},
    }).count();
    
    // If `usernameUnset` changed, that means one of the changes was setting
    // your displayName for the first time, which doesn't count towards the limit
    const changesThatWereSettingForTheFirstTime = await FieldChanges.find({
      documentId: userToUpdate._id,
      fieldName: "usernameUnset",
      createdAt: {$gt: sinceDate},
      newValue: "false",
    }).count();
  
    if (nameChangeCount - changesThatWereSettingForTheFirstTime >= changesAllowed) {
      const times = changesAllowed === 1 ? 'time' : 'times';
      throw new Error(`You can only change your display name ${changesAllowed} ${times} every ${sinceDaysAgo} days. Please contact support if you would like to change it again`);
    }
  },

  getAlignmentForumAccount: async (context: ResolverContext) => {
    const { Users } = context;

    let account = await Users.findOne({username: "AI Alignment Forum"});
    if (!account) {
      const userData = {
        username: "AI Alignment Forum",
        displayName: "AI Alignment Forum",
        email: "aialignmentforum@lesswrong.com",
      }
      const response = await createUser({ data: userData }, context);
      account = response
    }
    return account;
  },

  isAlignmentForumMember: (user: DbUser|null) => {
    return user?.groups?.includes('alignmentForum')
  },

  sendVerificationEmailConditional: async (user: DbUser) => {
    if (!isAnyTest && verifyEmailsSetting.get()) {
      backgroundTask(sendVerificationEmail(user));
      await bellNotifyEmailVerificationRequired(user);
    }
  },
};

/* NEW SYNC */
export async function makeFirstUserAdminAndApproved(user: CreateUserDataInput, context: ResolverContext) {
  const { Users } = context;

  if (isAnyTest) return user;
  const realUsersCount = await Users.find({}).count();
  if (realUsersCount === 0) {
    user.reviewedByUserId = "firstAccount"; //HACK
    
    // Add the first user to the Sunshine Regiment
    if (!user.groups) user.groups = [];
    user.groups.push("sunshineRegiment");

    if (typeof user.isAdmin === 'undefined') {
      user.isAdmin = true;
    }
  }
  return user;
}

/* CREATE ASYNC */
export function createRecombeeUser({ document }: {document: DbUser}) {
  if (!recombeeEnabledSetting.get()) return;

  // Skip users without email addresses because that means they're imported
  if (!document.email)
    return;

  backgroundTask(recombeeApi.createUser(document)
    // eslint-disable-next-line no-console
    .catch(e => console.log('Error when sending created user to recombee', { e }))
  );
}

/* NEW ASYNC */
export async function subscribeOnSignup(user: DbUser) {
  // Skip email confirmation if no email address is attached to the account.
  // An email address is required when signing up normally, but might not exist
  // for users created by data import, eg importing Arbital
  if (!user.email)
    return;

  await utils.sendVerificationEmailConditional(user);
}

/**
 * This callback adds all new users to an audience in Mailchimp which will be used for a forthcoming
 * (as of 2021-08-11) drip campaign.
 */
export async function subscribeToEAForumAudience(user: DbUser) {
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
  backgroundTask((fetch(`https://us8.api.mailchimp.com/3.0/lists/${mailchimpEAForumListId}/members`, {
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
  })).catch(e => {
    captureException(e);
    // eslint-disable-next-line no-console
    console.log(e);
  }));
}

export async function sendWelcomingPM(user: DbUser) {
  await welcomeMessageDelayer.recordEvent({
    key: user._id,
  });
}

/* UPDATE VALIDATE */
export async function changeDisplayNameRateLimit({ oldDocument, newDocument, currentUser, context }: UpdateCallbackProperties<"Users">) {
  if (oldDocument.displayName !== newDocument.displayName) {
    await utils.enforceDisplayNameRateLimit({ userToUpdate: oldDocument, currentUser: currentUser! }, context);
  }
}

/* UPDATE BEFORE */

/**
 * Handle subscribing/unsubscribing in mailchimp when either
 * `subscribedToDigest` or `subscribedToMailchimp` is changed, including cases
 * where this happens implicitly due to changing another field
 */
export async function updateMailchimpSubscription(data: UpdateUserDataInput, {oldDocument, newDocument}: UpdateCallbackProperties<"Users">) {
  // Handle cases which force you to unsubscribe from both:
  // - When a user explicitly unsubscribes from all emails. If they want they
  //   can then explicitly re-subscribe while keeping "unsubscribeFromAll"
  //   checked
  // - When a user deactivates their account
  const unsubscribedFromAll = data.unsubscribeFromAll && !oldDocument.unsubscribeFromAll
  const deactivatedAccount = data.deleted && !oldDocument.deleted
  if (hasDigests && (unsubscribedFromAll || deactivatedAccount)) {
    data.subscribedToDigest = false
  }
  if (hasNewsletter && (unsubscribedFromAll || deactivatedAccount)) {
    data.subscribedToNewsletter = false
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
    data.subscribedToNewsletter = false
    return data;
  }

  const noDigestUpdate = !hasDigests ||
    data.subscribedToDigest === undefined ||
    data.subscribedToDigest === oldDocument.subscribedToDigest
  const noNewsletterUpdate = !hasNewsletter ||
    data.subscribedToNewsletter === undefined ||
    data.subscribedToNewsletter === oldDocument.subscribedToNewsletter
  if (isAnyTest || (noDigestUpdate && noNewsletterUpdate)) {
    return data;
  }

  const mailchimpAPIKey = mailchimpAPIKeySetting.get();
  const mailchimpForumDigestListId = mailchimpForumDigestListIdSetting.get();
  const mailchimpEANewsletterListId = mailchimpEAForumNewsletterListIdSetting.get();

  if (!mailchimpAPIKey) {
    return handleErrorCase("Error updating subscription: Mailchimp not configured")
  }
  if (hasDigests && !mailchimpForumDigestListId) {
    // eslint-disable-next-line no-console
    console.error("Digest list not configured, failing to update subscription");
  }
  if (hasNewsletter && !mailchimpEANewsletterListId) {
    // eslint-disable-next-line no-console
    console.error("Newsletter list not configured, failing to update subscription");
  }

  const email = getUserEmail(newDocument)
  if (!email) {
    return handleErrorCase(`Error updating subscription: no email for user ${data.displayName}`)
  }

  const { lat: latitude, lng: longitude, known } = userGetLocation(newDocument);
  const digestStatus = data.subscribedToDigest ? 'subscribed' : 'unsubscribed';
  const newsletterStatus = data.subscribedToNewsletter ? 'subscribed' : 'unsubscribed';
  const emailHash = md5(email!.toLowerCase());

  const updates = [
    {noUpdate: noDigestUpdate, listId: mailchimpForumDigestListId, status: digestStatus},
    {noUpdate: noNewsletterUpdate, listId: mailchimpEANewsletterListId, status: newsletterStatus}
  ].filter((u) => (!!u.listId && !u.noUpdate))
  for (const update of updates) {
    const res = await fetch(`https://us8.api.mailchimp.com/3.0/lists/${update.listId}/members/${emailHash}`, {
      method: 'PUT',
      body: JSON.stringify({
        email_address: email,
        email_type: 'html',
        ...(known && {location: {
          latitude,
          longitude,
        }}),
        merge_fields: {
          SOURCE: 'EAForum',
          FNAME: data.displayName,
        },
        status: update.status,
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `API_KEY ${mailchimpAPIKey}`,
      },
    });
    if (res.status !== 200) {
      const json = await res.json()
      return handleErrorCase(`Error updating subscription: ${json.detail || res?.statusText || 'Unknown error'}`)
    }
  }

  return data;
}

export async function updateDisplayName(data: UpdateUserDataInput, { oldDocument, newDocument, context }: UpdateCallbackProperties<"Users">) {
  const { Posts } = context;

  if (data.displayName !== undefined && data.displayName !== oldDocument.displayName) {
    if (!data.displayName) {
      throw new Error("You must enter a display name");
    }
    if (await Users.findOne({displayName: data.displayName})) {
      throw new Error("This display name is already taken");
    }
    if (data.shortformFeedId && !isLWorAF) {
      backgroundTask(updatePost({
        data: {title: userShortformPostTitle(newDocument)},
        selector: { _id: data.shortformFeedId }
      }, createAnonymousContext()));
    }
  }
  return data;
}

/* EDIT SYNC */
export function maybeSendVerificationEmail(modifier: MongoModifier, user: DbUser) {
  const { $set: { whenConfirmationEmailSent } } = modifier;
  if (!whenConfirmationEmailSent) {
    return;
  }

  const lastSent = user.whenConfirmationEmailSent;

  if (!lastSent || (lastSent.getTime() !== whenConfirmationEmailSent.getTime())) {
    backgroundTask(utils.sendVerificationEmailConditional(user));
  }
}

export function clearKarmaChangeBatchOnSettingsChange(modifier: MongoModifier, user: DbUser) {
  const updatedKarmaChangeNotifierSettings = modifier.$set?.karmaChangeNotifierSettings;
  if (updatedKarmaChangeNotifierSettings) {
    const lastSettings = user.karmaChangeNotifierSettings;
    if (!lastSettings.updateFrequency || (updatedKarmaChangeNotifierSettings.updateFrequency !== lastSettings.updateFrequency)) {
      modifier.$set.karmaChangeLastOpened = null;
      modifier.$set.karmaChangeBatchStart = null;
    }
  }
  return modifier;
}

export async function usersEditCheckEmail(modifier: MongoModifier, user: DbUser) {
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
        await utils.sendVerificationEmailConditional(user)
      }
    } else {
      modifier.$set.emails = [{address: newEmail, verified: false}];
      await utils.sendVerificationEmailConditional(user)
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
}

export function syncProfileUpdatedAt(modifier: MongoModifier, user: DbUser) {
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
}

/* UPDATE ASYNC */
export function updateUserMayTriggerReview({newDocument, data, context}: UpdateCallbackProperties<"Users">) {
  const reviewTriggerFields: (keyof DbUser)[] = ['voteCount', 'mapLocation', 'postCount', 'commentCount', 'biography', 'profileImageId'];
  if (reviewTriggerFields.some(field => field in data)) {
    backgroundTask(triggerReviewIfNeeded(newDocument._id, context));
  }
}

export async function userEditDeleteContentCallbacksAsync({ newDocument, oldDocument, currentUser, context }: UpdateCallbackProperties<"Users">) {
  if (newDocument.nullifyVotes && !oldDocument.nullifyVotes) {
    await nullifyVotesForUser(newDocument);
  }
  if (newDocument.deleteContent && !oldDocument.deleteContent && currentUser) {
    backgroundTask(userDeleteContent(newDocument, currentUser, context));
  }
}

/* EDIT ASYNC */
export async function newSubforumMemberNotifyMods(user: DbUser, oldUser: DbUser, context: ResolverContext) {
  const { Tags } = context;

  const newSubforumIds = difference(user.profileTagIds, oldUser.profileTagIds)
  for (const subforumId of newSubforumIds) {
    const subforum = await Tags.findOne(subforumId)
    if (subforum?.isSubforum) {
      const modIds = subforum.subforumModeratorIds || []
      await createNotifications({
        userIds: modIds,
        notificationType: 'newSubforumMember',
        documentType: 'user',
        documentId: user._id,
        extraData: {subforumId}
      })
    }
  }
}

export async function approveUnreviewedSubmissions(newUser: DbUser, oldUser: DbUser, context: ResolverContext) {
  const { Comments, Posts } = context;
  
  if (newUser.reviewedByUserId && !oldUser.reviewedByUserId) {
    // For each post by this author which has the authorIsUnreviewed flag set,
    // clear the authorIsUnreviewed flag so it's visible, and update postedAt
    // to now so that it goes to the right place int he latest posts list.
    const unreviewedPosts = await Posts.find({userId: newUser._id, authorIsUnreviewed: true}).fetch();
    for (let post of unreviewedPosts) {
      await updatePost({
        data: {
          authorIsUnreviewed: false,
          postedAt: new Date(),
        },
        selector: { _id: post._id }
      }, context);
    }
    
    // For each comment by this author which has the authorIsUnreviewed flag set, clear the authorIsUnreviewed flag.
    // This only matters if the hideUnreviewedAuthorComments setting is active -
    // in that case, we want to trigger the relevant comment notifications once the author is reviewed.
    const unreviewedComments = await Comments.find({userId: newUser._id, authorIsUnreviewed: true}).fetch();
    for (let comment of unreviewedComments) {
      await updateComment({
        data: { authorIsUnreviewed: false },
        selector: { _id: comment._id }
      }, context);
    }
  }
}

export async function handleSetShortformPost(newUser: DbUser, oldUser: DbUser, context: ResolverContext) {
  const { Posts } = context;
  
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
    await updatePost({ data: { shortform: true }, selector: { _id: post._id } }, createAnonymousContext());
  }
}

export async function updatingPostAudio(newUser: DbUser, oldUser: DbUser) {
  if (!hasType3ApiAccess()) {
    return;
  }
  const deletedChanged = newUser.deleted !== oldUser.deleted;
  const nameChanged = newUser.displayName !== oldUser.displayName;
  if (nameChanged || deletedChanged) {
    await regenerateAllType3AudioForUser(newUser._id);
  }
}

export async function userEditChangeDisplayNameCallbacksAsync(user: DbUser, oldUser: DbUser, context: ResolverContext) {
  const { Users } = context;
  
  // if the user is setting up their profile and their username changes from that form,
  // we don't want this action to count toward their one username change
  const isSettingUsername = oldUser.usernameUnset && !user.usernameUnset
  if (user.displayName !== oldUser.displayName && !isSettingUsername) {
    await updateUser({ data: {previousDisplayName: oldUser.displayName}, selector: { _id: user._id } }, context);
  }
}

export function userEditBannedCallbacksAsync(user: DbUser, oldUser: DbUser) {
  const currentBanDate = user.banned
  const previousBanDate = oldUser.banned
  const now = new Date()
  const updatedUserIsBanned = !!(currentBanDate && new Date(currentBanDate) > now)
  const previousUserWasBanned = !!(previousBanDate && new Date(previousBanDate) > now)
  
  if (updatedUserIsBanned && !previousUserWasBanned) {
    backgroundTask(userIPBanAndResetLoginTokens(user));
  }
}

export async function newAlignmentUserSendPMAsync(newUser: DbUser, oldUser: DbUser, context: ResolverContext) {
  const { Conversations, Messages } = context;
  
  if (utils.isAlignmentForumMember(newUser) && !utils.isAlignmentForumMember(oldUser)) {
    const lwAccount = await utils.getAlignmentForumAccount(context);
    if (!lwAccount) throw Error("Unable to find the lwAccount to send the new alignment user message")
    const conversationData = {
      participantIds: [newUser._id, lwAccount._id],
      title: `Welcome to the AI Alignment Forum!`
    }

    const lwAccountContext = computeContextFromUser({ user: lwAccount, isSSR: context.isSSR });
    const conversation = await createConversation({ data: conversationData }, lwAccountContext);

    let firstMessageContent =
        `<div>
            <p>You've been approved for posting on https://alignment-forum.com.</p>
            <p>You can now:</p>
            <ul>
              <li> Create alignment posts</li>
              <li> Suggest other posts for the Alignment Forum</li>
              <li> Move comments to the AI Alignment Forum</li>
            </ul>
        </div>`

    const firstMessageData = {
      userId: lwAccount._id,
      contents: {
        originalContents: {
          type: "html",
          data: firstMessageContent
        }
      },
      conversationId: conversation._id
    };

    backgroundTask(createMessage({ data: firstMessageData }, lwAccountContext));
  }
}

export async function newAlignmentUserMoveShortform(newUser: DbUser, oldUser: DbUser, context: ResolverContext) {
  const { Posts } = context;
  if (utils.isAlignmentForumMember(newUser) && !utils.isAlignmentForumMember(oldUser)) {
    if (newUser.shortformFeedId) {
      await updatePost({ data: {
                  af: true
                }, selector: { _id: newUser.shortformFeedId } }, createAnonymousContext())
    }
  }
}

export async function reindexDeletedUserContent(newUser: DbUser, oldUser: DbUser, context: ResolverContext) {
  const { repos } = context;
  
  if (!!newUser.deleted !== !!oldUser.deleted) {
    const [
      postIds,
      commentIds,
      sequenceIds,
    ] = await Promise.all([
      repos.users.getAllUserPostIds(newUser._id),
      repos.users.getAllUserCommentIds(newUser._id),
      repos.users.getAllUserSequenceIds(newUser._id),
    ]);

    const client = new ElasticClient();
    const exporter = new ElasticExporter(client);
    await Promise.all([
      ...postIds.map((id) => exporter.updateDocument("Posts", id)),
      ...commentIds.map((id) => exporter.updateDocument("Comments", id)),
      ...sequenceIds.map((id) => exporter.updateDocument("Sequences", id)),
    ]);
  }
}
