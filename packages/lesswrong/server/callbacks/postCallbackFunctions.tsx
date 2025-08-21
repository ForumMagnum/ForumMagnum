import React from "react";
import { useCurationEmailsCron, userCanPassivelyGenerateJargonTerms } from "@/lib/betas";
import { MOVED_POST_TO_DRAFT, REJECTED_POST } from "@/lib/collections/moderatorActions/constants";
import { Posts } from "@/server/collections/posts/collection";
import { postStatuses } from "@/lib/collections/posts/constants";
import { TOS_NOT_ACCEPTED_ERROR } from "../fmCrosspost/errors";
import { getConfirmedCoauthorIds, isRecombeeRecommendablePost, postIsApproved, postIsPublic } from "@/lib/collections/posts/helpers";
import { getLatestContentsRevision } from "@/server/collections/revisions/helpers";
import { subscriptionTypes } from "@/lib/collections/subscriptions/helpers";
import { isAnyTest, isE2E } from "@/lib/executionEnvironment";
import { eaFrontpageDateDefault, isEAForum, requireReviewToFrontpagePostsSetting, recombeeEnabledSetting, isLW } from '@/lib/instanceSettings';
import { asyncForeachSequential } from "@/lib/utils/asyncUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { findUsersToEmail, hydrateCurationEmailsQueue, sendCurationEmail } from "../curationEmails/cron";
import { autoFrontpageSetting, tagBotActiveTimeSetting } from "../databaseSettings";
import { EventDebouncer } from "../debouncer";
import { wrapAndSendEmail } from "../emails/renderEmail";
import { updatePostEmbeddings } from "../embeddings";
import { fetchFragmentSingle } from "../fetchFragment";
import { checkFrontpage, checkTags, getAutoAppliedTags, getTagBotAccount } from "../languageModels/autoTagCallbacks";
import { getOpenAI } from "../languageModels/languageModelIntegration";
import type { AfterCreateCallbackProperties, CreateCallbackProperties, UpdateCallbackProperties } from "../mutationCallbacks";
import { getUsersToNotifyAboutEvent } from "../notificationCallbacks";
import { createNotifications, getSubscribedUsers, getUsersWhereLocationIsInNotificationRadius } from "../notificationCallbacksHelpers";
import { getDefaultPostLocationFields, getDialogueResponseIds } from "../posts/utils";
import { rateLimitDateWhenUserNextAbleToPost } from "../rateLimitUtils";
import { recombeeApi } from "../recombee/client";
import { createNewJargonTerms } from "../resolvers/jargonResolvers/jargonTermMutations";
import { moveImageToCloudinary } from "../scripts/convertImagesToCloudinary";
import { updatePostDenormalizedTags } from "../tagging/helpers";
import { addOrUpvoteTag } from "../tagging/tagsGraphQL";
import { cheerioParse } from "../utils/htmlUtil";
import { createAdminContext, createAnonymousContext } from "../vulcan-lib/createContexts";
import { getAdminTeamAccount } from "../utils/adminTeamAccount";
import { triggerReviewIfNeeded } from "./sunshineCallbackUtils";
import { captureException } from "@sentry/nextjs";
import moment from "moment";
import difference from 'lodash/difference';
import union from 'lodash/union';
import isEqual from 'lodash/isEqual';
import { getRejectionMessage, generateLinkSharingKey } from "./helpers";
import { computeContextFromUser } from "../vulcan-lib/apollo-server/context";
import { createConversation } from "../collections/conversations/mutations";
import { createMessage } from "../collections/messages/mutations";
import { createModeratorAction } from "../collections/moderatorActions/mutations";
import { createPostRelation } from "../collections/postRelations/mutations";
import { updatePost } from "../collections/posts/mutations";
import { updateDialogueMatchPreference } from "../collections/dialogueMatchPreferences/mutations";
import { updateDialogueCheck } from "../collections/dialogueChecks/mutations";
import { updateNotification } from "../collections/notifications/mutations";
import { EmailCuratedAuthors } from "../emailComponents/EmailCuratedAuthors";
import { EventUpdatedEmail } from "../emailComponents/EventUpdatedEmail";
import { PostsHTML } from "@/lib/collections/posts/fragments";
import { backgroundTask } from "../utils/backgroundTask";
import { createAutomatedContentEvaluation } from "../collections/automatedContentEvaluations/helpers";


/**
 * Check whether it's after 5pm UK time on Friday and before 9am ET on Monday
 */
function isWeekend(): boolean {
  const nowUK = moment().tz("Europe/London");
  const nowET = moment().tz("America/New_York");

  const dayOfWeekUK = nowUK.day();
  const hourOfDayUK = nowUK.hour();
  const dayOfWeekET = nowET.day();
  const hourOfDayET = nowET.hour();

  if (dayOfWeekUK === 5 && hourOfDayUK >= 17) {
    return true;
  }
  if (dayOfWeekUK === 6 || dayOfWeekUK === 0) {
    return true;
  }
  if (dayOfWeekET === 1 && hourOfDayET < 9) {
    return true;
  }

  return false;
}

/** Create notifications for a new post being published */
export async function sendNewPostNotifications(post: DbPost) {
  const context = createAnonymousContext();
  const { Localgroups } = context;

  if (postIsPublic(post)) {
    // track the users who we've notified, so that we only do so once per user, even if they qualify for more than one notification -
    // start by excluding the post author
    let userIdsNotified: string[] = [post.userId];
    
    // first, if the post is in a group, notify all users who are subscribed to the group
    if (post.groupId) {
      // Load the group, so we know who the organizers are
      const group = await Localgroups.findOne(post.groupId);
      if (group) {
        const organizerIds = group.organizerIds;
        const groupSubscribedUsers = await getSubscribedUsers({
          documentId: post.groupId,
          collectionName: "Localgroups",
          type: subscriptionTypes.newEvents,
          potentiallyDefaultSubscribedUserIds: organizerIds,
          userIsDefaultSubscribed: u => u.autoSubscribeAsOrganizer,
        });
        
        const userIdsToNotify = difference(groupSubscribedUsers.map(user => user._id), userIdsNotified)
        if (post.isEvent) {
          await createNotifications({userIds: userIdsToNotify, notificationType: 'newEvent', documentType: 'post', documentId: post._id});
        } else {
          await createNotifications({userIds: userIdsToNotify, notificationType: 'newGroupPost', documentType: 'post', documentId: post._id});
        }
        // don't notify these users again
        userIdsNotified = union(userIdsNotified, userIdsToNotify)
      }
    }
    
    // then notify all users who want to be notified of events in a radius
    if (post.isEvent && post.mongoLocation) {
      const radiusNotificationUsers = await getUsersWhereLocationIsInNotificationRadius(post.mongoLocation)
      const userIdsToNotify = difference(radiusNotificationUsers.map(user => user._id), userIdsNotified)
      await createNotifications({userIds: userIdsToNotify, notificationType: "newEventInRadius", documentType: "post", documentId: post._id})
      // don't notify these users again
      userIdsNotified = union(userIdsNotified, userIdsToNotify)
    }
    
    // finally notify all users who are subscribed to the post's author
    let authorSubscribedUsers = await getSubscribedUsers({
      documentId: post.userId,
      collectionName: "Users",
      type: subscriptionTypes.newPosts
    })
    const userIdsToNotify = difference(authorSubscribedUsers.map(user => user._id), userIdsNotified)
    await createNotifications({userIds: userIdsToNotify, notificationType: 'newPost', documentType: 'post', documentId: post._id});
  }
}

