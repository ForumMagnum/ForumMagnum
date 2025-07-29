import React from "react";
import { commentIsHiddenPendingReview, commentIsNotPublicForAnyReason } from "@/lib/collections/comments/helpers";
import { ForumEventCommentMetadata } from "@/lib/collections/forumEvents/types";
import { REJECTED_COMMENT } from "@/lib/collections/moderatorActions/constants";
import { tagGetDiscussionUrl, EA_FORUM_COMMUNITY_TOPIC_ID } from "@/lib/collections/tags/helpers";
import { userShortformPostTitle } from "@/lib/collections/users/helpers";
import { isAnyTest } from "@/lib/executionEnvironment";
import { isEAForum } from "@/lib/instanceSettings";
import { recombeeEnabledSetting } from "@/lib/publicSettings";
import { randomId } from "@/lib/random";
import { userCanDo, userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { noDeletionPmReason } from "@/lib/collections/comments/constants";
import { fetchFragmentSingle } from "../fetchFragment";
import { checkModGPT } from "../languageModels/modGPT";
import { CreateCallbackProperties, UpdateCallbackProperties, AfterCreateCallbackProperties } from "../mutationCallbacks";
import { createNotifications, getSubscribedUsers } from "../notificationCallbacksHelpers";
import { rateLimitDateWhenUserNextAbleToComment } from "../rateLimitUtils";
import { recombeeApi } from "../recombee/client";
import { getCommentAncestorIds, getCommentSubtree } from "../utils/commentTreeUtils";
import { triggerReviewIfNeeded } from "./sunshineCallbackUtils";
import { captureEvent } from "@/lib/analyticsEvents";
import { akismetKeySetting, commentAncestorsToNotifySetting } from "../databaseSettings";
import { checkForAkismetSpam } from "../akismet";
import { getUsersToNotifyAboutEvent } from "../notificationCallbacks";
import { getConfirmedCoauthorIds, postGetPageUrl } from "@/lib/collections/posts/helpers";
import { wrapAndSendEmail } from "../emails/renderEmail";
import { subscriptionTypes } from "@/lib/collections/subscriptions/helpers";
import { swrInvalidatePostRoute } from "../cache/swr";
import { getAdminTeamAccount } from "../utils/adminTeamAccount";
import _ from "underscore";
import moment from "moment";
import isEqual from "lodash/isEqual";
import uniq from "lodash/uniq";
import { createConversation } from "../collections/conversations/mutations";
import { computeContextFromUser } from "../vulcan-lib/apollo-server/context";
import { createMessage } from "../collections/messages/mutations";
import { createPost, updatePost } from "../collections/posts/mutations";
import { getRejectionMessage } from "./helpers";
import { createModeratorAction } from "../collections/moderatorActions/mutations";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { updateUser } from "../collections/users/mutations";
import { updateComment } from "../collections/comments/mutations";
import { EmailComment } from "../emailComponents/EmailComment";
import { PostsOriginalContents, PostsRevision } from "@/lib/collections/posts/fragments";
import { backgroundTask } from "../utils/backgroundTask";

interface SendModerationPMParams {
  action: 'deleted' | 'rejected',
  messageContents: string,
  lwAccount: DbUser,
  comment: DbComment,
  noEmail: boolean,
  contentTitle?: string | null
  context: ResolverContext
}

const MINIMUM_APPROVAL_KARMA = 5;
const SPAM_KARMA_THRESHOLD = 10; //Threshold after which you are no longer affected by spam detection

export async function recalculateAFCommentMetadata(postId: string|null, context: ResolverContext) {
  const { Comments, Posts, loaders } = context;

  if (!postId)
    return;
  
  const afComments = await Comments.find({
    postId:postId,
    af: true,
    deleted: false
  }).fetch()

  const lastComment: DbComment = _.max(afComments, function(c){return c.postedAt;})
  const lastCommentedAt = (lastComment && lastComment.postedAt) || (await loaders.Posts.load(postId))?.postedAt || new Date()

  backgroundTask(updatePost({
    data: {
      // Needs to be recomputed after anything moves to/from AF; can't be handled
      // incrementally by simpler callbacks because a comment being removed from
      // AF might mean an unrelated comment is now the newest.
      afLastCommentedAt:new Date(lastCommentedAt),
      // Needs to be recomputed after anything moves to/from AF because those
      // moves are using raw updates.
      afCommentCount: afComments.length,
    },
    selector: { _id: postId }
  }, createAnonymousContext()))
}

const utils = {
  enforceCommentRateLimit: async ({user, comment, context}: {
    user: DbUser,
    comment: CreateCommentDataInput,
    context: ResolverContext,
  }) => {
    const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user, comment.postId ?? null, context);
    if (rateLimit) {
      const {nextEligible, rateLimitType:_} = rateLimit;
      if (nextEligible > new Date()) {
        // "fromNow" makes for a more human readable "how long till I can comment/post?".
        // moment.relativeTimeThreshold ensures that it doesn't appreviate unhelpfully to "now"
        moment.relativeTimeThreshold('ss', 0);
        throw new Error(`Rate limit: You cannot comment for ${moment(nextEligible).fromNow()} (until ${nextEligible})`);
      }
    }
  },

  /**
   * Run side effects based on the `forumEventMetadata` that is submitted.
   */
  forumEventSideEffects: async ({ comment, forumEventMetadata, context }: { comment: DbComment; forumEventMetadata: ForumEventCommentMetadata; context: ResolverContext; }) => {
    const { repos } = context;
    if (forumEventMetadata.eventFormat === "STICKERS") {
      const sticker = forumEventMetadata.sticker

      if (!comment.forumEventId) {
        throw new Error("Comment must have forumEventId")
      }

      const {_id, x, y, theta, emoji} = sticker ?? {};

      if (!sticker || !_id || !x || !y || !theta) {
        throw new Error("Must include sticker")
      }

      if (!emoji) {
        throw new Error("No emoji selected")
      }

      const forumEventId = comment.forumEventId;
      const stickerData = {_id, x, y, theta, emoji, commentId: comment._id, userId: comment.userId};

      await repos.forumEvents.addSticker({ forumEventId, stickerData });
      captureEvent("addForumEventSticker", {
        forumEventId,
        stickerData,
      });
    }
  },

  notifyRsvps: async (comment: DbComment, post: DbPost, context: ResolverContext) => {
    const { Users } = context;
    
    if (!post.rsvps || !post.rsvps.length) {
      return;
    }
    
    const emailsToNotify = await getUsersToNotifyAboutEvent(post);
    
    const postLink = postGetPageUrl(post, true);
    
    for (let {userId,email} of emailsToNotify) {
      if (!email) continue;
      const user = await Users.findOne(userId);
      
      await wrapAndSendEmail({
        user: user,
        to: email,
        subject: `New comment on ${post.title}`,
        body: <EmailComment commentId={comment._id}/>,
      });
    }
  },

  sendNewCommentNotifications: async (comment: DbComment, context: ResolverContext) => {
    const { Users, UserTagRels, loaders, repos } = context;
    const post = comment.postId ? await loaders.Posts.load(comment.postId) : null;
    
    if (comment.legacyData?.arbitalPageId) return;
    
    if (post?.isEvent) {
      await utils.notifyRsvps(comment, post, context);
    }
  
    // keep track of whom we've notified (so that we don't notify the same user twice for one comment,
    // if e.g. they're both the author of the post and the author of a comment being replied to)
    let notifiedUsers: Array<string> = [];
  
  
  
    // 1. Notify users who are subscribed to the parent comment
    if (comment.parentCommentId) {
  
      const parentComments: { commentId: string; userId: string }[] = await repos.comments.getParentCommentIds({
        commentId: comment._id,
        limit: commentAncestorsToNotifySetting.get(),
      });
  
      let newReplyUserIds: string[] = [];
      let newReplyToYouDirectUserIds: string[] = [];
      let newReplyToYouIndirectUserIds: string[] = [];
  
      for (const {commentId: currentParentCommentId, userId: currentParentCommentAuthorId} of parentComments) {
        const subscribedUsers = await getSubscribedUsers({
          documentId: currentParentCommentId,
          collectionName: "Comments",
          type: subscriptionTypes.newReplies,
          potentiallyDefaultSubscribedUserIds: [currentParentCommentAuthorId],
          userIsDefaultSubscribed: u => u.auto_subscribe_to_my_comments
        })
        const subscribedUserIds = _.map(subscribedUsers, u=>u._id);
  
        // Don't notify the author of their own comment, and filter out the author
        // of the parent-comment to be treated specially (with a newReplyToYou
        // notification instead of a newReply notification).
        newReplyUserIds = [...newReplyUserIds, ..._.difference(subscribedUserIds, [comment.userId, currentParentCommentAuthorId])]
  
        // Separately notify authors of replies to their own comments
        if (subscribedUserIds.includes(currentParentCommentAuthorId) && currentParentCommentAuthorId !== comment.userId) {
          if (currentParentCommentId === comment.parentCommentId) {
            newReplyToYouDirectUserIds = [...newReplyToYouDirectUserIds, currentParentCommentAuthorId]
          } else {
            newReplyToYouIndirectUserIds = [...newReplyToYouIndirectUserIds, currentParentCommentAuthorId]
          }
        }
      }

      // Take the difference to prevent double-notifying
      newReplyUserIds = uniq(_.difference(newReplyUserIds, [...newReplyToYouDirectUserIds, ...newReplyToYouIndirectUserIds]));
      newReplyToYouIndirectUserIds = uniq(_.difference(newReplyToYouIndirectUserIds, newReplyToYouDirectUserIds)); // Direct replies take precedence over indirect replies
      newReplyToYouDirectUserIds = uniq(newReplyToYouDirectUserIds);
  
      await Promise.all([
        createNotifications({userIds: newReplyUserIds, notificationType: 'newReply', documentType: 'comment', documentId: comment._id}),
        createNotifications({userIds: newReplyToYouDirectUserIds, notificationType: 'newReplyToYou', documentType: 'comment', documentId: comment._id, extraData: {direct: true}}),
        createNotifications({userIds: newReplyToYouIndirectUserIds, notificationType: 'newReplyToYou', documentType: 'comment', documentId: comment._id, extraData: {direct: false}})
      ]);
  
      notifiedUsers = [...notifiedUsers, ...newReplyUserIds, ...newReplyToYouDirectUserIds];
    }
  
    // 2. If this comment is a debate comment, notify users who are subscribed to the post as a debate (`newDebateComments`)
    if (post && comment.debateResponse) {
      // Get all the debate participants, but exclude the comment author if they're a debate participant
      const debateParticipantIds = _.difference([post.userId, ...(post.coauthorStatuses ?? []).map(coauthor => coauthor.userId)], [comment.userId]);
  
      const debateSubscribers = await getSubscribedUsers({
        documentId: comment.postId,
        collectionName: "Posts",
        type: subscriptionTypes.newDebateComments,
        potentiallyDefaultSubscribedUserIds: debateParticipantIds
      });
  
      const debateSubscriberIds = debateSubscribers.map(sub => sub._id);
      // Handle debate readers
      // Filter out debate participants, since they get a different notification type
      // (We shouldn't have notified any users for these comments previously, but leaving that in for sanity)
      const debateSubscriberIdsToNotify = _.difference(debateSubscriberIds, [...debateParticipantIds, ...notifiedUsers, comment.userId]);
      await createNotifications({ userIds: debateSubscriberIdsToNotify, notificationType: 'newDebateComment', documentType: 'comment', documentId: comment._id });
  
      // Handle debate participants
      const subscribedParticipantIds = _.intersection(debateSubscriberIds, debateParticipantIds);
      await createNotifications({ userIds: subscribedParticipantIds, notificationType: 'newDebateReply', documentType: 'comment', documentId: comment._id });
  
      // Avoid notifying users who are subscribed to both the debate comments and regular comments on a debate twice 
      notifiedUsers = [...notifiedUsers, ...debateSubscriberIdsToNotify, ...subscribedParticipantIds];
    }
    
    // 3. Notify users who are subscribed to the post (which may or may not include the post's author)
    let userIdsSubscribedToPost: Array<string> = [];
    const usersSubscribedToPost = await getSubscribedUsers({
      documentId: comment.postId,
      collectionName: "Posts",
      type: subscriptionTypes.newComments,
      potentiallyDefaultSubscribedUserIds: post ? [post.userId, ...getConfirmedCoauthorIds(post)] : [],
      userIsDefaultSubscribed: u => u.auto_subscribe_to_my_posts
    })
    userIdsSubscribedToPost = _.map(usersSubscribedToPost, u=>u._id);
    
    // if the post is associated with a group, also (potentially) notify the group organizers
    if (post && post.groupId) {
      const group = await loaders.Localgroups.load(post.groupId)
      if (group?.organizerIds && group.organizerIds.length) {
        const subsWithOrganizers = await getSubscribedUsers({
          documentId: comment.postId,
          collectionName: "Posts",
          type: subscriptionTypes.newComments,
          potentiallyDefaultSubscribedUserIds: group.organizerIds,
          userIsDefaultSubscribed: u => u.autoSubscribeAsOrganizer
        })
        userIdsSubscribedToPost = _.union(userIdsSubscribedToPost, _.map(subsWithOrganizers, u=>u._id))
      }
    }
  
    // Notify users who are subscribed to shortform posts
    if (!comment.topLevelCommentId && comment.shortform) {
      const usersSubscribedToShortform = await getSubscribedUsers({
        documentId: comment.postId,
        collectionName: "Posts",
        type: subscriptionTypes.newShortform
      })
      const userIdsSubscribedToShortform = _.map(usersSubscribedToShortform, u=>u._id);
      await createNotifications({userIds: userIdsSubscribedToShortform, notificationType: 'newShortform', documentType: 'comment', documentId: comment._id});
      notifiedUsers = [ ...userIdsSubscribedToShortform, ...notifiedUsers]
    }
    
    // remove userIds of users that have already been notified
    // and of comment author (they could be replying in a thread they're subscribed to)
    const postSubscriberIdsToNotify = _.difference(userIdsSubscribedToPost, [...notifiedUsers, comment.userId])
    if (postSubscriberIdsToNotify.length > 0) {
      await createNotifications({userIds: postSubscriberIdsToNotify, notificationType: 'newComment', documentType: 'comment', documentId: comment._id})
      notifiedUsers = [ ...notifiedUsers, ...postSubscriberIdsToNotify]
    }
    
    // 4. If this comment is in a subforum, notify members with email notifications enabled
    if (
      comment.tagId &&
      comment.tagCommentType === "SUBFORUM" &&
      !comment.topLevelCommentId &&
      !comment.authorIsUnreviewed // FIXME: make this more general, and possibly queue up notifications from unreviewed users to send once they are approved
    ) {
      const subforumSubcribedUsers = await Users.find({profileTagIds: comment.tagId}).fetch();
      const subforumSubscriberIds = subforumSubcribedUsers.map((u) => u._id);
      const subforumSubscriberIdsMaybeNotify = (
        await UserTagRels.find({
          userId: { $in: subforumSubscriberIds },
          tagId: comment.tagId,
          subforumEmailNotifications: true,
        }).fetch()
      ).map((u) => u.userId);
      const subforumSubscriberIdsToNotify = _.difference(subforumSubscriberIdsMaybeNotify, [...notifiedUsers, comment.userId])
  
      await createNotifications({
        userIds: subforumSubscriberIdsToNotify,
        notificationType: "newSubforumComment",
        documentType: "comment",
        documentId: comment._id,
      });
    }
  
    // 5. Notify users who are subscribed to comments by the comment author
    const commentAuthorSubscribers = await getSubscribedUsers({
      documentId: comment.userId,
      collectionName: "Users",
      type: subscriptionTypes.newUserComments
    })
    const commentAuthorSubscriberIds = commentAuthorSubscribers.map(({ _id }) => _id)
    const commentAuthorSubscriberIdsToNotify = _.difference(commentAuthorSubscriberIds, notifiedUsers)
    await createNotifications({
      userIds: commentAuthorSubscriberIdsToNotify, 
      notificationType: 'newUserComment', 
      documentType: 'comment', 
      documentId: comment._id
    });
  },

  //TODO: Probably change these to take a boolean argument?
  updateParentsSetAFtrue: async (comment: DbComment, context: ResolverContext) => {
    const { Comments } = context;

    const ancestorIds = await getCommentAncestorIds(comment);
    if (ancestorIds.length > 0) {
      await Comments.rawUpdateMany({_id: {$in: ancestorIds}}, {$set: {af: true}});
    }
  },

  updateChildrenSetAFfalse: async (comment: DbComment, context: ResolverContext) => {
    const { Comments } = context;
    const subtreeComments: DbComment[] = await getCommentSubtree(comment);
    if (subtreeComments.length > 0) {
      const subtreeCommentIds: string[] = subtreeComments.map(c=>c._id);
      await Comments.rawUpdateMany({_id: {$in: subtreeCommentIds}}, {$set: {af: false}});
    }
  },

  // TODO: I don't think this function makes sense anymore, I think should be refactored in some way.
  sendModerationPM: async ({ messageContents, lwAccount, comment, noEmail, contentTitle, action, context }: SendModerationPMParams) => {
    const { Conversations, Messages } = context;

    const conversationData: CreateConversationDataInput = {
      participantIds: [comment.userId, lwAccount._id],
      title: `Comment ${action} on ${contentTitle}`,
      ...(action === 'rejected' ? { moderator: true } : {})
    };

    const lwAccountContext = await computeContextFromUser({ user: lwAccount, req: context.req, res: context.res, isSSR: context.isSSR });

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
      console.log("Sent moderation messages for comment", comment._id);
    }
  },

  commentsDeleteSendPMAsync: async (comment: DbComment, currentUser: DbUser | undefined, context: ResolverContext) => {
    const { loaders } = context;
  
    const commentDeletedByAnotherUser =
      (!comment.deletedByUserId || comment.deletedByUserId !== comment.userId)
      && comment.deleted
      && comment.contents?.html;
  
    const noPmDeletionReason = comment.deletedReason === noDeletionPmReason;
    if (commentDeletedByAnotherUser && !noPmDeletionReason) {
      const contentTitle = comment.tagId
        ? (await loaders.Tags.load(comment.tagId))?.name
        : (comment.postId
          ? (await loaders.Posts.load(comment.postId))?.title
          : null
        );
      const moderatingUser = comment.deletedByUserId ? await loaders.Users.load(comment.deletedByUserId) : null;
      const commentUser = await loaders.Users.load(comment.userId)
      const lwAccount = await getAdminTeamAccount(context) ?? commentUser;
      if (!lwAccount) {
        // Something has gone horribly wrong
        throw new Error("Could not find admin account to send PM from");
      }
  
      let messageContents =
          `<div>
            <p>One of your comments on "${contentTitle}" has been removed by ${(moderatingUser?.displayName) || "the Akismet spam integration"}. We've sent you another PM with the content. If this deletion seems wrong to you, please send us a message on Intercom (the icon in the bottom-right of the page); we will not see replies to this conversation.</p>
            <p>The contents of your message are here:</p>
            <blockquote>
              ${comment.contents?.html}
            </blockquote>
          </div>`
      if (comment.deletedReason && moderatingUser) {
        messageContents += ` They gave the following reason: "${comment.deletedReason}".`;
      }
  
      // EAForum always sends an email when deleting comments. Other ForumMagnum sites send emails if the user has been approved, but not otherwise (so that admins can delete comments by mediocre users without sending them an email notification that might draw their attention back to the site.)
      const noEmail = isEAForum
      ? false 
      : !(!!commentUser?.reviewedByUserId && !commentUser.snoozedUntilContentCount)
  
      await utils.sendModerationPM({
        action: 'deleted',
        comment,
        messageContents,
        lwAccount,
        noEmail,
        contentTitle,
        context,
      });
    
    }
  },

  commentsRejectSendPMAsync: async (comment: DbComment, currentUser: DbUser, context: ResolverContext) => {
    const { loaders } = context;
  
    let rejectedContentLink = "[Error: content not found]"
    let contentTitle: string|null = null
  
    if (comment.tagId) {
      const tag = await loaders.Tags.load(comment.tagId)
      if (tag) {
        contentTitle = tag.name
        rejectedContentLink = `<a href=${tagGetDiscussionUrl({slug: tag.slug}, true)}` + `?commentId=${comment._id}">comment on ${tag.name}</a>`
      }
    } else if (comment.postId) {
      const post = await loaders.Posts.load(comment.postId)
      if (post) {
        contentTitle = post.title
        rejectedContentLink = `<a href="https://lesswrong.com/posts/${post._id}/${post.slug}?commentId=${comment._id}">comment on ${post.title}</a>`
      }
    }
  
    const commentUser = await loaders.Users.load(comment.userId)
  
    let messageContents = getRejectionMessage(rejectedContentLink, comment.rejectedReason)
    
    // EAForum always sends an email when deleting comments. Other ForumMagnum sites send emails if the user has been approved, but not otherwise (so that admins can reject comments by mediocre users without sending them an email notification that might draw their attention back to the site.)
    const noEmail = isEAForum 
    ? false 
    : !(!!commentUser?.reviewedByUserId && !commentUser.snoozedUntilContentCount)
  
    await utils.sendModerationPM({
      action: 'rejected',
      comment,
      messageContents,
      lwAccount: currentUser,
      noEmail,
      contentTitle,
      context,
    });
  },

  moderateCommentsPostUpdate: async (comment: DbComment, currentUser: DbUser, action: 'deleted' | 'rejected', context: ResolverContext) => {
    const { Comments, Posts, loaders } = context;

    await recalculateAFCommentMetadata(comment.postId, context)
    
    if (comment.postId) {
      const comments = await Comments.find({postId:comment.postId, deleted: false, debateResponse: false}).fetch()
    
      const lastComment: DbComment = _.max(comments, (c) => c.postedAt)
      const lastCommentedAt = (lastComment && lastComment.postedAt) || (await loaders.Posts.load(comment.postId))?.postedAt || new Date()
    
      backgroundTask(updatePost({
        data: {
          lastCommentedAt: new Date(lastCommentedAt),
        },
        selector: { _id: comment.postId }
      }, createAnonymousContext()));
    }
    if (action === 'deleted') {
      backgroundTask(utils.commentsDeleteSendPMAsync(comment, currentUser, context));
    } else {
      backgroundTask(utils.commentsRejectSendPMAsync(comment, currentUser, context));
    }
  }
};


