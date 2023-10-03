import * as _ from 'underscore';
import { Comments } from '../../lib/collections/comments/collection';
import Conversations from '../../lib/collections/conversations/collection';
import Messages from '../../lib/collections/messages/collection';
import { Posts } from "../../lib/collections/posts/collection";
import { Tags } from "../../lib/collections/tags/collection";
import Users from "../../lib/collections/users/collection";
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { performVoteServer } from '../voteServer';
import { updateMutator, createMutator, deleteMutator } from '../vulcan-lib';
import { getCommentAncestorIds } from '../utils/commentTreeUtils';
import { recalculateAFCommentMetadata } from './alignment-forum/alignmentCommentCallbacks';
import { getCollectionHooks, CreateCallbackProperties, UpdateCallbackProperties } from '../mutationCallbacks';
import { forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import { ensureIndex } from '../../lib/collectionIndexUtils';
import { triggerReviewIfNeeded } from "./sunshineCallbackUtils";
import ReadStatuses from '../../lib/collections/readStatus/collection';
import { isAnyTest } from '../../lib/executionEnvironment';
import { REJECTED_COMMENT } from '../../lib/collections/moderatorActions/schema';
import { captureEvent } from '../../lib/analyticsEvents';


const MINIMUM_APPROVAL_KARMA = 5

// This should get refactored someday to be more forum-neutral
const adminTeamUserData = forumTypeSetting.get() === 'EAForum' ?
  {
    username: "AdminTeam",
    email: "forum@effectivealtruism.org"
  } :
  {
    username: forumTypeSetting.get(),
    email: "team@lesswrong.com"
  }

export const getAdminTeamAccount = async () => {
  let account = await Users.findOne({username: adminTeamUserData.username});
  if (!account) {
    const newAccount = await createMutator({
      collection: Users,
      document: adminTeamUserData,
      validate: false,
    })
    return newAccount.data
  }
  return account;
}

/**
 * Don't send a PM to users if their comments are deleted with this reason.  Used for account deletion requests.
 */
export const noDeletionPmReason = 'Requested account deletion';

getCollectionHooks("Comments").newValidate.add(async function createShortformPost (comment: DbComment, currentUser: DbUser) {
  if (comment.shortform && !comment.postId) {
    if (currentUser.shortformFeedId) {
      return ({
        ...comment,
        postId: currentUser.shortformFeedId
      });
    }

    const shortformName = isEAForum ? "Quick takes" : "Shortform";
    const post = await createMutator({
      collection: Posts,
      document: {
        userId: currentUser._id,
        shortform: true,
        title: `${currentUser.displayName}'s ${shortformName}`,
        af: currentUser.groups?.includes('alignmentForum'),
      },
      currentUser,
      validate: false,
    })
    await updateMutator({
      collection: Users,
      documentId: currentUser._id,
      set: {
        shortformFeedId: post.data._id
      },
      unset: {},
      validate: false,
    })

    return ({
      ...comment,
      postId: post.data._id
    })
  }
  return comment
});

getCollectionHooks("Comments").newSync.add(async function CommentsNewOperations (comment: DbComment) {
  // update lastCommentedAt field on post or tag
  if (comment.postId) {
    const lastCommentedAt = new Date()

    if (!comment.debateResponse) {
      await Posts.rawUpdateOne(comment.postId, {
        $set: {lastCommentedAt},
      })
    }

    // we're updating the comment author's lastVisitedAt time for the post as well,
    // so that their comment doesn't cause the post to look like it has unread comments
    await ReadStatuses.rawUpdateOne({
      postId: comment.postId,
      userId: comment.userId,
      tagId: null,
    }, {
      $set: {
        lastUpdated: lastCommentedAt
      }
    })
  } else if (comment.tagId) {
    const fieldToSet = comment.tagCommentType === "SUBFORUM" ? "lastSubforumCommentAt" : "lastCommentedAt"
    await Tags.rawUpdateOne(comment.tagId, {
      $set: {[fieldToSet]: new Date()},
    });
  }

  return comment;
});

//////////////////////////////////////////////////////
// comments.remove.async                            //
//////////////////////////////////////////////////////

getCollectionHooks("Comments").removeAsync.add(async function CommentsRemovePostCommenters (comment: DbComment, currentUser: DbUser) {
  const { postId } = comment;

  if (postId) {
    const postComments = await Comments.find({postId, debateResponse: false, deleted: false}, {sort: {postedAt: -1}}).fetch();
    const lastCommentedAt = postComments[0] && postComments[0].postedAt;
  
    // update post with a decremented comment count, and corresponding last commented at date
    await Posts.rawUpdateOne(postId, {
      $set: {lastCommentedAt},
    });
  }
});

getCollectionHooks("Comments").removeAsync.add(async function CommentsRemoveChildrenComments (comment: DbComment, currentUser: DbUser) {

  const childrenComments = await Comments.find({parentCommentId: comment._id}).fetch();

  childrenComments.forEach(childComment => {
    void deleteMutator({
      collection: Comments,
      documentId: childComment._id,
      currentUser: currentUser,
      validate: false
    });
  });
});

//////////////////////////////////////////////////////
// other                                            //
//////////////////////////////////////////////////////

getCollectionHooks("Comments").createBefore.add(function AddReferrerToComment(comment, properties)
{
  if (properties && properties.context && properties.context.headers) {
    let referrer = properties.context.headers["referer"];
    let userAgent = properties.context.headers["user-agent"];
    
    return {
      ...comment,
      referrer: referrer,
      userAgent: userAgent,
    };
  }
});

// TODO: move this to views?
ensureIndex(Comments, { userId: 1, createdAt: 1 });

//////////////////////////////////////////////////////
// LessWrong callbacks                              //
//////////////////////////////////////////////////////

getCollectionHooks("Comments").editAsync.add(async function CommentsEditSoftDeleteCallback (comment: DbComment, oldComment: DbComment, currentUser: DbUser) {
  const commentDeleted = comment.deleted && !oldComment.deleted;
  const commentRejected = comment.rejected && !oldComment.rejected;
  if (commentDeleted) {
    await moderateCommentsPostUpdate(comment, currentUser, 'deleted');
    // this is an else-if because we don't want to do both, even if we do both reject and delete a comment
  } else if (commentRejected) {
    await moderateCommentsPostUpdate(comment, currentUser, 'rejected');
  }
});

export async function moderateCommentsPostUpdate (comment: DbComment, currentUser: DbUser, action: 'deleted' | 'rejected') {
  await recalculateAFCommentMetadata(comment.postId)
  
  if (comment.postId) {
    const comments = await Comments.find({postId:comment.postId, deleted: false, debateResponse: false}).fetch()
  
    const lastComment:DbComment = _.max(comments, (c) => c.postedAt)
    const lastCommentedAt = (lastComment && lastComment.postedAt) || (await Posts.findOne({_id:comment.postId}))?.postedAt || new Date()
  
    void updateMutator({
      collection:Posts,
      documentId: comment.postId,
      set: {
        lastCommentedAt:new Date(lastCommentedAt),
      },
      unset: {},
      validate: false,
    })
  }
  if (action === 'deleted') {
    void commentsDeleteSendPMAsync(comment, currentUser);
  } else {
    void commentsRejectSendPMAsync(comment, currentUser);
  }
}

getCollectionHooks("Comments").newValidate.add(function NewCommentsEmptyCheck (comment: DbComment) {
  const { data } = (comment.contents && comment.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot submit an empty comment");
  }
  return comment;
});

interface SendModerationPMParams {
  action: 'deleted' | 'rejected',
  messageContents: string,
  lwAccount: DbUser,
  comment: DbComment,
  noEmail: boolean,
  contentTitle?: string | null
}

// TODO: I don't think this function makes sense anymore, I think should be refactored in some way.
async function sendModerationPM({ messageContents, lwAccount, comment, noEmail, contentTitle, action }: SendModerationPMParams) {
  const conversationData: CreateMutatorParams<DbConversation>['document'] = {
    participantIds: [comment.userId, lwAccount._id],
    title: `Comment ${action} on ${contentTitle}`,
    ...(action === 'rejected' ? { moderator: true } : {})
  };

  const conversation = await createMutator({
    collection: Conversations,
    document: conversationData,
    currentUser: lwAccount,
    validate: false
  });

  const messageData = {
    userId: lwAccount._id,
    contents: {
      originalContents: {
        type: "html",
        data: messageContents
      }
    },
    conversationId: conversation.data._id,
    noEmail: noEmail
  };

  await createMutator({
    collection: Messages,
    document: messageData,
    currentUser: lwAccount,
    validate: false
  });

  if (!isAnyTest) {
    // eslint-disable-next-line no-console
    console.log("Sent moderation messages for comment", comment._id);
  }
}

export function getRejectionMessage (rejectedContentLink: string, rejectedReason: string|null) {
  let messageContents = `
  <p>Unfortunately, I rejected your ${rejectedContentLink}.</p>
  <p>LessWrong aims for particularly high quality (and somewhat oddly-specific) discussion quality. We get a lot of content from new users and sadly can't give detailed feedback on every piece we reject, but I generally recommend checking out our <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong">New User's Guide</a>, in particular the section on <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong#How_to_ensure_your_first_post_or_comment_is_well_received">how to ensure your content is approved</a>.</p>`
  if (rejectedReason) {
    messageContents += `<p>Your content didn't meet the bar for at least the following reason(s):</p>
    <p>${rejectedReason}</p>`;
  }
  return messageContents;
}

async function commentsRejectSendPMAsync (comment: DbComment, currentUser: DbUser) {
  let rejectedContentLink = "[Error: content not found]"
  let contentTitle: string|null = null

  if (comment.tagId) {
    const tag = await Tags.findOne(comment.tagId)
    if (tag) {
      contentTitle = tag.name
      rejectedContentLink = `<a href="https://lesswrong.com/tag/${tag.slug}/discussion?commentId=${comment._id}">comment on ${tag.name}</a>`
    }
  } else if (comment.postId) {
    const post = await Posts.findOne(comment.postId)
    if (post) {
      contentTitle = post.title
      rejectedContentLink = `<a href="https://lesswrong.com/posts/${post._id}/${post.slug}?commentId=${comment._id}">comment on ${post.title}</a>`
    }
  }

  const commentUser = await Users.findOne({_id: comment.userId})

  let messageContents = getRejectionMessage(rejectedContentLink, comment.rejectedReason)
  
  // EAForum always sends an email when deleting comments. Other ForumMagnum sites send emails if the user has been approved, but not otherwise (so that admins can reject comments by mediocre users without sending them an email notification that might draw their attention back to the site.)
  const noEmail = forumTypeSetting.get() === "EAForum" 
  ? false 
  : !(!!commentUser?.reviewedByUserId && !commentUser.snoozedUntilContentCount)

  await sendModerationPM({
    action: 'rejected',
    comment,
    messageContents,
    lwAccount: currentUser,
    noEmail,
    contentTitle
  });
}

export async function commentsDeleteSendPMAsync (comment: DbComment, currentUser: DbUser | undefined) {
  const commentDeletedByAnotherUser =
    (!comment.deletedByUserId || comment.deletedByUserId !== comment.userId)
    && comment.deleted
    && comment.contents?.html;

  const noPmDeletionReason = comment.deletedReason === noDeletionPmReason;
  if (commentDeletedByAnotherUser && !noPmDeletionReason) {
    const contentTitle = comment.tagId
      ? (await Tags.findOne(comment.tagId))?.name
      : (comment.postId
        ? (await Posts.findOne(comment.postId))?.title
        : null
      );
    const moderatingUser = comment.deletedByUserId ? await Users.findOne(comment.deletedByUserId) : null;
    const lwAccount = await getAdminTeamAccount();
    const commentUser = await Users.findOne({_id: comment.userId})

    let messageContents =
        `<div>
          <p>One of your comments on "${contentTitle}" has been removed by ${(moderatingUser?.displayName) || "the Akismet spam integration"}. We've sent you another PM with the content. If this deletion seems wrong to you, please send us a message on Intercom (the icon in the bottom-right of the page); we will not see replies to this conversation.</p>
          <p>The contents of your message are here:</p>
          <blockquote>
            ${comment.contents.html}
          </blockquote>
        </div>`
    if (comment.deletedReason && moderatingUser) {
      messageContents += ` They gave the following reason: "${comment.deletedReason}".`;
    }

    // EAForum always sends an email when deleting comments. Other ForumMagnum sites send emails if the user has been approved, but not otherwise (so that admins can delete comments by mediocre users without sending them an email notification that might draw their attention back to the site.)
    const noEmail = forumTypeSetting.get() === "EAForum" 
    ? false 
    : !(!!commentUser?.reviewedByUserId && !commentUser.snoozedUntilContentCount)

    await sendModerationPM({
      action: 'deleted',
      comment,
      messageContents,
      lwAccount,
      noEmail,
      contentTitle
    });
  
  }
}

// Duplicate of PostsNewUserApprovedStatus
getCollectionHooks("Comments").newSync.add(async function CommentsNewUserApprovedStatus (comment: DbComment) {
  const commentAuthor = await Users.findOne(comment.userId);
  if (!commentAuthor?.reviewedByUserId && (commentAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...comment, authorIsUnreviewed: true}
  }
  return comment;
});

// Make users upvote their own new comments
getCollectionHooks("Comments").newAfter.add(async function LWCommentsNewUpvoteOwnComment(comment: DbComment) {
  const start = Date.now();
  var commentAuthor = await Users.findOne(comment.userId);
  if (!commentAuthor) throw new Error(`Could not find user: ${comment.userId}`);
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
});

getCollectionHooks("Comments").editSync.add(async function validateDeleteOperations (modifier, comment: DbComment, currentUser: DbUser) {
  if (modifier.$set) {
    const { deleted, deletedPublic, deletedReason } = modifier.$set
    if (deleted || deletedPublic || deletedReason) {
      if (deletedPublic && !deleted) {
        throw new Error("You cannot publicly delete a comment without also deleting it")
      }

      if (
        (comment.deleted || comment.deletedPublic) &&
        (deletedPublic || deletedReason) &&
        !userCanDo(currentUser, 'comments.remove.all') &&
        comment.deletedByUserId !== currentUser._id) {
          throw new Error("You cannot edit the deleted status of a comment that's been deleted by someone else")
      }

      if (deletedReason && !deleted && !deletedPublic) {
        throw new Error("You cannot set a deleted reason without deleting a comment")
      }

      const childrenComments = await Comments.find({parentCommentId: comment._id}).fetch()
      const filteredChildrenComments = _.filter(childrenComments, (c) => !(c && c.deleted))
      if (
        filteredChildrenComments &&
        (filteredChildrenComments.length > 0) &&
        (deletedPublic || deleted) &&
        !userCanDo(currentUser, 'comment.remove.all')
      ) {
        throw new Error("You cannot delete a comment that has children")
      }
    }
  }
  return modifier
});

getCollectionHooks("Comments").editSync.add(async function moveToAnswers (modifier, comment: DbComment) {
  if (modifier.$set) {
    if (modifier.$set.answer === true) {
      await Comments.rawUpdateMany({topLevelCommentId: comment._id}, {$set:{parentAnswerId:comment._id}}, { multi: true })
    } else if (modifier.$set.answer === false) {
      await Comments.rawUpdateMany({topLevelCommentId: comment._id}, {$unset:{parentAnswerId:true}}, { multi: true })
    }
  }
  return modifier
});

getCollectionHooks("Comments").createBefore.add(async function HandleReplyToAnswer (comment: DbComment, properties)
{
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
});

getCollectionHooks("Comments").createBefore.add(async function SetTopLevelCommentId (comment: DbComment, context)
{
  let visited: Partial<Record<string,boolean>> = {};
  let rootComment: DbComment|null = comment;
  while (rootComment?.parentCommentId) {
    // This relies on Meteor fibers (rather than being async/await) because
    // Vulcan callbacks aren't async-safe.
    rootComment = await Comments.findOne({_id: rootComment.parentCommentId});
    if (rootComment && visited[rootComment._id])
      throw new Error("Cyclic parent-comment relations detected!");
    if (rootComment)
      visited[rootComment._id] = true;
  }
  
  if (rootComment && rootComment._id !== comment._id) {
    return {
      ...comment,
      topLevelCommentId: rootComment._id
    };
  }
  return comment;
});

getCollectionHooks("Comments").createAfter.add(async function UpdateDescendentCommentCounts (comment: DbComment) {
  const ancestorIds: string[] = await getCommentAncestorIds(comment);
  
  await Comments.rawUpdateMany({ _id: {$in: ancestorIds} }, {
    $set: {lastSubthreadActivity: new Date()},
    $inc: {descendentCount:1},
  });
  
  return comment;
});

getCollectionHooks("Comments").updateAfter.add(async function UpdateDescendentCommentCounts (comment, context) {
  let changedField: 'deleted' | 'rejected' | undefined;
  if (context.oldDocument.deleted !== context.newDocument.deleted) {
    changedField = 'deleted';
  } else if (context.oldDocument.rejected !== context.newDocument.rejected) {
    changedField = 'rejected';
  }
  if (changedField) {
    const ancestorIds: string[] = await getCommentAncestorIds(comment);
    const increment = context.oldDocument[changedField] ? 1 : -1;
    await Comments.rawUpdateMany({_id: {$in: ancestorIds}}, {$inc: {descendentCount: increment}})
  }
  return comment;
});

// This function and the latter function seem redundant. TODO decide whether/where the karma < 100 clause should live
// getCollectionHooks("Comments").createAsync.add(async function NewCommentNeedsReview ({document}: CreateCallbackProperties<DbComment>) {
//   const user = await Users.findOne({_id:document.userId})
//   const karma = user?.karma || 0
//   if (karma < 100) {
//     await triggerReviewIfNeeded(document.userId);
//   }
// });

getCollectionHooks("Comments").createAsync.add(async ({document}: CreateCallbackProperties<DbComment>) => {
  await triggerReviewIfNeeded(document.userId);
})

getCollectionHooks("Comments").updateAsync.add(async function updatedCommentMaybeTriggerReview ({currentUser}: UpdateCallbackProperties<DbComment>) {
  if (!currentUser) return;
  currentUser.snoozedUntilContentCount && await updateMutator({
    collection: Users,
    documentId: currentUser._id,
    set: {
      snoozedUntilContentCount: currentUser.snoozedUntilContentCount - 1,
    },
    validate: false,
  })
  await triggerReviewIfNeeded(currentUser._id)
});

getCollectionHooks("Comments").updateAsync.add(async function updateUserNotesOnCommentRejection ({ document, oldDocument, currentUser, context }: UpdateCallbackProperties<DbComment>) {
  if (!oldDocument.rejected && document.rejected) {
    void createMutator({
      collection: context.ModeratorActions,
      context,
      currentUser,
      document: {
        userId: document.userId,
        type: REJECTED_COMMENT,
        endedAt: new Date()
      }
    });
  }
});