const onPublishUtils = {
  updateRecombeeWithPublishedPost: (post: DbPost, context: ResolverContext) => {
    if (!isRecombeeRecommendablePost(post)) return;
  
    if (recombeeEnabledSetting.get()) {
      backgroundTask(recombeeApi.upsertPost(post, context)
        // eslint-disable-next-line no-console
        .catch(e => console.log('Error when sending published post to recombee', { e }))
      );
    }
  
    // if (vertexEnabledSetting.get()) {
    //   backgroundTask(googleVertexApi.upsertPost({ post }, context)
    //     // eslint-disable-next-line no-console
    //     .catch(e => console.log('Error when sending published post to google vertex', { e }));
    //   )
    // }
  },

  ensureNonzeroRevisionVersionsAfterUndraft: async (post: { _id: string }, context: ResolverContext) => {
    // When a post is published, ensure that the version number of its contents
    // revision does not have `draft` set or an 0.x version number (which would
    // affect permissions).
    await context.repos.posts.ensurePostHasNonDraftContents(post._id);
  },
};

// Callback for a post being published. This is distinct from being created in
// that it doesn't fire on draft posts, and doesn't fire on posts that are awaiting
// moderator approval because they're a user's first post (but does fire when
// they're approved).
export async function onPostPublished(post: DbPost, context: ResolverContext) {
  onPublishUtils.updateRecombeeWithPublishedPost(post, context);
  await sendNewPostNotifications(post);
  const { updateScoreOnPostPublish } = require("./votingCallbacks");
  await updateScoreOnPostPublish(post, context);
  await onPublishUtils.ensureNonzeroRevisionVersionsAfterUndraft(post, context);
}