/* CREATE VALIDATE */
export function newCommentsEmptyCheck(comment: CreateCommentDataInput) {
  const { data } = (comment.contents && comment.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot submit an empty comment");
  }
}

export function newCommentsPollResponseCheck(comment: CreateCommentDataInput) {
  const { data } = (comment.contents && comment.contents.originalContents) || {}
  const commentPrompt = (comment.forumEventMetadata as ForumEventCommentMetadata)?.poll?.commentPrompt;

  if (commentPrompt && data) {
    // commentPrompt will be like `<blockquote>${plaintextQuestion}</blockquote><p></p>`
    // If unedited, data will be like `<blockquote><p>${plaintextQuestion}</p></blockquote><p>&nbsp;</p>`

    // Normalize both strings by removing HTML tags, replacing &nbsp;, and trimming/collapsing whitespace.
    const normalize = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

    const normalizedPrompt = normalize(commentPrompt);
    const normalizedData = normalize(data);

    if (normalizedPrompt && normalizedData === normalizedPrompt) {
      throw new Error("Cannot submit only the prefilled text");
    }
  }
}

export async function newCommentsRateLimit(newComment: CreateCommentDataInput, currentUser: DbUser, context: ResolverContext) {
  if (!currentUser) {
    throw new Error(`Can't comment while logged out.`);
  }
  await utils.enforceCommentRateLimit({user: currentUser, comment: newComment, context});
}

