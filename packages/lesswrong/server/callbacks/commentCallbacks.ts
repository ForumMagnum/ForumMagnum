import * as _ from 'underscore';
import { Comments } from '../../lib/collections/comments/collection';
import { makeEditableOptions } from '../../lib/collections/comments/custom_fields';
import Conversations from '../../lib/collections/conversations/collection';
import Messages from '../../lib/collections/messages/collection';
import { Posts } from "../../lib/collections/posts";
import Users from "../../lib/collections/users/collection";
import { DatabasePublicSetting } from "../../lib/publicSettings";
import { addEditableCallbacks } from '../editor/make_editable_callbacks';
import { performVoteServer } from '../voteServer';
import { addCallback, editMutation, newMutation, removeMutation, runCallbacksAsync } from '../vulcan-lib';
import { newDocumentMaybeTriggerReview } from './postCallbacks';


const MINIMUM_APPROVAL_KARMA = 5

const getLessWrongAccount = async () => {
  let account = Users.findOne({username: "LessWrong"});
  if (!account) {
    const userData = {
      username: "LessWrong",
      email: "lesswrong@lesswrong.com",
    }
    const newAccount = await newMutation({
      collection: Users,
      document: userData,
      validate: false,
    })
    return newAccount.data
  }
  return account;
}