const utils = {
  /**
   * Check whether the given user can post a post right now. If they can, does
   * nothing; if they would exceed a rate limit, throws an exception.
   */
  enforcePostRateLimit: async (user: DbUser, context: ResolverContext) => {
    const rateLimit = await rateLimitDateWhenUserNextAbleToPost(user, context);
    if (rateLimit) {
      const {nextEligible} = rateLimit;
      if (nextEligible > new Date()) {
        // "fromNow" makes for a more human readable "how long till I can comment/post?".
        // moment.relativeTimeThreshold ensures that it doesn't appreviate unhelpfully to "now"
        moment.relativeTimeThreshold('ss', 0);
        throw new Error(`Rate limit: You cannot post for ${moment(nextEligible).fromNow()}, until ${nextEligible}`);
      }
    }
  },

  postHasUnconfirmedCoauthors: (post: CreatePostDataInput | UpdatePostDataInput | DbPost) => {
    return !post.hasCoauthorPermission && (post.coauthorStatuses ?? []).filter(({ confirmed }) => !confirmed).length > 0;
  },

  scheduleCoauthoredPost: <T extends CreatePostDataInput | UpdatePostDataInput>(post: T) => {
    const now = new Date();
    post.postedAt = new Date(now.setDate(now.getDate() + 1));
    return { ...post, isFuture: true };
  },

  bulkApplyPostTags: async ({postId, tagsToApply, currentUser, context}: {postId: string, tagsToApply: string[], currentUser: DbUser, context: ResolverContext}) => {
    const applyOneTag = async (tagId: string) => {
      try {
        await addOrUpvoteTag({
          tagId, postId,
          currentUser: currentUser!,
          ignoreParent: true,  // Parent tags are already applied by the post submission form, so if the parent tag isn't present the user must have manually removed it
          context
        });
      } catch(e) {
        // This can throw if there's a tag applied which doesn't exist, which
        // can happen if there are issues with the search index.
        //
        // If we fail to add a tag, capture the exception in Sentry but don't
        // throw from the form-submission callback. From the user perspective
        // letting this exception esscape would make posting appear to fail (but
        // actually the post is created, minus some of its callbacks having
        // completed).
        captureException(e)
      }
    }
    await Promise.all(tagsToApply.map(applyOneTag))
  },

  bulkRemovePostTags: async ({tagRels, currentUser, context}: {tagRels: DbTagRel[], currentUser: DbUser, context: ResolverContext}) => {
    const { TagRels } = context;
    const clearOneTag = async (tagRel: DbTagRel) => {
      try {
        const { clearVotesServer } = require("../voteServer");
        await clearVotesServer({ document: tagRel, collection: TagRels, user: currentUser, context})
      } catch(e) {
        captureException(e)
      }
    }
    await Promise.all(tagRels.map(clearOneTag))
  },

  applyAutoTags: async (post: Pick<DbPost, '_id' | 'title' | 'isEvent' | 'submitToFrontpage' | 'draft'>, context: ResolverContext) => {
    const api = await getOpenAI();
    if (!api) {
      if (!isAnyTest && !isE2E) {
        //eslint-disable-next-line no-console
        console.log("Skipping autotagging (API not configured)");
      }
      return;
    }
    const tagBot = await getTagBotAccount(context);
    const tagBotActiveTime = tagBotActiveTimeSetting.get();
  
    if (!tagBot || (tagBotActiveTime === "weekends" && !isWeekend())) {
      //eslint-disable-next-line no-console
      console.log(`Skipping autotagging (${!tagBot ? "no tag-bot account" : "not a weekend"})`);
      return;
    }
    
    const tags = await getAutoAppliedTags(context);
    const postHTML = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentDoc: PostsHTML,
      selector: {_id: post._id},
      currentUser: context.currentUser,
      context,
      skipFiltering: true,
    });
    if (!postHTML) {
      return;
    }
    const tagsApplied = await checkTags(postHTML, tags, api, context);
    
    //eslint-disable-next-line no-console
    console.log(`Auto-applying tags to post ${post.title} (${post._id}): ${JSON.stringify(tagsApplied)}`);
    
    for (let tag of tags) {
      if (tagsApplied[tag.slug]) {
        await addOrUpvoteTag({
          tagId: tag._id,
          postId: post._id,
          currentUser: tagBot,
          context,
        });
      }
    }
  
    const autoFrontpageEnabled = autoFrontpageSetting.get()
    if (!autoFrontpageEnabled) {
      return;
    }
  
    const requireFrontpageReview = requireReviewToFrontpagePostsSetting.get();
    const defaultFrontpageHide = requireFrontpageReview || !eaFrontpageDateDefault(
      post.isEvent,
      post.submitToFrontpage,
      post.draft,
    )
    if (requireFrontpageReview !== defaultFrontpageHide) {
      // The common case this is designed for: requireFrontpageReview is `false` but submitToFrontpage is also `false` (so
      // defaultFrontpageHide is `true`), so the post is already hidden and there is no need to auto-review
      return
    }
  
    const autoFrontpageReview = await checkFrontpage(postHTML, api, context);
  
    // eslint-disable-next-line no-console
    console.log(
      `Frontpage auto-review result for ${post.title} (${post._id}): ${
        autoFrontpageReview ? (defaultFrontpageHide ? "Show" : "Hide") : "No action"
      }`
    );
  
    if (autoFrontpageReview) {
      await updatePost({
        data: {
          frontpageDate: defaultFrontpageHide ? new Date() : null,
          autoFrontpage: defaultFrontpageHide ? "show" : "hide"
        },
        selector: { _id: post._id }
      }, context);
    }
  },

  resetDialogueMatch: async (matchForm: DbDialogueMatchPreference, adminContext: ResolverContext) => {
    const { DialogueChecks, DialogueMatchPreferences } = adminContext;
  
    const dialogueCheck = await DialogueChecks.findOne(matchForm.dialogueCheckId);
    if (dialogueCheck) {
      await Promise.all([
        updateDialogueCheck({
          data: { checked: false, hideInRecommendations: false },
          selector: { _id: dialogueCheck._id }
        }, adminContext),
        updateDialogueMatchPreference({
          data: { deleted: true },
          selector: { _id: matchForm._id }
        }, adminContext)
      ]);
    }
  },

  eventHasRelevantChangeForNotification: (oldPost: DbPost, newPost: DbPost) => {
    const oldLocation = oldPost.googleLocation?.geometry?.location;
    const newLocation = newPost.googleLocation?.geometry?.location;
    if (!!oldLocation !== !!newLocation) {
      //Location added or removed
      return true;
    }
    if (oldLocation && newLocation && !isEqual(oldLocation, newLocation)) {
      // Location changed
      // NOTE: We treat the added/removed and changed cases separately because a
      // dumb thing inside the mutation callback handlers mixes up null vs
      // undefined, causing callbacks to get a spurious change from null to
      // undefined which should not trigger a notification.
      return true;
    }
  
    /* 
     * moment(null) is not the same as moment(undefined), which started happening after the postgres migration of posts for events that didn't have endTimes.
     * We can't check moment(null).isSame(moment(null)), since that always returns false.
     * moment(undefined).isSame(moment(undefined)) often returns true but that's actually not guaranteed, so it's not safe to rely on.
     * We shouldn't send a notification in those cases, obviously.
     */
    const { startTime: oldStartTime, endTime: oldEndTime } = oldPost;
    const { startTime: newStartTime, endTime: newEndTime } = newPost;
  
    const startTimeAddedOrRemoved = !!oldStartTime !== !!newStartTime;
    const endTimeAddedOrRemoved = !!oldEndTime !== !!newEndTime;
  
    const startTimeChanged = oldStartTime && newStartTime && !moment(newStartTime).isSame(moment(oldStartTime));
    const endTimeChanged = oldEndTime && newEndTime && !moment(newEndTime).isSame(moment(oldEndTime));
  
    if ((newPost.joinEventLink ?? null) !== (oldPost.joinEventLink ?? null)
      || startTimeAddedOrRemoved
      || startTimeChanged
      || endTimeAddedOrRemoved
      || endTimeChanged
    ) {
      // Link, start time, or end time changed
      return true;
    }
    
    return false;
  },

  sendPostRejectionPM: async ({ messageContents, lwAccount, post, noEmail, context }: {
    messageContents: string,
    lwAccount: DbUser,
    post: DbPost,
    noEmail: boolean,
    context: ResolverContext,
  }) => {
    const conversationData: CreateConversationDataInput = {
      participantIds: [post.userId, lwAccount._id],
      title: `Your post ${post.title} was rejected`,
      moderator: true
    };

    const lwAccountContext = computeContextFromUser({ user: lwAccount, isSSR: context.isSSR });

    const conversation = await createConversation({
      data: conversationData,
    }, lwAccountContext);
  
    const messageData = {
      userId: lwAccount._id,
      contents: {
        originalContents: {
          type: "html",
          data: messageContents
        }
      },
      conversationId: conversation._id,
      noEmail: noEmail
    };
  
    await createMessage({
      data: messageData,
    }, lwAccountContext);
  
    if (!isAnyTest) {
      // eslint-disable-next-line no-console
      console.log("Sent moderation message for post", post._id);
    }
  },
};



/* CREATE VALIDATE */
export async function postsNewRateLimit(post: CreatePostDataInput, currentUser: DbUser, context: ResolverContext): Promise<void> {
  if (!post.draft && !post.isEvent) {
    await utils.enforcePostRateLimit(currentUser!, context);
  }
}

/* CREATE BEFORE */
export function addReferrerToPost(post: CreatePostDataInput, properties: CreateCallbackProperties<'Posts'>) {
  if (properties && properties.context && properties.context.headers) {
    let referrer = properties.context.headers.get("referer");
    let userAgent = properties.context.headers.get("user-agent");
    
    return {
      ...post,
      referrer: referrer,
      userAgent: userAgent,
    };
  }

  return post;
}