/* CREATE BEFORE */
export async function assignPostVersion(comment: CreateCommentDataInput) {
  if (!comment.postId) {
    return {
      ...comment,
      postVersion: "1.0.0",
    };
  }
  
  const post = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentDoc: PostsRevision,
    currentUser: null,
    selector: {
      _id: comment.postId,
    },
  });

  const postVersion = (post && post.contents && post.contents.version) || "1.0.0";
  return {
    ...comment,
    postVersion,
  };
}

export async function createShortformPost(comment: CreateCommentDataInput, { currentUser, context }: CreateCallbackProperties<"Comments">) {
  const { Posts, Users } = context;
  if (!currentUser) {
    throw new Error("Must be logged in");
  }
  if (comment.shortform && !comment.postId) {
    if (currentUser.shortformFeedId) {
      return ({
        ...comment,
        postId: currentUser.shortformFeedId
      });
    }

    const post = await createPost({
      data: {
        userId: currentUser._id,
        shortform: true,
        title: userShortformPostTitle(currentUser),
        af: currentUser.groups?.includes('alignmentForum'),
      },
    }, context);

    await updateUser({
      data: {
        shortformFeedId: post._id
      },
      selector: { _id: currentUser._id }
    }, createAnonymousContext())

    return ({
      ...comment,
      postId: post._id
    })
  }
  
  return comment;
}

