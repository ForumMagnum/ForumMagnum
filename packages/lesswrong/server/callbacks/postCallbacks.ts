import { addCallback, runCallbacks, runCallbacksAsync, newMutation } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';
import Users from '../../lib/collections/users/collection';
import { performVoteServer } from '../voteServer';
import Localgroups from '../../lib/collections/localgroups/collection';
import { addEditableCallbacks } from '../editor/make_editable_callbacks'
import { makeEditableOptions, makeEditableOptionsModeration, makeEditableOptionsCustomHighlight } from '../../lib/collections/posts/custom_fields'
import { PostRelations } from '../../lib/collections/postRelations/index';
import { getDefaultPostLocationFields } from '../posts/utils'
const MINIMUM_APPROVAL_KARMA = 5

function PostsEditRunPostUndraftedSyncCallbacks (data, { oldDocument: post }) {
  if (data.draft === false && post.draft) {
    data = runCallbacks("post.undraft.before", data, post);
  }
  return data;
}
addCallback("post.update.before", PostsEditRunPostUndraftedSyncCallbacks);

function PostsEditRunPostUndraftedAsyncCallbacks (newPost, oldPost) {
  if (!newPost.draft && oldPost.draft) {
    runCallbacksAsync("posts.undraft.async", newPost, oldPost)
  }
  return newPost
}
addCallback("posts.edit.async", PostsEditRunPostUndraftedAsyncCallbacks);

function PostsEditRunPostDraftedAsyncCallbacks (newPost, oldPost) {
  if (newPost.draft && !oldPost.draft) {
    runCallbacksAsync("posts.draft.async", newPost, oldPost)
  }
  return newPost
}
addCallback("posts.edit.async", PostsEditRunPostDraftedAsyncCallbacks);

/**
 * @summary set postedAt when a post is moved out of drafts
 */
function PostsSetPostedAt (data, oldPost) {
  data.postedAt = new Date();
  return data;
}
addCallback("post.undraft.before", PostsSetPostedAt);

function increaseMaxBaseScore ({newDocument, vote}, collection, user, context) {
  if (vote.collectionName === "Posts" && newDocument.baseScore > (newDocument.maxBaseScore || 0)) {
    let thresholdTimestamp: any = {};
    if (!newDocument.scoreExceeded2Date && newDocument.baseScore >= 2) {
      thresholdTimestamp.scoreExceeded2Date = new Date();
    }
    if (!newDocument.scoreExceeded30Date && newDocument.baseScore >= 30) {
      thresholdTimestamp.scoreExceeded30Date = new Date();
    }
    if (!newDocument.scoreExceeded45Date && newDocument.baseScore >= 45) {
      thresholdTimestamp.scoreExceeded45Date = new Date();
    }
    if (!newDocument.scoreExceeded75Date && newDocument.baseScore >= 75) {
      thresholdTimestamp.scoreExceeded75Date = new Date();
    }
    Posts.update({_id: newDocument._id}, {$set: {maxBaseScore: newDocument.baseScore, ...thresholdTimestamp}})
  }
}

addCallback("votes.smallUpvote.async", increaseMaxBaseScore);
addCallback("votes.bigUpvote.async", increaseMaxBaseScore);

function PostsNewDefaultLocation (post) {
  return {...post, ...getDefaultPostLocationFields(post)}
}

addCallback("posts.new.sync", PostsNewDefaultLocation);

function PostsNewDefaultTypes (post) {
  if (post.isEvent && post.groupId && !post.types) {
    const localgroup = Localgroups.findOne(post.groupId) 
    if (!localgroup) throw Error(`Wasn't able to find localgroup for post ${post}`)
    const { types } = localgroup
    post = {...post, types}
  }
  return post
}

addCallback("posts.new.sync", PostsNewDefaultTypes);

// LESSWRONG – bigUpvote
async function LWPostsNewUpvoteOwnPost(post) {
 var postAuthor = Users.findOne(post.userId);
 const votedPost = postAuthor && await performVoteServer({ document: post, voteType: 'bigUpvote', collection: Posts, user: postAuthor })
 return {...post, ...votedPost};
}

addCallback('posts.new.after', LWPostsNewUpvoteOwnPost);

function PostsNewUserApprovedStatus (post) {
  const postAuthor = Users.findOne(post.userId);
  if (!postAuthor?.reviewedByUserId && (postAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...post, authorIsUnreviewed: true}
  }
}

addCallback("posts.new.sync", PostsNewUserApprovedStatus);

function AddReferrerToPost(post, properties)
{
  if (properties && properties.context && properties.context.headers) {
    let referrer = properties.context.headers["referer"];
    let userAgent = properties.context.headers["user-agent"];
    
    return {
      ...post,
      referrer: referrer,
      userAgent: userAgent,
    };
  }
}
addCallback("post.create.before", AddReferrerToPost);

addEditableCallbacks({collection: Posts, options: makeEditableOptions})
addEditableCallbacks({collection: Posts, options: makeEditableOptionsModeration})
addEditableCallbacks({collection: Posts, options: makeEditableOptionsCustomHighlight})

function PostsNewPostRelation (post) {
  if (post.originalPostRelationSourceId) {
    void newMutation({
      collection: PostRelations,
      document: {
        type: "subQuestion",
        sourcePostId: post.originalPostRelationSourceId,
        targetPostId: post._id,
      },
      validate: false,
    })
  }
  return post
}
addCallback("posts.new.after", PostsNewPostRelation);

function UpdatePostShortform (newPost, oldPost) {
  if (!!newPost.shortform !== !!oldPost.shortform) {
    const shortform = !!newPost.shortform;
    Comments.update(
      { postId: newPost._id },
      { $set: {
        shortform: shortform
      } },
      { multi: true }
    );
  }
  return newPost;
}
addCallback("posts.edit.async", UpdatePostShortform );

// If an admin changes the "hideCommentKarma" setting of a post after it
// already has comments, update those comments' hideKarma field to have the new
// setting. This should almost never be used, as we really don't want to
// surprise users by revealing their supposedly hidden karma.
async function UpdateCommentHideKarma (newPost, oldPost) {
  if (newPost.hideCommentKarma === oldPost.hideCommentKarma) return

  const comments = Comments.find({postId: newPost._id})
  if (!comments.count()) return
  const updates = comments.fetch().map(comment => ({
    updateOne: {
      filter: {
        _id: comment._id,
      },
      update: {$set: {hideKarma: newPost.hideCommentKarma}}
    }
  }))
  await Comments.rawCollection().bulkWrite(updates)
}
addCallback("posts.edit.async", UpdateCommentHideKarma);

export async function newDocumentMaybeTriggerReview (document) {
  const author = await Users.findOne(document.userId);
  if (author && (!author.reviewedByUserId || author.sunshineSnoozed)) {
    Users.update({_id:author._id}, {$set:{needsReview: true}})
  }
  return document
}
addCallback("posts.new.after", newDocumentMaybeTriggerReview);

async function updatedPostMaybeTriggerReview (newPost, oldPost) {
  if (!newPost.draft && oldPost.draft) {
    await newDocumentMaybeTriggerReview(newPost)
  }
}
addCallback("posts.edit.async", updatedPostMaybeTriggerReview);