/* NEW SYNC */
export function checkTosAccepted<T extends CreatePostDataInput | UpdatePostDataInput>(currentUser: DbUser | null, post: T): T {
  if (post.draft === false && !post.shortform && !currentUser?.acceptedTos) {
    throw new Error(TOS_NOT_ACCEPTED_ERROR);
  }
  return post;
}

export function assertPostTitleHasNoEmojis(post: CreatePostDataInput | UpdatePostDataInput) {
  if (/\p{Extended_Pictographic}/u.test(post.title ?? '')) {
    throw new Error("Post titles cannot contain emojis");
  }
}

export async function checkRecentRepost<T extends CreatePostDataInput | Partial<DbPost>>(post: T, user: DbUser | null, context: ResolverContext) {
  const { Posts } = context;

  if (!post.draft) {
    const oneHourAgo = new Date(Date.now() - (60 * 60 * 1000));
    const existing = await Posts.findOne({
      ...('_id' in post ? {_id: {$ne: post._id}} : {}),
      title: post.title,
      userId: post.userId,
      draft: {$ne: true},
      deletedDraft: {$ne: true},
      createdAt: {$gt: oneHourAgo},
    });
    if (existing) {
      throw new Error(`You recently published another post titled "${post.title}"`);
    }
  }
  return post;
}

export async function postsNewDefaultLocation(post: CreatePostDataInput, user: DbUser | null, context: ResolverContext): Promise<CreatePostDataInput> {
  return {
    ...post,
    ...(await getDefaultPostLocationFields(post, context))
  };
}

export async function postsNewDefaultTypes(post: CreatePostDataInput, user: DbUser | null, context: ResolverContext): Promise<CreatePostDataInput> {
  const { Localgroups } = context;

  if (post.isEvent && post.groupId && !post.types) {
    const localgroup = await Localgroups.findOne(post.groupId) 
    if (!localgroup) throw Error(`Wasn't able to find localgroup for post ${post}`)
    const { types } = localgroup
    post = {...post, types}
  }

  return post;
}

const MINIMUM_APPROVAL_KARMA = 5;

export async function postsNewUserApprovedStatus(post: CreatePostDataInput, user: DbUser | null, context: ResolverContext): Promise<CreatePostDataInput> {
  const { Users } = context;
  const postAuthor = await Users.findOne(post.userId);
  if (!postAuthor?.reviewedByUserId && (postAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...post, authorIsUnreviewed: true}
  }
  return post;
}

export async function fixEventStartAndEndTimes(post: CreatePostDataInput): Promise<CreatePostDataInput> {
  // make sure courses/programs have no end time
  // (we don't want them listed for the length of the course, just until the application deadline / start time)
  if (post.eventType === 'course') {
    return {
      ...post,
      endTime: null
    }
  }

  // If the post has an end time but no start time, move the time given to the startTime
  // slot, and leave the end time blank
  if (post?.endTime && !post?.startTime) {
    return {
      ...post,
      startTime: post.endTime,
      endTime: null,
    };
  }
  
  // If both start time and end time are given but they're swapped, swap them to
  // the right order
  if (post.startTime && post.endTime && moment(post.startTime).isAfter(post.endTime)) {
    return {
      ...post,
      startTime: post.endTime,
      endTime: post.startTime,
    };
  }
  
  return post;
}

export async function scheduleCoauthoredPostWithUnconfirmedCoauthors(post: CreatePostDataInput): Promise<CreatePostDataInput> {
  if (utils.postHasUnconfirmedCoauthors(post) && !post.draft) {
    return utils.scheduleCoauthoredPost(post);
  }
  return post;
}

export function addLinkSharingKey(post: CreatePostDataInput) {
  return {
    ...post,
    linkSharingKey: generateLinkSharingKey()
  };
}

/* CREATE AFTER */
export async function applyNewPostTags(post: DbPost, props: AfterCreateCallbackProperties<'Posts'>) {
  const {currentUser, context} = props;
  if (!currentUser) return post; // Shouldn't happen, but just in case
  
  if (post.tagRelevance) {
    // Convert tag relevances in a new-post submission to creating new TagRel objects, and upvoting them.
    const tagsToApply = Object.keys(post.tagRelevance);
    post = {...post, tagRelevance: undefined};
    await utils.bulkApplyPostTags({postId: post._id, tagsToApply, currentUser, context})
  }

  return post;
}

export async function createNewJargonTermsCallback<T extends Pick<DbPost, '_id' | 'contents_latest' | 'draft' | 'generateDraftJargon' | 'userId'>>(post: T, callbackProperties: AfterCreateCallbackProperties<'Posts'> | UpdateCallbackProperties<'Posts'>) {
  const { context } = callbackProperties;
  const { currentUser, loaders, JargonTerms } = context;
  const oldPost = 'oldDocument' in callbackProperties ? callbackProperties.oldDocument as DbPost : null;

  if (!currentUser) return post;
  if (currentUser._id !== post.userId) return post;
  if (!post.contents_latest) return post;
  if (post.draft && !post.generateDraftJargon) return post;
  if (!post.draft && !currentUser.generateJargonForPublishedPosts) return post;
  if (oldPost?.contents_latest === post.contents_latest) return post;

  if (!userCanPassivelyGenerateJargonTerms(currentUser)) return post;
  // TODO: refactor this so that createNewJargonTerms handles the case where we might be creating duplicate terms
  const [existingJargon, newContents] = await Promise.all([
    JargonTerms.find({postId: post._id}).fetch(),
    loaders.Revisions.load(post.contents_latest)
  ]);

  if (!newContents?.html) {
    return post;
  }
  
  const { changeMetrics } = newContents;

  // TODO: do we want different behavior for new vs updated posts?
  if (changeMetrics.added > 1000 || !existingJargon.length) {
    // TODO: do we want to exclude existing jargon terms from being added again for posts which had a large diff but already had some jargon terms?
    backgroundTask(createNewJargonTerms({ postId: post._id, currentUser, context }));
  }

  return post;
}


/* NEW AFTER */
export async function sendCoauthorRequestNotifications<T extends Pick<DbPost, '_id' | 'coauthorStatuses' | 'hasCoauthorPermission'>>(post: T, callbackProperties: AfterCreateCallbackProperties<'Posts'> | UpdateCallbackProperties<'Posts'>) {
  const { context: { Posts } } = callbackProperties;
  const { _id, coauthorStatuses, hasCoauthorPermission } = post;

  if (hasCoauthorPermission === false && coauthorStatuses?.length) {
    await createNotifications({
      userIds: coauthorStatuses.filter(({requested, confirmed}) => !requested && !confirmed).map(({userId}) => userId),
      notificationType: "coauthorRequestNotification",
      documentType: "post",
      documentId: _id,
    });

    post.coauthorStatuses = coauthorStatuses.map((status) => ({ ...status, requested: true }));
    await Posts.rawUpdateOne({ _id }, { $set: { coauthorStatuses: post.coauthorStatuses } });
  }

  return post;
}