export function addReferrerToComment(comment: CreateCommentDataInput, properties: CreateCallbackProperties<"Comments">) {
  if (properties && properties.context && properties.context.headers) {
    let referrer = properties.context.headers["referer"];
    let userAgent = properties.context.headers["user-agent"];
    
    return {
      ...comment,
      referrer: referrer,
      userAgent: userAgent,
    };
  }
}

export async function handleReplyToAnswer(comment: CreateCommentDataInput, properties: CreateCallbackProperties<"Comments">) {
  const { context: { Comments } } = properties;
  
  if (comment.parentCommentId) {
    let parentComment = await Comments.findOne(comment.parentCommentId)
    if (parentComment) {
      let modifiedComment = {...comment};
      
      if (parentComment.answer) {
        modifiedComment.parentAnswerId = parentComment._id;
      }
      if (parentComment.parentAnswerId) {
        modifiedComment.parentAnswerId = parentComment.parentAnswerId;
      }
      if (parentComment.tagId) {
        modifiedComment.tagId = parentComment.tagId;
        modifiedComment.tagCommentType = parentComment.tagCommentType;
      }
      if (parentComment.topLevelCommentId) {
        modifiedComment.topLevelCommentId = parentComment.topLevelCommentId;
      }
      
      return modifiedComment;
    }
  }
  return comment;
}

