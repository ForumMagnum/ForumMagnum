import { Posts } from '../../lib/collections/posts';
import { Vulcan, runCallbacks } from '../vulcan-lib';
import { loadRevision } from '../revisionsCache';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';

Vulcan.runPostEditCallbacks = async () => {
  let postCount = 0;
  // To fetch all posts from a given user:
  // const posts = Posts.find({draft:{$ne:true}, userId:'N9zj5qpTfqmbn9dro'}).fetch()
  // To fetch all posts, starting with most recent:
  const posts = Posts.find({draft:{$ne:true}}, {skip:998, limit:10000, sort:{createdAt:-1}}).fetch()
  //eslint-disable-next-line no-console
  console.log(`Found ${posts.length} posts, triggering Edit Callbacks`)
  await asyncForeachSequential(posts, async (post) => {
    const contents = await loadRevision({collection: Posts, doc: post});
    const { html = "" } = contents || {}
    if (html) {
      try {
        Posts.update(post._id,runCallbacks("posts.edit.sync", {$set: { html }}, post))
      } catch (e) {
        //eslint-disable-next-line no-console
        console.error(e)
      }
    }
    if (postCount % 1 == 0) {
      //eslint-disable-next-line no-console
      console.log(`${postCount} posts / ${posts.length}, ${post._id}, ${post.title}`);
    }
    postCount ++
  })
}