export async function lwPostsNewUpvoteOwnPost(post: DbPost, callbackProperties: AfterCreateCallbackProperties<'Posts'>): Promise<DbPost> {
  const { context: { Users, Posts } } = callbackProperties;

  const postAuthor = await Users.findOne(post.userId);
  if (!postAuthor) throw new Error(`Could not find user: ${post.userId}`);
  const { performVoteServer } = await import("../voteServer");
  const {modifiedDocument: votedPost} = await performVoteServer({
    document: post,
    voteType: 'bigUpvote',
    collection: Posts,
    user: postAuthor,
    skipRateLimits: true,
    selfVote: true
  })
  return {...post, ...votedPost} as DbPost;
}

export function postsNewPostRelation(post: DbPost, { context }: AfterCreateCallbackProperties<'Posts'>) {
  if (post.originalPostRelationSourceId) {
    backgroundTask(createPostRelation({
      data: {
        type: "subQuestion",
        sourcePostId: post.originalPostRelationSourceId,
        targetPostId: post._id,
      }
    }, context));
  }
  return post
}

// Use the first image in the post as the social preview image
export async function extractSocialPreviewImage(post: DbPost, callbackProperties: AfterCreateCallbackProperties<'Posts'> | UpdateCallbackProperties<'Posts'>) {
  const { context } = callbackProperties;
  const { Posts } = context;
  
  // socialPreviewImageId is set manually, and will override this
  if (post.socialPreviewImageId) return post

  const contents = await getLatestContentsRevision(post, context);
  if (!contents) {
    return post;
  }

  let socialPreviewImageAutoUrl = ''
  if (contents?.html) {
    const $ = cheerioParse(contents?.html)
    const firstImg = $('img').first()
    const firstImgSrc = firstImg?.attr('src')
    if (firstImg && firstImgSrc) {
      try {
        socialPreviewImageAutoUrl = await moveImageToCloudinary({oldUrl: firstImgSrc, originDocumentId: post._id}) ?? firstImgSrc
      } catch (e) {
        captureException(e);
        socialPreviewImageAutoUrl = firstImgSrc
      }
    }
  }
  
  // Side effect is necessary, as edit.async does not run a db update with the
  // returned value
  // It's important to run this regardless of whether or not we found an image,
  // as removing an image should remove the social preview for that image
  await Posts.rawUpdateOne({ _id: post._id }, {$set: { socialPreviewImageAutoUrl }})
  
  return {...post, socialPreviewImageAutoUrl} 
}

/* CREATE ASYNC */
export async function notifyUsersAddedAsPostCoauthors({ document: post }: AfterCreateCallbackProperties<'Posts'>) {
  const coauthorIds: Array<string> = getConfirmedCoauthorIds(post);
  await createNotifications({ userIds: coauthorIds, notificationType: "addedAsCoauthor", documentType: "post", documentId: post._id });
}

export async function triggerReviewForNewPostIfNeeded({ document, context }: AfterCreateCallbackProperties<'Posts'>) {
  if (!document.draft) {
    await triggerReviewIfNeeded(document.userId, context)
  }
}

export async function autoTagNewPost({ document, context }: AfterCreateCallbackProperties<"Posts">) {
  if (!document.draft) {
    // Post created (and is not a draft)
    backgroundTask(utils.applyAutoTags(document, context));
  }
}

/* NEW ASYNC */
export async function sendUsersSharedOnPostNotifications(post: DbPost) {
  const { _id, shareWithUsers = [], coauthorStatuses } = post;
  const coauthors: Array<string> = coauthorStatuses?.filter(({ confirmed }) => confirmed).map(({ userId }) => userId) || [];
  const userIds: Array<string> = shareWithUsers?.filter((user) => !coauthors.includes(user)) || [];
  await createNotifications({userIds, notificationType: "postSharedWithUser", documentType: "post", documentId: _id})
}

/* UPDATE VALIDATE */
export async function postsUndraftRateLimit(oldDocument: DbPost, newDocument: DbPost, currentUser: DbUser, context: ResolverContext) {
  // Only undrafting is rate limited, not other edits
  if (oldDocument.draft && !newDocument.draft && !newDocument.isEvent) {
    await utils.enforcePostRateLimit(currentUser!, context);
  }
}

/* UPDATE BEFORE */

// TODO: check the order of this function in the updateBefore callbacks
export function onEditAddLinkSharingKey(data: UpdatePostDataInput, { oldDocument }: UpdateCallbackProperties<'Posts'>): UpdatePostDataInput {
  if (!oldDocument.linkSharingKey) {
    return {
      ...data,
      linkSharingKey: generateLinkSharingKey()
    };
  } else {
    return data;
  }
}

export function setPostUndraftedFields(data: UpdatePostDataInput, { oldDocument: post }: UpdateCallbackProperties<'Posts'>) {
  // Set postedAt and wasEverUndrafted when a post is moved out of drafts.
  // If the post has previously been published then moved to drafts, and now
  // it's being republished then we shouldn't reset the `postedAt` date.
  const isRepublish = post.wasEverUndrafted || data.wasEverUndrafted;
  if (data.draft === false && post.draft && !isRepublish) {
    data.postedAt = new Date();
    data.wasEverUndrafted = true;
  }
  return data;
}

// TODO: this, plus the scheduleCoauthoredPost function, should probably be converted to one of the on-publish callbacks?
export function scheduleCoauthoredPostWhenUndrafted(post: UpdatePostDataInput, {oldDocument: oldPost, newDocument: newPost}: UpdateCallbackProperties<"Posts">) {
  // Here we schedule the post for 1-day in the future when publishing an existing draft with unconfirmed coauthors
  // We must check post.draft === false instead of !post.draft as post.draft may be undefined in some cases
  // NOTE: EA FORUM: this used to use `post` rather than `newPost`, but `post` is merely the diff, which isn't what you want to pass into those
  if (utils.postHasUnconfirmedCoauthors(newPost) && post.draft === false && oldPost.draft) {
    post = utils.scheduleCoauthoredPost(post);
  }
  return post;
}