export async function setTopLevelCommentId(comment: CreateCommentDataInput, properties: CreateCallbackProperties<"Comments">) {
  const { context: { Comments } } = properties;
  
  let visited: Partial<Record<string,boolean>> = {};
  // Technically this cast isn't safe, but we only try to get _id of the current comment after fetching the parentComment at least once
  let rootComment: DbComment|null = comment as DbComment;
  while (rootComment?.parentCommentId) {
    // This relies on Meteor fibers (rather than being async/await) because
    // Vulcan callbacks aren't async-safe.
    rootComment = await Comments.findOne({_id: rootComment.parentCommentId});
    if (rootComment && visited[rootComment._id])
      throw new Error("Cyclic parent-comment relations detected!");
    if (rootComment)
      visited[rootComment._id] = true;
  }
  
  // NOTE: This used to do a comparison with the comment._id, but I think that was always returning true because the comment was not yet saved to the database
  // Need to review this carefully.
  if (rootComment && !isEqual(rootComment, comment)) {
    return {
      ...comment,
      topLevelCommentId: rootComment._id
    };
  }
  return comment;
}


/* NEW SYNC */
export async function commentsNewOperations(comment: CreateCommentDataInput, _: DbUser | null, context: ResolverContext) {
  const { Posts, Tags, ReadStatuses, loaders } = context;
  // update lastCommentedAt field on post or tag
  if (comment.postId) {
    const lastCommentedAt = new Date()

    // Debate responses should not trigger lastCommentedAt updates
    // (we're using a Promise.resolve() here to make sure we always have a promise to await)
    const updateLastCommentedAtPromise = comment.debateResponse 
      ? Promise.resolve()
      : Posts.rawUpdateOne(comment.postId, {$set: {lastCommentedAt}})

    // we're updating the comment author's lastVisitedAt time for the post as well,
    // so that their comment doesn't cause the post to look like it has unread comments
    const updateReadStatusesPromise = ReadStatuses.rawUpdateOne({
      postId: comment.postId,
      userId: comment.userId,
      tagId: null,
    }, {
      $set: {
        lastUpdated: lastCommentedAt
      }
    })

    await Promise.all([
      updateLastCommentedAtPromise,
      updateReadStatusesPromise
    ])

    // update the lastCommentedAt field in Recombee version of post
    if (recombeeEnabledSetting.get() && !comment.debateResponse) {
      const post = await loaders.Posts.load(comment.postId)
      if (post) {
        // eslint-disable-next-line no-console
        backgroundTask(recombeeApi.upsertPost(post, context).catch(e => console.log('Error when sending commented on post to recombee', { e })));
      }
    }

  } else if (comment.tagId) {
    const fieldToSet = comment.tagCommentType === "SUBFORUM" ? "lastSubforumCommentAt" : "lastCommentedAt"
    await Tags.rawUpdateOne(comment.tagId, {
      $set: {[fieldToSet]: new Date()},
    });
  }

  return comment;
}

