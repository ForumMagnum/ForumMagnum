import { makeEditableOptions, Chapters } from '../../lib/collections/chapters/collection'
import { addEditableCallbacks } from '../editor/make_editable_callbacks';
import { Sequences } from '../../lib/collections/sequences/collection';
import { Posts } from '../../lib/collections/posts/collection'
import { getCollectionHooks } from '../mutationCallbacks';
import * as _ from 'underscore';

addEditableCallbacks({collection: Chapters, options: makeEditableOptions})

async function ChaptersEditCanonizeCallback (chapter: DbChapter) {
  const posts = await Sequences.getAllPosts(chapter.sequenceId)
  const sequence = await Sequences.findOne({_id:chapter.sequenceId})

  const postsWithCanonicalSequenceId = Posts.find({canonicalSequenceId: chapter.sequenceId}).fetch()
  const removedPosts = _.difference(_.pluck(postsWithCanonicalSequenceId, '_id'), _.pluck(posts, '_id'))

  removedPosts.forEach((postId) => {
    Posts.update({_id: postId}, {$unset: {
      canonicalPrevPostSlug: true,
      canonicalNextPostSlug: true,
      canonicalSequenceId: true,
    }});
  })

  posts.forEach((currentPost, i) => {
    const validSequenceId = (currentPost, sequence) => {
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
      Posts.update({slug: currentPost.slug}, {$set: {
        canonicalPrevPostSlug: prevPost.slug,
        canonicalNextPostSlug: nextPost.slug,
        canonicalSequenceId: chapter.sequenceId,
      }});
    }
  })
}

getCollectionHooks("Chapters").newAsync.add(ChaptersEditCanonizeCallback);
getCollectionHooks("Chapters").editAsync.add(ChaptersEditCanonizeCallback);