/* EDIT SYNC */
export function clearCourseEndTime(modifier: MongoModifier, post: DbPost): MongoModifier {
  // make sure courses/programs have no end time
  // (we don't want them listed for the length of the course, just until the application deadline / start time)
  if (post.eventType === 'course') {
    modifier.$set.endTime = null;
  }
  
  return modifier
}

export function removeFrontpageDate(modifier: MongoModifier, _post: DbPost): MongoModifier {
  if (
    modifier.$set?.submitToFrontpage === false ||
    modifier.$set?.submitToFrontpage === null ||
    modifier.$unset?.submitToFrontpage
  ) {
    modifier.$unset ??= {};
    modifier.$unset.frontpageDate = 1;
  }
  return modifier;
}

export function resetPostApprovedDate(modifier: MongoModifier, post: DbPost): MongoModifier {
  if (modifier.$set && postIsApproved(modifier.$set) && !postIsApproved(post)) {
    modifier.$set.postedAt = new Date();
  }
  return modifier;
}

/* UPDATE AFTER */
export async function syncTagRelevance<T extends Pick<DbPost, '_id' | 'tagRelevance'>>(post: T, props: UpdateCallbackProperties<'Posts'>) {
  const { currentUser, context } = props;
  const { TagRels } = context;
  if (!currentUser) return post; // Shouldn't happen, but just in case

  if (post.tagRelevance) {
    const existingTagRels = await TagRels.find({ postId: post._id, baseScore: {$gt: 0}, deleted: false }).fetch()
    const existingTagIds = existingTagRels.map(tr => tr.tagId);

    const formTagIds = Object.keys(post.tagRelevance);
    const tagsToApply = formTagIds.filter(tagId => !existingTagIds.includes(tagId));
    const tagsToRemove = existingTagIds.filter(tagId => !formTagIds.includes(tagId));

    const applyPromise = utils.bulkApplyPostTags({postId: post._id, tagsToApply, currentUser, context})
    const removePromise = utils.bulkRemovePostTags({tagRels: existingTagRels.filter(tagRel => tagsToRemove.includes(tagRel.tagId)), currentUser, context})

    await Promise.all([applyPromise, removePromise])
    if (tagsToApply.length || tagsToRemove.length) {
      // Rebuild the tagRelevance field on the post. It's unfortunate that we have to do this extra (slow) step, but
      // it's necessary because tagRelevance can depend on votes from other people so it's not that straightforward to
      // work out the final state from the data we have here.
      // This isn't necessary in the create case because we know there will be no existing tagRels when a post is created
      await updatePostDenormalizedTags(post._id);
    }
  }

  return post;
}

export async function resetDialogueMatches<T extends Pick<DbPost, '_id' | 'collabEditorDialogue' | 'draft'>>(post: T, props: UpdateCallbackProperties<'Posts'>) {
  const { oldDocument: oldPost } = props;

  const adminContext = createAdminContext();
  const { DialogueMatchPreferences } = adminContext;

  if (post.collabEditorDialogue && post.draft === false && oldPost.draft) {
    const matchForms = await DialogueMatchPreferences.find({generatedDialogueId: post._id, deleted: {$ne: true}}).fetch();
    await Promise.all(matchForms.map(matchForm => utils.resetDialogueMatch(matchForm, adminContext)));
  }
  return post;
}

/* UPDATE ASYNC */
export async function eventUpdatedNotifications({newDocument: newPost, oldDocument: oldPost, context}: UpdateCallbackProperties<'Posts'>) {
  const { Users } = context;
  // don't bother notifying people about past or unscheduled events
  const isUpcomingEvent = newPost.startTime && moment().isBefore(moment(newPost.startTime))
  // only send notifications if the event was already published *before* being edited
  const alreadyPublished = !oldPost.draft && !newPost.draft && !oldPost.authorIsUnreviewed && !newPost.authorIsUnreviewed
  if (utils.eventHasRelevantChangeForNotification(oldPost, newPost)
    && newPost.isEvent && isUpcomingEvent && alreadyPublished
  ) {
    // track the users who we've notified, so that we only do so once per user, even if they qualify for more than one notification
    let userIdsNotified: string[] = []

    // first email everyone who RSVP'd to the event
    const rsvpUsers = await getUsersToNotifyAboutEvent(newPost)
    for (let {userId,email} of rsvpUsers) {
      if (!email) continue
      const user = await Users.findOne(userId)
      if (userId) {
        userIdsNotified.push(userId)
      }
      
      await wrapAndSendEmail({
        user: user,
        to: email,
        subject: `Event updated: ${newPost.title}`,
        body: (emailContext) => <EventUpdatedEmail postId={newPost._id} emailContext={emailContext} />
      });
    }
    
    // then notify all users who want to be notified of events in a radius
    if (newPost.mongoLocation) {
      const radiusNotificationUsers = await getUsersWhereLocationIsInNotificationRadius(newPost.mongoLocation)
      const userIdsToNotify = difference(radiusNotificationUsers.map(user => user._id), userIdsNotified)
      await createNotifications({userIds: userIdsToNotify, notificationType: "editedEventInRadius", documentType: "post", documentId: newPost._id})
    }
  }
}

export async function notifyUsersAddedAsCoauthors({ oldDocument: oldPost, newDocument: newPost }: UpdateCallbackProperties<'Posts'>) {
  const newCoauthorIds = getConfirmedCoauthorIds(newPost);
  const oldCoauthorIds = getConfirmedCoauthorIds(oldPost);
  const addedCoauthorIds = difference(newCoauthorIds, oldCoauthorIds);

  if (addedCoauthorIds.length) {
    await createNotifications({ userIds: addedCoauthorIds, notificationType: "addedAsCoauthor", documentType: "post", documentId: newPost._id });
  }
}

// TODO: maybe combine with autoReviewNewPost and put it into the onPostPublished function
export async function autoTagUndraftedPost({oldDocument, newDocument, context}: UpdateCallbackProperties<'Posts'>) {
  if (oldDocument.draft && !newDocument.draft) {
    // Post was undrafted
    backgroundTask(utils.applyAutoTags(newDocument, context));
  }
}