// Duplicate of PostsNewUserApprovedStatus
export async function commentsNewUserApprovedStatus(comment: CreateCommentDataInput, context: ResolverContext) {
  const { Users } = context;

  const commentAuthor = await Users.findOne(comment.userId);
  if (!commentAuthor?.reviewedByUserId && (commentAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...comment, authorIsUnreviewed: true}
  }
  return comment;
}

export async function handleForumEventMetadataNew(comment: CreateCommentDataInput & { _id?: string }, context: ResolverContext) {
  if (comment.forumEventMetadata) {
    // Side effects may need to reference the comment, so set the _id now
    comment._id = comment._id || randomId();
    await utils.forumEventSideEffects({ comment: comment as DbComment, forumEventMetadata: comment.forumEventMetadata, context });
  }
  return comment;
}


/* CREATE AFTER */
export function invalidatePostOnCommentCreate({ postId }: DbComment) {
  if (!postId) return;
  backgroundTask(swrInvalidatePostRoute(postId));
}

export async function updateDescendentCommentCountsOnCreate(comment: DbComment, properties: AfterCreateCallbackProperties<'Comments'>) {
  const { Comments } = properties.context;
  const ancestorIds: string[] = await getCommentAncestorIds(comment);
  
  await Comments.rawUpdateMany({ _id: {$in: ancestorIds} }, {
    $set: {lastSubthreadActivity: new Date()},
    $inc: {descendentCount:1},
  });
  
  return comment;
}

/* NEW AFTER */
// Make users upvote their own new comments
export async function lwCommentsNewUpvoteOwnComment(comment: DbComment, currentUser: DbUser|null, properties: AfterCreateCallbackProperties<'Comments'>) {
  const { context: { Comments, loaders } } = properties;

  const start = Date.now();
  var commentAuthor = await loaders.Users.load(comment.userId);
  if (!commentAuthor) throw new Error(`Could not find user: ${comment.userId}`);
  const { performVoteServer } = require("../voteServer");
  const {modifiedDocument: votedComment} = await performVoteServer({
    document: comment,
    voteType: 'smallUpvote',
    collection: Comments,
    user: commentAuthor,
    skipRateLimits: true,
    selfVote: true
  })

  const timeElapsed = Date.now() - start;
  captureEvent('selfUpvoteComment', {
    commentId: comment._id,
    timeElapsed
  }, true);
  return {...comment, ...votedComment} as DbComment;
}

export async function checkCommentForSpamWithAkismet(comment: DbComment, currentUser: DbUser|null, properties: AfterCreateCallbackProperties<'Comments'>) {
  const { context } = properties;
  const { Comments } = context;
  if (!currentUser) throw new Error("Submitted comment has no associated user");
  
  // Don't spam-check imported comments
  if (comment.legacyData?.arbitalPageId) {
    return comment;
  }

  const unreviewedUser = !currentUser.reviewedByUserId;
  
  if (unreviewedUser && akismetKeySetting.get()) {
    const start = Date.now();

    const spam = await checkForAkismetSpam({document: comment, type: "comment", context})

    const timeElapsed = Date.now() - start;
    captureEvent('checkForAkismetSpamCompleted', {
      commentId: comment._id,
      timeElapsed
    }, true);

    if (spam) {
      if (((currentUser.karma || 0) < SPAM_KARMA_THRESHOLD) && !currentUser.reviewedByUserId) {
        // eslint-disable-next-line no-console
        console.log("Deleting comment from user below spam threshold", comment)
        await updateComment({
          data: {
            deleted: true,
            deletedDate: new Date(),
            deletedReason: "This comment has been marked as spam by the Akismet spam integration. We've sent the poster a PM with the content. If this deletion seems wrong to you, please send us a message on Intercom (the icon in the bottom-right of the page)."
          },
          selector: { _id: comment._id }
        }, createAnonymousContext());
      }
    } else {
      //eslint-disable-next-line no-console
      console.log('Comment marked as not spam', comment._id);
    }
  }
  return comment
}


/* CREATE ASYNC */
export async function newCommentTriggerReview({document, context}: AfterCreateCallbackProperties<'Comments'>) {
  await triggerReviewIfNeeded({userId: document.userId, context, rejectableContent: {
    content: document,
    collectionName: "Comments"
  }});
}

