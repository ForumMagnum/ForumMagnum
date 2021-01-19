import * as _ from 'underscore';
import { Comments } from '../../lib/collections/comments/collection';
import { makeEditableOptions } from '../../lib/collections/comments/custom_fields';
import Conversations from '../../lib/collections/conversations/collection';
import Messages from '../../lib/collections/messages/collection';
import { Posts } from "../../lib/collections/posts/collection";
import { Tags } from "../../lib/collections/tags/collection";
import Users from "../../lib/collections/users/collection";
import { userIsAdmin, userCanDo } from '../../lib/vulcan-users/permissions';
import { userTimeSinceLast } from '../../lib/vulcan-users/helpers';
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { addEditableCallbacks } from '../editor/make_editable_callbacks';
import { performVoteServer } from '../voteServer';
import { updateMutator, createMutator, deleteMutator } from '../vulcan-lib';
import { recalculateAFCommentMetadata } from './alignment-forum/alignmentCommentCallbacks';
import { newDocumentMaybeTriggerReview } from './postCallbacks';
import { getCollectionHooks } from '../mutationCallbacks';


const MINIMUM_APPROVAL_KARMA = 5

const getLessWrongAccount = async () => {
  let account = Users.findOne({username: "AdminTeam"});
  if (!account) {
    const userData = {
      // TODO nicer solution
      username: "AdminTeam",
      email: "forum@effectivealtruism.org",
    }
    const newAccount = await createMutator({
      collection: Users,
      document: userData,
      validate: false,
    })
    return newAccount.data
  }
  return account;
}

