import { Sequences } from '../../lib/collections/sequences/collection';
import { sequenceGetAllPosts } from '../../lib/collections/sequences/helpers';
import { Posts } from '../../lib/collections/posts/collection'
import { createAdminContext } from '../vulcan-lib/query';
import { getCollectionHooks } from '../mutationCallbacks';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import * as _ from 'underscore';

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
