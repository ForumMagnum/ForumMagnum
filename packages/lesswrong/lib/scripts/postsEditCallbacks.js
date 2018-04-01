import { Posts, Comments } from 'meteor/example-forum';
import { runCallbacks } from 'meteor/vulcan:core';

Vulcan.runPostEditCallbacks = () => {
  let postCount = 0;
  const posts = Posts.find().fetch()
  posts.forEach((post) => {
    if (post.htmlBody) {
      try {
        Posts.update(post._id,runCallbacks("posts.edit.sync", {$set: {htmlBody:post.htmlBody}}, post))
      } catch (e) {
        console.log(e)
      }
    }
    if (postCount % 100 == 0) {
      console.log(`${postCount} posts / ${posts.length}`);
    }
    postCount ++
  })
}