getCollectionHooks("Comments").newValidate.add(async function createShortformPost (comment: DbComment, currentUser: DbUser) {
  if (comment.shortform && !comment.postId) {
    if (currentUser.shortformFeedId) {
      return ({
        ...comment,
        postId: currentUser.shortformFeedId
      });
    }
    
    const post = await createMutator({
      collection: Posts,
      document: {
        userId: currentUser._id,
        shortform: true,
        title: `${ currentUser.displayName }'s Shortform`,
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

getCollectionHooks("Comments").newSync.add(function CommentsNewOperations (comment: DbComment) {
  // update lastCommentedAt field on post or tag
  if (comment.postId) {
    Posts.update(comment.postId, {
      $set: {lastCommentedAt: new Date()},
    });
  } else if (comment.tagId) {
    Tags.update(comment.tagId, {
      $set: {lastCommentedAt: new Date()},
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
    const postComments = Comments.find({postId}, {sort: {postedAt: -1}}).fetch();
    const lastCommentedAt = postComments[0] && postComments[0].postedAt;
  
    // update post with a decremented comment count, and corresponding last commented at date
    Posts.update(postId, {
      $set: {lastCommentedAt},
    });
  }
});

getCollectionHooks("Comments").removeAsync.add(async function CommentsRemoveChildrenComments (comment: DbComment, currentUser: DbUser) {

  const childrenComments = Comments.find({parentCommentId: comment._id}).fetch();

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


const commentIntervalSetting = new DatabasePublicSetting<number>('commentInterval', 15) // How long users should wait in between comments (in seconds)
getCollectionHooks("Comments").newValidate.add(function CommentsNewRateLimit (comment: DbComment, user: DbUser) {
  if (!userIsAdmin(user)) {
    const timeSinceLastComment = userTimeSinceLast(user, Comments);
    const commentInterval = Math.abs(parseInt(""+commentIntervalSetting.get()));

    // check that user waits more than 15 seconds between comments
    if((timeSinceLastComment < commentInterval)) {
      throw new Error(`Please wait ${commentInterval-timeSinceLastComment} seconds before commenting again.`);
    }
  }
  return comment;
});


//////////////////////////////////////////////////////
// LessWrong callbacks                              //
//////////////////////////////////////////////////////

getCollectionHooks("Comments").editAsync.add(function CommentsEditSoftDeleteCallback (comment: DbComment, oldComment: DbComment, currentUser: DbUser) {
  if (comment.deleted && !oldComment.deleted) {
    moderateCommentsPostUpdate(comment, currentUser);
  }
});

export function moderateCommentsPostUpdate (comment: DbComment, currentUser: DbUser) {
  recalculateAFCommentMetadata(comment.postId)
  
  if (comment.postId) {
    const comments = Comments.find({postId:comment.postId, deleted: false}).fetch()
  
    const lastComment:DbComment = _.max(comments, (c) => c.postedAt)
    const lastCommentedAt = (lastComment && lastComment.postedAt) || Posts.findOne({_id:comment.postId})?.postedAt || new Date()
  
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
  
  void commentsDeleteSendPMAsync(comment, currentUser);
}

getCollectionHooks("Comments").newValidate.add(function NewCommentsEmptyCheck (comment: DbComment) {
  const { data } = (comment.contents && comment.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot submit an empty comment");
  }
  return comment;
});

export async function commentsDeleteSendPMAsync (comment: DbComment, currentUser: DbUser) {
  if (currentUser._id !== comment.userId && comment.deleted && comment.contents && comment.contents.html) {
    const onWhat = comment.tagId
      ? await Tags.findOne(comment.tagId)?.name
      : (comment.postId
        ? await Posts.findOne(comment.postId)?.title
        : null
      );
    const moderatingUser = await Users.findOne(comment.deletedByUserId);
    const lwAccount = await getLessWrongAccount();

    const conversationData = {
      participantIds: [comment.userId, lwAccount._id],
      title: `Comment deleted on ${onWhat}`
    }
    const conversation = await createMutator({
      collection: Conversations,
      document: conversationData,
      currentUser: lwAccount,
      validate: false
    });

    let firstMessageContents =
        `One of your comments on "${onWhat}" has been removed by ${(moderatingUser && moderatingUser.displayName) || "the Akismet spam integration"}. We've sent you another PM with the content. If this deletion seems wrong to you, please send us a message on Intercom, we will not see replies to this conversation.`
    if (comment.deletedReason) {
      firstMessageContents += ` They gave the following reason: "${comment.deletedReason}".`;
    }

    const firstMessageData = {
      userId: lwAccount._id,
      contents: {
        originalContents: {
          type: "html",
          data: firstMessageContents
        }
      },
      conversationId: conversation.data._id
    }

    const secondMessageData = {
      userId: lwAccount._id,
      contents: comment.contents,
      conversationId: conversation.data._id
    }

    await createMutator({
      collection: Messages,
      document: firstMessageData,
      currentUser: lwAccount,
      validate: false
    })

    await createMutator({
      collection: Messages,
      document: secondMessageData,
      currentUser: lwAccount,
      validate: false
    })

    // eslint-disable-next-line no-console
    console.log("Sent moderation messages for comment", comment)
  }
}

// Duplicate of PostsNewUserApprovedStatus
getCollectionHooks("Comments").newSync.add(function CommentsNewUserApprovedStatus (comment: DbComment) {
  const commentAuthor = Users.findOne(comment.userId);
  if (!commentAuthor?.reviewedByUserId && (commentAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...comment, authorIsUnreviewed: true}
  }
});

// Make users upvote their own new comments
getCollectionHooks("Comments").newAfter.add(async function LWCommentsNewUpvoteOwnComment(comment: DbComment) {
  var commentAuthor = Users.findOne(comment.userId);
  const votedComment = commentAuthor && await performVoteServer({ document: comment, voteType: 'smallUpvote', collection: Comments, user: commentAuthor })
  return {...comment, ...votedComment} as DbComment;
});

getCollectionHooks("Comments").newAsync.add(function NewCommentNeedsReview (comment: DbComment) {
  const user = Users.findOne({_id:comment.userId})
  const karma = user?.karma || 0
  if (karma < 100) {
    Comments.update({_id:comment._id}, {$set: {needsReview: true}});
  }
});

addEditableCallbacks({collection: Comments, options: makeEditableOptions})

getCollectionHooks("Comments").editSync.add(async function validateDeleteOperations (modifier, comment: DbComment, currentUser: DbUser) {
  if (modifier.$set) {
    const { deleted, deletedPublic, deletedReason } = modifier.$set
    if (deleted || deletedPublic || deletedReason) {
      if (deletedPublic && !deleted) {
        throw new Error("You cannot publicly delete a comment without also deleting it")
      }

      if (deletedPublic && !deletedReason) {
        throw new Error("Publicly deleted comments need to have a deletion reason");
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
      await Comments.update({topLevelCommentId: comment._id}, {$set:{parentAnswerId:comment._id}}, { multi: true })
    } else if (modifier.$set.answer === false) {
      await Comments.update({topLevelCommentId: comment._id}, {$unset:{parentAnswerId:true}}, { multi: true })
    }
  }
  return modifier
});

getCollectionHooks("Comments").createBefore.add(function HandleReplyToAnswer (comment: DbComment, properties)
{
  if (comment.parentCommentId) {
    let parentComment = Comments.findOne(comment.parentCommentId)
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
      }
      if (parentComment.topLevelCommentId) {
        modifiedComment.topLevelCommentId = parentComment.topLevelCommentId;
      }
      
      return modifiedComment;
    }
  }
});

getCollectionHooks("Comments").createBefore.add(function SetTopLevelCommentId (comment: DbComment, context)
{
  let visited: Partial<Record<string,boolean>> = {};
  let rootComment: DbComment|null = comment;
  while (rootComment?.parentCommentId) {
    // This relies on Meteor fibers (rather than being async/await) because
    // Vulcan callbacks aren't async-safe.
    rootComment = Comments.findOne({_id: rootComment.parentCommentId});
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
});

getCollectionHooks("Comments").createAfter.add(async function updateTopLevelCommentLastCommentedAt (comment: DbComment) {
  // TODO: Make this work for all parent comments. For now, this is just updating the lastSubthreadActivity of the top comment because that's where we're using it 
  if (comment.topLevelCommentId) {
    Comments.update({ _id: comment.topLevelCommentId }, { $set: {lastSubthreadActivity: new Date()}})
  }
  return comment;
});

getCollectionHooks("Comments").createAfter.add(newDocumentMaybeTriggerReview)