export async function updatePostEmbeddingsOnChange(newPost: Pick<DbPost, '_id' | 'contents_latest' | 'draft' | 'deletedDraft' | 'status'>, oldPost?: DbPost) {
  const hasChanged = !oldPost || oldPost.contents_latest !== newPost.contents_latest;
  if (hasChanged &&
    !newPost.draft &&
    !newPost.deletedDraft &&
    newPost.status === postStatuses.STATUS_APPROVED &&
    !isAnyTest
  ) {
    try {
      await updatePostEmbeddings(newPost._id);
    } catch (e) {
      // We never want to prevent a post from being created/edited just
      // because we fail to create embeddings, but we do want to log it
      captureException(e);
      // eslint-disable-next-line
      console.error("Failed to create embeddings:", e);
    }
  }
}

// export async function updatePostEmbeddingsOnUpdate({document, oldDocument}: UpdateCallbackProperties<'Posts'>) {
//   await updateEmbeddings(document, oldDocument);
// }

export async function updatedPostMaybeTriggerReview({newDocument, oldDocument, context}: UpdateCallbackProperties<'Posts'>) {
  if (newDocument.draft || newDocument.rejected) return

  await triggerReviewIfNeeded(oldDocument.userId, context)
  
  // if the post author is already approved and the post is getting undrafted,
  // or the post author is getting approved,
  // then we consider this "publishing" the post
  if ((oldDocument.draft && !newDocument.authorIsUnreviewed) || (oldDocument.authorIsUnreviewed && !newDocument.authorIsUnreviewed)) {
    await onPostPublished(newDocument, context);
  }
}

export async function sendRejectionPM({ post, currentUser, context }: {post: DbPost, currentUser?: DbUser|null, context: ResolverContext}) {
  const { Users } = context;
  const postUser = await Users.findOne({_id: post.userId});

  const rejectedContentLink = `<span>post, <a href="https://lesswrong.com/posts/${post._id}/${post.slug}">${post.title}</a></span>`

  let messageContents = getRejectionMessage(rejectedContentLink, post.rejectedReason)

  // FYI EA Forum: Decide if you want this to always send emails the way you do for deletion. We think it's better not to.
  const noEmail = isEAForum
  ? false 
  : !(!!postUser?.reviewedByUserId && !postUser.snoozedUntilContentCount)
  const adminAccount = currentUser ?? await getAdminTeamAccount(context);
  if (!adminAccount) throw new Error("Couldn't find admin account for sending rejection PM");
  await utils.sendPostRejectionPM({
    post,
    messageContents: messageContents,
    lwAccount: adminAccount,
    noEmail,
    context,
  }); 
}

export async function maybeSendRejectionPM({ newDocument: post, oldDocument: oldPost, currentUser, context }: UpdateCallbackProperties<'Posts'>) {
  const postRejected = post.rejected && !oldPost.rejected;
  if (postRejected) {
    await sendRejectionPM({ post, currentUser, context });
  }
}

/**
 * Creates a moderator action when an admin sets one of the user's posts back to draft
 * This also adds a note to a user's sunshineNotes
 */
export async function updateUserNotesOnPostDraft({ newDocument, oldDocument, currentUser, context }: UpdateCallbackProperties<"Posts">) {
  if (!oldDocument.draft && newDocument.draft && userIsAdmin(currentUser)) {
    backgroundTask(createModeratorAction({
      data: {
        userId: newDocument.userId,
        type: MOVED_POST_TO_DRAFT,
        endedAt: new Date()
      },
    }, context));
  }
}

export async function updateUserNotesOnPostRejection({ newDocument, oldDocument, currentUser, context }: UpdateCallbackProperties<"Posts">) {
  if (!oldDocument.rejected && newDocument.rejected) {
    backgroundTask(createModeratorAction({
      data: {
        userId: newDocument.userId,
        type: REJECTED_POST,
        endedAt: new Date()
      },
    }, context));
  }
}

export async function updateRecombeePost({ newDocument, oldDocument, context }: UpdateCallbackProperties<'Posts'>) {
  // newDocument is only a "preview" and does not reliably have full post data, e.g. is missing contents.html
  // This does seem likely to be a bug in a the mutator logic
  const post = await context.loaders.Posts.load(newDocument._id);
  const redrafted = post.draft && !oldDocument.draft
  if ((post.draft && !redrafted) || !isRecombeeRecommendablePost(post)) return;

  if (recombeeEnabledSetting.get()) {
    backgroundTask(recombeeApi.upsertPost(post, context)
      // eslint-disable-next-line no-console
      .catch(e => console.log('Error when sending updated post to recombee', { e }))
    )
  }

  // if (vertexEnabledSetting.get()) {
  //   backgroundTask(googleVertexApi.upsertPost({ post }, context)
  //     // eslint-disable-next-line no-console
  //     .catch(e => console.log('Error when sending updated post to google vertex', { e }));
  //   )
  // }
}

/* EDIT ASYNC */
export function sendPostApprovalNotifications(post: Pick<DbPost, '_id' | 'userId' | 'status'>, oldPost: DbPost) {
  if (postIsApproved(post) && !postIsApproved(oldPost)) {
    backgroundTask(createNotifications({userIds: [post.userId], notificationType: 'postApproved', documentType: 'post', documentId: post._id}));
  }
}

export async function sendNewPublishedDialogueMessageNotifications(newPost: DbPost, oldPost: DbPost, context: ResolverContext) {
  if (newPost.collabEditorDialogue) {
    const [oldIds, newIds] = await Promise.all([
      getDialogueResponseIds(oldPost, context),
      getDialogueResponseIds(newPost, context),
    ]);
    const uniqueNewIds = difference(newIds, oldIds);
    
    if (uniqueNewIds.length > 0) {
      const dialogueParticipantIds = [newPost.userId, ...getConfirmedCoauthorIds(newPost)];
      const dialogueSubscribers = await getSubscribedUsers({
        documentId: newPost._id,
        collectionName: "Posts",
        type: subscriptionTypes.newPublishedDialogueMessages,
      });
      
      const dialogueSubscriberIds = dialogueSubscribers.map(sub => sub._id);
      const dialogueSubscriberIdsToNotify = difference(dialogueSubscriberIds, dialogueParticipantIds);
      await createNotifications({
        userIds: dialogueSubscriberIdsToNotify,
        notificationType: 'newPublishedDialogueMessages',
        documentType: 'post',
        documentId: newPost._id
      });
    }
  }
}