export async function trackCommentRateLimitHit({document, context}: AfterCreateCallbackProperties<'Comments'>) {
  const { loaders } = context;
  const user = await loaders.Users.load(document.userId)
  
  if (user) {
    const rateLimit = await rateLimitDateWhenUserNextAbleToComment(user, null, context)
    // if the user has created a comment that makes them hit the rate limit, record an event
    // (ignore the universal 8 sec rate limit)
    if (rateLimit && rateLimit.rateLimitType !== 'universal') {
      captureEvent("commentRateLimitHit", {
        rateLimitType: rateLimit.rateLimitType,
        userId: document.userId,
        commentId: document._id
      })
    }
  }
}

export async function checkModGPTOnCommentCreate({document, context}: AfterCreateCallbackProperties<'Comments'>) {
  // On the EA Forum, ModGPT checks earnest comments on posts for norm violations.
  // We skip comments by unreviewed authors, because those will be reviewed by a human.
  if (
    !isEAForum ||
    !document.postId ||
    document.deleted ||
    document.deletedPublic ||
    document.spam ||
    document.needsReview ||
    document.authorIsUnreviewed ||
    document.retracted ||
    document.rejected ||
    document.shortform ||
    document.moderatorHat
  ) {
    return
  }
  
  // only have ModGPT check comments on posts tagged with "Community"
  const post = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentDoc: PostsOriginalContents,
    currentUser: null,
    skipFiltering: true,
    selector: {_id: document.postId},
  });
  if (!post) return
  
  const postTags = post.tagRelevance
  if (!postTags || !Object.keys(postTags).includes(EA_FORUM_COMMUNITY_TOPIC_ID)) return
  
  backgroundTask(checkModGPT(document, post, context))
}

// Elastic callback might go here

/* NEW ASYNC */
export async function alignmentCommentsNewOperations(comment: DbComment, context: ResolverContext) {
  if (comment.af) {
    await recalculateAFCommentMetadata(comment.postId, context)
  }
}

export async function commentsAlignmentNew(comment: DbComment, context: ResolverContext) {
  if (comment.af) {
    await utils.updateParentsSetAFtrue(comment, context);
    await recalculateAFCommentMetadata(comment.postId, context)
  }
}

export async function commentsNewNotifications(comment: DbComment, context: ResolverContext) {
  // if the site is currently hiding comments by unreviewed authors, do not send notifications if this comment should be hidden
  if (commentIsNotPublicForAnyReason(comment)) return
  
  backgroundTask(utils.sendNewCommentNotifications(comment, context))
}

/* UPDATE VALIDATE */


/* UPDATE BEFORE */
export function updatePostLastCommentPromotedAt(data: UpdateCommentDataInput, { oldDocument, newDocument, context, currentUser }: UpdateCallbackProperties<"Comments">) {
  if (data?.promoted && !oldDocument.promoted && newDocument.postId) {
    backgroundTask(updatePost({
      data: {
        lastCommentPromotedAt: new Date(),
      },
      selector: { _id: newDocument.postId }
    }, context));
    const promotedByUserId = currentUser?._id;
    return { ...data, promotedByUserId };
  }

  return data;
}

export function handleDraftState(data: UpdateCommentDataInput, { oldDocument }: UpdateCallbackProperties<'Comments'>) {
  // Prevent converting a comment back to draft
  if (data.draft === true && oldDocument.draft === false) {
    throw new Error("You cannot convert a published comment back to draft.");
  }
  // Update postedAt when a comment is moved out of drafts.
  if (data.draft === false && oldDocument.draft) {
    data.postedAt = new Date();
  }
  return data;
}

export async function validateDeleteOperations(data: UpdateCommentDataInput, properties: UpdateCallbackProperties<"Comments">) {
  const { Comments } = properties.context;
  // Validate changes to comment deletion fields (deleted, deletedPublic,
  // deletedReason). This could be deleting a comment, undoing a delete, or
  // changing the reason/public-ness of the deletion.
  //
  // Note that this is normally called via the mutaiton inside the
  // moderateComment mutator, which has already enforced some things; in
  // particular it will have checked `userCanModerateComment` and filled in
  // deletedByUserId and deletedDate.

  // First check that anything relevant to deletion has changed
  if (properties.oldDocument.deleted !== properties.newDocument.deleted
   || properties.oldDocument.deletedPublic !== properties.newDocument.deletedPublic
   || properties.oldDocument.deletedReason !== properties.newDocument.deletedReason
  ) {
    if (properties.newDocument.deletedPublic && !properties.newDocument.deleted) {
      throw new Error("You cannot publicly delete a comment without also deleting it")
    }
    
    if (properties.newDocument.deleted && !properties.oldDocument.deleted) {
      // Deletion
      const childrenComments = await Comments.find({parentCommentId: properties.newDocument._id}).fetch()
      const filteredChildrenComments = _.filter(childrenComments, (c) => !(c && c.deleted))
      if (
        filteredChildrenComments &&
        (filteredChildrenComments.length > 0) &&
        !userCanDo(properties.currentUser, 'comment.remove.all')
      ) {
        throw new Error("You cannot delete a comment that has children")
      }
    } else if (properties.oldDocument.deleted && !properties.newDocument.deleted) {
      // Undeletion
      //
      // Deletions can be undone by mods and by the person who did the deletion
      // (regardless of whether they would still have permission to do that
      // deletion now).
      if (
        !userIsAdminOrMod(properties.currentUser)
        && properties.oldDocument.deletedByUserId !== properties.currentUser?._id
      ) {
        throw new Error("You cannot undo deletion of a comment deleted by someone else");
      }
    } else if (properties.newDocument.deleted) {
      // Changing metadata on a deleted comment requires the same permissions as
      // undeleting (either a moderator, or was the person who did the deletion
      // in the first place)
      if (
        properties.newDocument.deleted
        && properties.currentUser?._id !== properties.oldDocument.deletedByUserId
        && !userIsAdminOrMod(properties.currentUser)
      ) {
        throw new Error("You cannot edit the deleted status of a comment that's been deleted by someone else")
      }
    }
  }

  return data;
}

