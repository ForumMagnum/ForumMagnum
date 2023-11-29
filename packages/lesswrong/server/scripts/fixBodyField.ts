import { Posts } from '../../lib/collections/posts';
import { htmlToText } from 'html-to-text';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';

const runFix = false;

if (runFix) { void (async ()=>{
  //eslint-disable-next-line no-console
  console.log("Running body field fix on database...");
  let postCount = 0;
  const allPosts = await Posts.find().fetch();
  await asyncForeachSequential(allPosts, async (post) => {
    const { html = "" } = post.contents || {}
    if (html) {
      const plaintextBody = htmlToText(html);
      const excerpt =  plaintextBody.slice(0,140);
      await Posts.rawUpdateOne(post._id, {$set: {body: plaintextBody, excerpt: excerpt}});
      postCount++;
      if (postCount % 100 == 0) {
        //eslint-disable-next-line no-console
        console.log("Fixed n posts: ", postCount);
      }
    }
  })
})()}
