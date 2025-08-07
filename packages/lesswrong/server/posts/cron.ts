import { Posts } from '../../server/collections/posts/collection';

export async function checkScheduledPosts() {
  // fetch all posts tagged as future
  const scheduledPosts = await Posts.find({isFuture: true}, {projection: {_id: 1, status: 1, postedAt: 1, userId: 1, title: 1}}).fetch();

  // filter the scheduled posts to retrieve only the one that should update, considering their schedule
  const postsToUpdate = scheduledPosts.filter(post => post.postedAt <= new Date());

  // update posts found
  if (postsToUpdate.length > 0) {
    const postsIds = postsToUpdate.map(post => post._id);
    await Posts.rawUpdateMany({_id: {$in: postsIds}}, {$set: {isFuture: false}}, {multi: true});

    // log the action
    console.log('// Scheduled posts approved:', postsIds); // eslint-disable-line
  }
}
