import { Posts } from "../../../lib/collections/posts";
import { mergeSelectors } from "../../../lib/utils/viewUtils";
import { autoApplyTagsTo } from "../../languageModels/autoTagCallbacks";
import { createAnonymousContext, Globals } from "../../vulcan-lib";
import { wrapVulcanAsyncScript } from "../utils";

// Arguments: karmaResumeScore, karmaCutoff
//
// Get all posts, ordered by karma, descending
//
// for each post, order by karma, descending
// Every 10 posts print karma
// run the autoApplyTagsTo fundtion on the post
async function historicalAutoTag({karmaResumeScore=null, karmaCutoff=0}: {karmaResumeScore: number|null, karmaCutoff: number}) {
  const context = createAnonymousContext()
  const defaultSelector = Posts.defaultView({}).selector;
  const selector = mergeSelectors(defaultSelector, {baseScore: {$gt: karmaCutoff}});
  const posts = Posts.find(selector)
  
  // TODO; why u no iterator
  let i = 0;
  // for (const post of posts) {
  //   if (i % 10 === 0) {
  //     console.log(`Currently at karma: ${post.baseScore}`);
  //   }
  //   autoApplyTagsTo(post, context);
  //   i++;
  // }
}

Globals.historicalAutoTag = wrapVulcanAsyncScript('historicalAutoTag', historicalAutoTag);