async function createShortformPost (comment: DbComment, currentUser: DbUser) {
  if (comment.shortform && !comment.postId) {
    if (currentUser.shortformFeedId) {
      return ({
        ...comment,
        postId: currentUser.shortformFeedId
      });
    }
    
    const post = await newMutation({
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
    await editMutation({
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
}
addCallback('comments.new.validate', createShortformPost);

function CommentsNewOperations (comment: DbComment) {

  // update post
  Posts.update(comment.postId, {
    $set:       {lastCommentedAt: new Date()},
  });

  return comment;
}
addCallback('comments.new.sync', CommentsNewOperations);

//////////////////////////////////////////////////////
// comments.new.async                               //
//////////////////////////////////////////////////////


/**
 * @summary Run the 'upvote.async' callbacks *once* the item exists in the database
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 */
function UpvoteAsyncCallbacksAfterDocumentInsert(item, user: DbUser, collection) {
  runCallbacksAsync('upvote.async', item, user, collection, 'upvote');
}
addCallback('comments.new.async', UpvoteAsyncCallbacksAfterDocumentInsert);

//////////////////////////////////////////////////////
// comments.remove.async                            //
//////////////////////////////////////////////////////

function CommentsRemovePostCommenters (comment: DbComment, currentUser: DbUser) {
  const { postId } = comment;

  const postComments = Comments.find({postId}, {sort: {postedAt: -1}}).fetch();

  const lastCommentedAt = postComments[0] && postComments[0].postedAt;

  // update post with a decremented comment count, and corresponding last commented at date
  Posts.update(postId, {
    $set: {lastCommentedAt},
  });

  return comment;
}
addCallback('comments.remove.async', CommentsRemovePostCommenters);

function CommentsRemoveChildrenComments (comment: DbComment, currentUser: DbUser) {

  const childrenComments = Comments.find({parentCommentId: comment._id}).fetch();

  childrenComments.forEach(childComment => {
    void removeMutation({
      collection: Comments,
      documentId: childComment._id,
      currentUser: currentUser,
      validate: false
    });
  });

  return comment;
}
addCallback('comments.remove.async', CommentsRemoveChildrenComments);

//////////////////////////////////////////////////////
// other                                            //
//////////////////////////////////////////////////////

function AddReferrerToComment(comment: DbComment, properties)
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
}
addCallback("comment.create.before", AddReferrerToComment);


function UsersRemoveDeleteComments (user: DbUser, options) {
  if (options.deleteComments) {
    Comments.remove({userId: user._id});
  } else {
    // not sure if anything should be done in that scenario yet
    // Comments.update({userId: userId}, {$set: {author: '\[deleted\]'}}, {multi: true});
  }
}
addCallback('users.remove.async', UsersRemoveDeleteComments);


const commentIntervalSetting = new DatabasePublicSetting<number>('commentInterval', 15) // How long users should wait in between comments (in seconds)
function CommentsNewRateLimit (comment: DbComment, user: DbUser) {
  if (!Users.isAdmin(user)) {
    const timeSinceLastComment = Users.timeSinceLast(user, Comments);
    const commentInterval = Math.abs(parseInt(""+commentIntervalSetting.get()));

    // check that user waits more than 15 seconds between comments
    if((timeSinceLastComment < commentInterval)) {
      throw new Error(`Please wait ${commentInterval-timeSinceLastComment} seconds before commenting again.`);
    }
  }
  return comment;
}
addCallback('comments.new.validate', CommentsNewRateLimit);


//////////////////////////////////////////////////////
// LessWrong callbacks                              //
//////////////////////////////////////////////////////

function CommentsEditSoftDeleteCallback (comment: DbComment, oldComment: DbComment, currentUser: DbUser) {
  if (comment.deleted && !oldComment.deleted) {
    runCallbacksAsync('comments.moderate.async', comment, oldComment, {currentUser});
  }
}
addCallback("comments.edit.async", CommentsEditSoftDeleteCallback);

function ModerateCommentsPostUpdate (comment: DbComment, oldComment: DbComment) {
  const comments = Comments.find({postId:comment.postId, deleted: false}).fetch()

  const lastComment:DbComment = _.max(comments, (c) => c.postedAt)
  const lastCommentedAt = (lastComment && lastComment.postedAt) || Posts.findOne({_id:comment.postId})?.postedAt || new Date()

  void editMutation({
    collection:Posts,
    documentId: comment.postId,
    set: {
      lastCommentedAt:new Date(lastCommentedAt),
    },
    unset: {},
    validate: false,
  })
}
addCallback("comments.moderate.async", ModerateCommentsPostUpdate);

function NewCommentsEmptyCheck (comment: DbComment) {
  const { data } = (comment.contents && comment.contents.originalContents) || {}
  if (!data) {
    throw new Error("You cannot submit an empty comment");
  }
  return comment;
}
addCallback("comments.new.validate", NewCommentsEmptyCheck);

export async function CommentsDeleteSendPMAsync (newComment: DbComment, oldComment: DbComment, {currentUser}: {currentUser: DbUser}) {
  if (currentUser._id !== newComment.userId && newComment.deleted && newComment.contents && newComment.contents.html) {
    const originalPost = await Posts.findOne(newComment.postId);
    const moderatingUser = await Users.findOne(newComment.deletedByUserId);
    const lwAccount = await getLessWrongAccount();

    const conversationData = {
      participantIds: [newComment.userId, lwAccount._id],
      title: `Comment deleted on ${originalPost?.title}`
    }
    const conversation = await newMutation({
      collection: Conversations,
      document: conversationData,
      currentUser: lwAccount,
      validate: false
    });

    let firstMessageContents =
        `One of your comments on "${originalPost?.title}" has been removed by ${(moderatingUser && moderatingUser.displayName) || "the Akismet spam integration"}. We've sent you another PM with the content. If this deletion seems wrong to you, please send us a message on Intercom, we will not see replies to this conversation.`
    if (newComment.deletedReason) {
      firstMessageContents += ` They gave the following reason: "${newComment.deletedReason}".`;
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
      contents: newComment.contents,
      conversationId: conversation.data._id
    }

    await newMutation({
      collection: Messages,
      document: firstMessageData,
      currentUser: lwAccount,
      validate: false
    })

    await newMutation({
      collection: Messages,
      document: secondMessageData,
      currentUser: lwAccount,
      validate: false
    })

    // eslint-disable-next-line no-console
    console.log("Sent moderation messages for comment", newComment)
  }
}
addCallback("comments.moderate.async", CommentsDeleteSendPMAsync);

// Duplicate of PostsNewUserApprovedStatus
function CommentsNewUserApprovedStatus (comment: DbComment) {
  const commentAuthor = Users.findOne(comment.userId);
  if (!commentAuthor?.reviewedByUserId && (commentAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...comment, authorIsUnreviewed: true}
  }
}
addCallback("comments.new.sync", CommentsNewUserApprovedStatus);

/**
 * @summary Make users upvote their own new comments
 */
 // LESSWRONG – bigUpvote
async function LWCommentsNewUpvoteOwnComment(comment: DbComment) {
  var commentAuthor = Users.findOne(comment.userId);
  const votedComment = commentAuthor && await performVoteServer({ document: comment, voteType: 'smallUpvote', collection: Comments, user: commentAuthor })
  return {...comment, ...votedComment};
}
addCallback('comments.new.after', LWCommentsNewUpvoteOwnComment);

function NewCommentNeedsReview (comment: DbComment) {
  const user = Users.findOne({_id:comment.userId})
  const karma = user?.karma || 0
  if (karma < 100) {
    Comments.update({_id:comment._id}, {$set: {needsReview: true}});
  }
}
addCallback("comments.new.async", NewCommentNeedsReview);

addEditableCallbacks({collection: Comments, options: makeEditableOptions})

async function validateDeleteOperations (modifier: SimpleModifier<DbComment>, comment: DbComment, currentUser: DbUser) {
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
        !Users.canDo(currentUser, 'comments.remove.all') &&
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
        !Users.canDo(currentUser, 'comment.remove.all')
      ) {
        throw new Error("You cannot delete a comment that has children")
      }
    }
  }
  return modifier
}
addCallback("comments.edit.sync", validateDeleteOperations)

async function moveToAnswers (modifier: SimpleModifier<DbComment>, comment: DbComment) {
  if (modifier.$set) {
    if (modifier.$set.answer === true) {
      await Comments.update({topLevelCommentId: comment._id}, {$set:{parentAnswerId:comment._id}}, { multi: true })
    } else if (modifier.$set.answer === false) {
      await Comments.update({topLevelCommentId: comment._id}, {$unset:{parentAnswerId:true}}, { multi: true })
    }
  }
  return modifier
}
addCallback("comments.edit.sync", moveToAnswers)

function HandleReplyToAnswer (comment: DbComment, properties)
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
      if (parentComment.topLevelCommentId) {
        modifiedComment.topLevelCommentId = parentComment.topLevelCommentId;
      }
      
      return modifiedComment;
    }
  }
}
addCallback('comment.create.before', HandleReplyToAnswer);

function SetTopLevelCommentId (comment: DbComment, context)
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
}
addCallback('comment.create.before', SetTopLevelCommentId);

async function updateTopLevelCommentLastCommentedAt (comment: DbComment) {
  // TODO: Make this work for all parent comments. For now, this is just updating the lastSubthreadActivity of the top comment because that's where we're using it 
  if (comment.topLevelCommentId) {
    Comments.update({ _id: comment.topLevelCommentId }, { $set: {lastSubthreadActivity: new Date()}})
  }
  return comment;
}
addCallback("comment.create.after", updateTopLevelCommentLastCommentedAt)

addCallback("comment.create.after", newDocumentMaybeTriggerReview)
