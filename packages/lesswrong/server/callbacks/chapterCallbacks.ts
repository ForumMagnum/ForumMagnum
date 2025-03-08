import { Sequences } from '../../server/collections/sequences/collection';
import { sequenceGetAllPosts } from '../../lib/collections/sequences/helpers';
import { Posts } from '../../server/collections/posts/collection'
import { createAdminContext } from '../vulcan-lib/query';
import { getCollectionHooks } from '../mutationCallbacks';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import * as _ from 'underscore';
import { createNotifications, getSubscribedUsers } from '../notificationCallbacksHelpers';
import { subscriptionTypes } from '../../lib/collections/subscriptions/helpers';
import xor from 'lodash/xor';

async function ChaptersEditCanonizeCallback (chapter: DbChapter) {
  const context = await createAdminContext();
  const posts = await sequenceGetAllPosts(chapter.sequenceId, context)
  const sequence = await Sequences.findOne({_id:chapter.sequenceId})

  const postsWithCanonicalSequenceId = await Posts.find({canonicalSequenceId: chapter.sequenceId}).fetch()
  const removedPosts = _.difference(_.pluck(postsWithCanonicalSequenceId, '_id'), _.pluck(posts, '_id'))

  await asyncForeachSequential(removedPosts, async (postId) => {
    await Posts.rawUpdateOne({_id: postId}, {$unset: {
      canonicalPrevPostSlug: true,
      canonicalNextPostSlug: true,
      canonicalSequenceId: true,
    }});
  })

  await asyncForeachSequential(posts, async (currentPost: DbPost, i: number) => {
    const validSequenceId = (currentPost: DbPost, sequence: DbSequence) => {
      // Only update a post if it either doesn't have a canonicalSequence, or if we're editing
      // chapters *from* its canonicalSequence
      return !currentPost.canonicalSequenceId || currentPost.canonicalSequenceId === sequence._id
    }

    if ((currentPost.userId === sequence?.userId) && validSequenceId(currentPost, sequence)) {
      let prevPost = {slug:""}
      let nextPost = {slug:""}
      if (i-1>=0) {
        prevPost = posts[i-1]
      }
      if (i+1<posts.length) {
        nextPost = posts[i+1]
      }
      await Posts.rawUpdateOne({slug: currentPost.slug}, {$set: {
        canonicalPrevPostSlug: prevPost.slug,
        canonicalNextPostSlug: nextPost.slug,
        canonicalSequenceId: chapter.sequenceId,
      }});
    }
  })
}

getCollectionHooks("Chapters").newAsync.add(ChaptersEditCanonizeCallback);
getCollectionHooks("Chapters").editAsync.add(ChaptersEditCanonizeCallback);


getCollectionHooks("Chapters").updateAsync.add(async function UpdateSequence({oldDocument, newDocument}) {
  // If any of the user-facing fields have changed, also update the parent sequence's lastUpdated date
  if (
    oldDocument.title !== newDocument.title ||
    oldDocument.subtitle !== newDocument.subtitle ||
    xor(oldDocument.postIds, newDocument.postIds).length > 0
  ) {
    await Sequences.rawUpdateOne(
      {_id: newDocument.sequenceId},
      {$set: {lastUpdated: new Date()}}
    )
  }
});

getCollectionHooks("Chapters").updateAsync.add(async function NewSequencePostNotifications({oldDocument, newDocument, context}) {
  // Check if there were any posts added to this chapter
  const newPostIds = _.difference(newDocument.postIds, oldDocument.postIds)
  if (!newPostIds.length) {
    return
  }
  const posts = await Posts.find({
    _id: {$in: newPostIds},
    draft: {$ne: true},
    deletedDraft: {$ne: true},
  }).fetch()
  if (!posts.length) {
    return
  }

  // If so, notify the relevant users
  const subscribedUsers = await getSubscribedUsers({
    documentId: oldDocument.sequenceId,
    collectionName: "Sequences",
    type: subscriptionTypes.newSequencePosts
  })
  const sequence = await Sequences.findOne({_id: oldDocument.sequenceId})
  if (sequence && !sequence.isDeleted && !sequence.draft) {
    let subscribedUserIds = _.map(subscribedUsers, u=>u._id);
    
    // Don't notify the user who added the post
    subscribedUserIds = context.currentUser?._id ? _.difference(subscribedUserIds, context.currentUser._id) : subscribedUserIds
    await createNotifications({userIds: subscribedUserIds, notificationType: 'newSequencePosts', documentType: 'sequence', documentId: sequence._id, extraData: {postIds: newPostIds}})
  }
});