export async function removeRedraftNotifications(newPost: Pick<DbPost, '_id' | 'draft' | 'status'>, oldPost: DbPost, context: ResolverContext) {
  const { Notifications, TagRels } = context;

  if (!postIsPublic(newPost) && postIsPublic(oldPost)) {
      //eslint-disable-next-line no-console
    console.info("Post redrafted, removing notifications");

    // delete post notifications
    const postNotifications = await Notifications.find({documentId: newPost._id}).fetch()
    postNotifications.forEach(notification =>
      backgroundTask(updateNotification({ data: { deleted: true }, selector: { _id: notification._id } }, context))
    );

    // delete tagRel notifications (note this deletes them even if the TagRel itself has `deleted: true`)
    const tagRels = await TagRels.find({postId:newPost._id}).fetch()
    await asyncForeachSequential(tagRels, async (tagRel) => {
      const tagRelNotifications = await Notifications.find({documentId: tagRel._id}).fetch()
      tagRelNotifications.forEach(notification =>
        backgroundTask(updateNotification({ data: { deleted: true }, selector: { _id: notification._id } }, context))
      );
    });
  }
}

export async function sendEAFCuratedAuthorsNotification(post: DbPost, oldPost: DbPost, context: ResolverContext) {
  const { Users } = context;
  // On the EA Forum, when a post is curated, we send an email notifying all the post's authors
  if (post.curatedDate && !oldPost.curatedDate) {
    const coauthorIds = getConfirmedCoauthorIds(post)
    const authorIds = [post.userId, ...coauthorIds]
    const authors = await Users.find({
      _id: {$in: authorIds}
    }).fetch()
    
    backgroundTask(Promise.all(
      authors.map(async (author) => {
        return wrapAndSendEmail({
          user: author,
          subject: "We’ve curated your post",
          body: (emailContext) => <EmailCuratedAuthors user={author} post={post} emailContext={emailContext}/>
        })
      })
    ))
  }
}

export const curationEmailDelayDebouncer = new EventDebouncer({
  name: "curationEmail",
  defaultTiming: {
    type: "delayed",
    delayMinutes: 20,
  },
  callback: async (postId) => {
    const post = await Posts.findOne(postId);
    
    // Still curated? If it was un-curated during the 20 minute delay, don't
    // send emails.
    if (post?.curatedDate) {
      //eslint-disable-next-line no-console
      console.log(`Sending curation emails`);

      let usersToEmail = await findUsersToEmail({'emailSubscribedToCurated': true});

      //eslint-disable-next-line no-console
      console.log(`Found ${usersToEmail.length} users to email`);
      await sendCurationEmail({
        users: usersToEmail,
        postId,
        reason: "you have the \"Email me new posts in Curated\" option enabled"
      });
    } else {
      //eslint-disable-next-line no-console
      console.log(`Not sending curation notice for ${post?.title} because it was un-curated during the delay period.`);
    }
  }
});

export async function sendLWAFPostCurationEmails(post: DbPost, oldPost: DbPost) {
  if (post.curatedDate && !oldPost.curatedDate) {
    // Email admins immediately, everyone else after a 20-minute delay, so that
    // we get a chance to catch formatting issues with the email. (Admins get
    // emailed twice.)
    const adminsToEmail = await findUsersToEmail({'emailSubscribedToCurated': true, isAdmin: true});

    await sendCurationEmail({
      users: adminsToEmail,
      postId: post._id,
      reason: "you have the \"Email me new posts in Curated\" option enabled",
      subject: `[Admin preview] ${post.title}`,
    });
    
    if (!useCurationEmailsCron) {
      await curationEmailDelayDebouncer.recordEvent({
        key: post._id,
        af: false
      });  
    } else {
      await hydrateCurationEmailsQueue(post._id);
    }
  }
}

export async function sendPostSharedWithUserNotifications(newPost: DbPost, oldPost: DbPost) {
  if (!isEqual(newPost.shareWithUsers, oldPost.shareWithUsers)) {
    // Right now this only creates notifications when users are shared (and not when they are "unshared")
    // because currently notifications are hidden from you if you don't have view-access to a post.
    // TODO: probably fix that, such that users can see when they've lost access to post. [but, eh, I'm not sure this matters that much]
    const sharedUsers = difference(newPost.shareWithUsers || [], oldPost.shareWithUsers || [])
    await createNotifications({userIds: sharedUsers, notificationType: "postSharedWithUser", documentType: "post", documentId: newPost._id})
  }
}

export async function updatePostShortform(newPost: DbPost, oldPost: DbPost, context: ResolverContext) {
  const { Comments } = context;

  if (!!newPost.shortform !== !!oldPost.shortform) {
    const shortform = !!newPost.shortform;
    await Comments.rawUpdateMany(
      { postId: newPost._id },
      { $set: {
        shortform: shortform
      } },
      { multi: true }
    );
  }
}

// If an admin changes the "hideCommentKarma" setting of a post after it
// already has comments, update those comments' hideKarma field to have the new
// setting. This should almost never be used, as we really don't want to
// surprise users by revealing their supposedly hidden karma.
export async function updateCommentHideKarma(newPost: DbPost, oldPost: DbPost, context: ResolverContext) {
  const { Comments } = context;

  if (newPost.hideCommentKarma === oldPost.hideCommentKarma) return

  const comments = Comments.find({postId: newPost._id})
  if (!(await comments.count())) return
  const updates = (await comments.fetch()).map(comment => ({
    updateOne: {
      filter: {
        _id: comment._id,
      },
      update: {$set: {hideKarma: newPost.hideCommentKarma}}
    }
  }))
  await Comments.rawCollection().bulkWrite(updates)
}

// For posts without comments, update lastCommentedAt to match postedAt
//
// When the post is created, lastCommentedAt was set to the current date. If an
// admin or site feature updates postedAt that should change the "newness" of
// the post unless there's been active comments.
export async function oldPostsLastCommentedAt(post: DbPost, context: ResolverContext) {
  const { Posts } = context;
  // TODO maybe update this to properly handle AF comments. (I'm guessing it currently doesn't)
  if (post.commentCount) return

  await Posts.rawUpdateOne({ _id: post._id }, {$set: { lastCommentedAt: post.postedAt }})
}

export async function maybeCreateAutomatedContentEvaluation(post: DbPost, oldPost: DbPost, context: ResolverContext) {
  const shouldEvaluate = isLW && !post.draft && oldPost.draft && !context.currentUser?.reviewedByUserId;
  if (shouldEvaluate) {
    const revision = await getLatestContentsRevision(post, context);
    if (revision) {
      await createAutomatedContentEvaluation(revision, context);
    }
  }
}
