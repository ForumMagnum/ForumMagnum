import { createMutator } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';
import Users from '../../lib/collections/users/collection';
import { performVoteServer } from '../voteServer';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import Localgroups from '../../lib/collections/localgroups/collection';
import { addEditableCallbacks } from '../editor/make_editable_callbacks'
import { makeEditableOptions, makeEditableOptionsModeration, makeEditableOptionsCustomHighlight } from '../../lib/collections/posts/custom_fields'
import { PostRelations } from '../../lib/collections/postRelations/index';
import { getDefaultPostLocationFields } from '../posts/utils'
import cheerio from 'cheerio'
import { getCollectionHooks } from '../mutationCallbacks';
import { postsUndraftNotification } from '../notificationCallbacks';

const MINIMUM_APPROVAL_KARMA = 5

getCollectionHooks("Posts").updateBefore.add(function PostsEditRunPostUndraftedSyncCallbacks (data, { oldDocument: post }) {
  if (data.draft === false && post.draft) {
    data = postsSetPostedAt(data);
  }
  return data;
});

getCollectionHooks("Posts").editAsync.add(function PostsEditRunPostUndraftedAsyncCallbacks (newPost, oldPost) {
  if (!newPost.draft && oldPost.draft) {
    void postsUndraftNotification(newPost);
  }
});

// set postedAt when a post is moved out of drafts
function postsSetPostedAt (data: Partial<DbPost>) {
  data.postedAt = new Date();
  return data;
}

voteCallbacks.castVoteAsync.add(function increaseMaxBaseScore ({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  if (vote.collectionName === "Posts") {
    const post = newDocument as DbPost;
    if (post.baseScore > (post.maxBaseScore || 0)) {
      let thresholdTimestamp: any = {};
      if (!post.scoreExceeded2Date && post.baseScore >= 2) {
        thresholdTimestamp.scoreExceeded2Date = new Date();
      }
      if (!post.scoreExceeded30Date && post.baseScore >= 30) {
        thresholdTimestamp.scoreExceeded30Date = new Date();
      }
      if (!post.scoreExceeded45Date && post.baseScore >= 45) {
        thresholdTimestamp.scoreExceeded45Date = new Date();
      }
      if (!post.scoreExceeded75Date && post.baseScore >= 75) {
        thresholdTimestamp.scoreExceeded75Date = new Date();
      }
      Posts.update({_id: post._id}, {$set: {maxBaseScore: post.baseScore, ...thresholdTimestamp}})
    }
  }
});

getCollectionHooks("Posts").newSync.add(function PostsNewDefaultLocation(post: DbPost): DbPost {
  return {...post, ...getDefaultPostLocationFields(post)}
});

getCollectionHooks("Posts").newSync.add(function PostsNewDefaultTypes(post: DbPost): DbPost {
  if (post.isEvent && post.groupId && !post.types) {
    const localgroup = Localgroups.findOne(post.groupId) 
    if (!localgroup) throw Error(`Wasn't able to find localgroup for post ${post}`)
    const { types } = localgroup
    post = {...post, types}
  }
  return post
});

// LESSWRONG – bigUpvote
getCollectionHooks("Posts").newAfter.add(async function LWPostsNewUpvoteOwnPost(post: DbPost): Promise<DbPost> {
 var postAuthor = Users.findOne(post.userId);
 const votedPost = postAuthor && await performVoteServer({ document: post, voteType: 'bigUpvote', collection: Posts, user: postAuthor })
 return {...post, ...votedPost} as DbPost;
});

getCollectionHooks("Posts").newSync.add(function PostsNewUserApprovedStatus (post) {
  const postAuthor = Users.findOne(post.userId);
  if (!postAuthor?.reviewedByUserId && (postAuthor?.karma || 0) < MINIMUM_APPROVAL_KARMA) {
    return {...post, authorIsUnreviewed: true}
  }
});

getCollectionHooks("Posts").createBefore.add(function AddReferrerToPost(post, properties)
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
});

addEditableCallbacks({collection: Posts, options: makeEditableOptions})
addEditableCallbacks({collection: Posts, options: makeEditableOptionsModeration})
addEditableCallbacks({collection: Posts, options: makeEditableOptionsCustomHighlight})

getCollectionHooks("Posts").newAfter.add(function PostsNewPostRelation (post) {
  if (post.originalPostRelationSourceId) {
    void createMutator({
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
});

getCollectionHooks("Posts").editAsync.add(function UpdatePostShortform (newPost, oldPost) {
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
});

// If an admin changes the "hideCommentKarma" setting of a post after it
// already has comments, update those comments' hideKarma field to have the new
// setting. This should almost never be used, as we really don't want to
// surprise users by revealing their supposedly hidden karma.
getCollectionHooks("Posts").editAsync.add(async function UpdateCommentHideKarma (newPost, oldPost) {
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
});

export async function newDocumentMaybeTriggerReview (document) {
  const author = await Users.findOne(document.userId);
  if (author && (!author.reviewedByUserId || author.sunshineSnoozed)) {
    Users.update({_id:author._id}, {$set:{needsReview: true}})
  }
  return document
}
getCollectionHooks("Posts").newAfter.add(newDocumentMaybeTriggerReview);

getCollectionHooks("Posts").editAsync.add(async function updatedPostMaybeTriggerReview (newPost, oldPost) {
  if (!newPost.draft && oldPost.draft) {
    await newDocumentMaybeTriggerReview(newPost)
  }
});

// Use the first image in the post as the social preview image
async function extractSocialPreviewImage (post: DbPost) {
  // socialPreviewImageId is set manually, and will override this
  if (post.socialPreviewImageId) return post

  let socialPreviewImageAutoUrl = ''
  if (post.contents?.html) {
    const $ = cheerio.load(post.contents.html)
    const firstImg = $('img').first()
    if (firstImg) {
      socialPreviewImageAutoUrl = firstImg.attr('src') || ''
    }
  }
  
  // Side effect is necessary, as edit.async does not run a db update with the
  // returned value
  // It's important to run this regardless of whether or not we found an image,
  // as removing an image should remove the social preview for that image
  Posts.update({ _id: post._id }, {$set: { socialPreviewImageAutoUrl }})
  
  return {...post, socialPreviewImageAutoUrl}
  
}

getCollectionHooks("Posts").editAsync.add(async function updatedExtractSocialPreviewImage(post: DbPost) {await extractSocialPreviewImage(post)})
getCollectionHooks("Posts").newAfter.add(extractSocialPreviewImage)