/* EDIT SYNC */
export async function moveToAnswers(modifier: MongoModifier, comment: DbComment, context: ResolverContext) {
  const { Comments } = context;

  if (modifier.$set) {
    if (modifier.$set.answer === true) {
      await Comments.rawUpdateMany({topLevelCommentId: comment._id}, {$set:{parentAnswerId:comment._id}}, { multi: true })
    } else if (modifier.$set.answer === false) {
      await Comments.rawUpdateMany({topLevelCommentId: comment._id}, {$unset:{parentAnswerId:true}}, { multi: true })
    }
  }
  return modifier
}

export async function handleForumEventMetadataEdit(modifier: MongoModifier, comment: DbComment, context: ResolverContext) {
  const newMetadata = modifier.$set?.forumEventMetadata;
  if (newMetadata && !isEqual(comment.forumEventMetadata, newMetadata)) {
    await utils.forumEventSideEffects({ comment, forumEventMetadata: newMetadata, context });
  }
  return modifier
}

/* UPDATE AFTER */
export function invalidatePostOnCommentUpdate({ postId }: { postId: string | null }) {
  if (!postId) return;
  backgroundTask(swrInvalidatePostRoute(postId));
}

export async function updateDescendentCommentCountsOnEdit(comment: DbComment, properties: UpdateCallbackProperties<"Comments">) {
  const { context: { Comments } } = properties;

  let changedField: 'deleted' | 'rejected' | undefined;
  if (properties.oldDocument.deleted !== properties.newDocument.deleted) {
    changedField = 'deleted';
  } else if (properties.oldDocument.rejected !== properties.newDocument.rejected) {
    changedField = 'rejected';
  }
  if (changedField) {
    const ancestorIds: string[] = await getCommentAncestorIds(comment);
    const increment = properties.oldDocument[changedField] ? 1 : -1;
    await Comments.rawUpdateMany({_id: {$in: ancestorIds}}, {$inc: {descendentCount: increment}})
  }
  return comment;
}


/* UPDATE ASYNC */
export async function updatedCommentMaybeTriggerReview({ currentUser, context }: UpdateCallbackProperties<"Comments">) {
  const { Users } = context;
  if (!currentUser) return;
  currentUser.snoozedUntilContentCount && await updateUser({ data: {
        snoozedUntilContentCount: currentUser.snoozedUntilContentCount - 1,
      }, selector: { _id: currentUser._id } }, createAnonymousContext())
  await triggerReviewIfNeeded({userId: currentUser._id, context})
}

export async function updateUserNotesOnCommentRejection({ newDocument, oldDocument, currentUser, context }: UpdateCallbackProperties<"Comments">) {
  if (!oldDocument.rejected && newDocument.rejected) {
    backgroundTask(createModeratorAction({
      data: {
        userId: newDocument.userId,
        type: REJECTED_COMMENT,
        endedAt: new Date(),
      }
    }, context));
  }
}

export async function checkModGPTOnCommentUpdate({oldDocument, newDocument, context}: UpdateCallbackProperties<"Comments">) {
  // On the EA Forum, ModGPT checks earnest comments on posts for norm violations.
  // We skip comments by unreviewed authors, because those will be reviewed by a human.
  if (
    !isEAForum ||
    !newDocument.postId ||
    newDocument.deleted ||
    newDocument.deletedPublic ||
    newDocument.spam ||
    newDocument.needsReview ||
    newDocument.authorIsUnreviewed ||
    newDocument.retracted ||
    newDocument.rejected ||
    newDocument.shortform ||
    newDocument.moderatorHat ||
    !newDocument.contents?.originalContents?.data
  ) {
    return
  }
  
  const noChange = oldDocument.contents?.originalContents?.data === newDocument.contents.originalContents.data
  if (noChange) return

  // only have ModGPT check comments on posts tagged with "Community"
  const post = await fetchFragmentSingle({
    collectionName: "Posts",
    fragmentDoc: PostsOriginalContents,
    currentUser: null,
    skipFiltering: true,
    selector: {_id: newDocument.postId},
  });
  if (!post) return
  
  const postTags = post.tagRelevance
  if (!postTags || !Object.keys(postTags).includes(EA_FORUM_COMMUNITY_TOPIC_ID)) return
  
  backgroundTask(checkModGPT(newDocument, post, context))
}

/* EDIT ASYNC */
export async function commentsAlignmentEdit(comment: DbComment, oldComment: DbComment, context: ResolverContext) {
  if (comment.af && !oldComment.af) {
    await utils.updateParentsSetAFtrue(comment, context);
    await recalculateAFCommentMetadata(comment.postId, context);
  }
  if (!comment.af && oldComment.af) {
    await utils.updateChildrenSetAFfalse(comment, context);
    await recalculateAFCommentMetadata(comment.postId, context);
  }
}

export async function commentsEditSoftDeleteCallback(comment: DbComment, oldComment: DbComment, currentUser: DbUser, context: ResolverContext) {
  const commentDeleted = comment.deleted && !oldComment.deleted;
  const commentRejected = comment.rejected && !oldComment.rejected;
  if (commentDeleted) {
    await utils.moderateCommentsPostUpdate(comment, currentUser, 'deleted', context);
    // this is an else-if because we don't want to do both, even if we do both reject and delete a comment
  } else if (commentRejected) {
    await utils.moderateCommentsPostUpdate(comment, currentUser, 'rejected', context);
  }
}

export async function commentsPublishedNotifications(comment: DbComment, oldComment: DbComment, context: ResolverContext) {
  if (commentIsNotPublicForAnyReason(oldComment) && !commentIsNotPublicForAnyReason(comment)) {
    backgroundTask(utils.sendNewCommentNotifications(comment, context))
  }
}
