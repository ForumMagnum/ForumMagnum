import { Posts } from '../../lib/collections/posts';
import htmlToText from 'html-to-text';

const runFix = false;

if (runFix) {
  //eslint-disable-next-line no-console
  console.log("Running body field fix on database...");
  let postCount = 0;
  Posts.find().fetch().forEach((post) => {
    const { html = "" } = post.contents || {}
    if (html) {
      const plaintextBody = htmlToText.fromString(html);
      const excerpt =  plaintextBody.slice(0,140);
      Posts.update(post._id, {$set: {body: plaintextBody, excerpt: excerpt}});
      postCount++;
      if (postCount % 100 == 0) {
        //eslint-disable-next-line no-console
        console.log("Fixed n posts: ", postCount);
      }
    }
  })
}
