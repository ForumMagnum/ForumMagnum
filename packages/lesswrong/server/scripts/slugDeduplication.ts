import { Posts } from '../../server/collections/posts/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';

const runDeduplication = false;

async function slugDeduplication() {
  try {
    //eslint-disable-next-line no-console
    console.log("Running slugDeduplication");
    let duplicateSlugsPromise = Posts.aggregate([
      {"$group" : { "_id": "$slug", "count": { "$sum": 1 } } },
      {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } },
      {"$project": {"slug" : "$_id", "_id" : 0} },
    ])
    let duplicateSlugs = await duplicateSlugsPromise;
    let duplicateSlugsArray = await duplicateSlugs.toArray();
    let dedupActions: Array<any> = [];
    let duplicatePosts: Array<any> = [];
    let newSlug = "";
    let postCount = 0;
    let index = 0;
    await asyncForeachSequential(duplicateSlugsArray, async (duplicateObject: any) => {
      index = 0;
      duplicatePosts = await Posts.find({slug: duplicateObject.slug}, {sort: {baseScore: -1}}).fetch();
      duplicatePosts.slice(1).forEach((post: any) => { //Highest-karma post gets to keep the slug, all others get new slugs
          newSlug = post.slug + "-" + index;
          if (postCount % 100 === 0) {
            //eslint-disable-next-line no-console
            console.log("Processed n posts: ", postCount);
          }
          // Posts.update({_id: post._id}, {$set: {slug: newSlug}});
          dedupActions.push({ updateOne :
             {
                filter: {_id: post._id},
                update : {$set: {slug: newSlug}},
                upsert : false
             }
          })
          index = index + 1;
          postCount = postCount + 1;
      })
    })

     let postUpdateCursor = await Posts.rawCollection().bulkWrite(dedupActions, {ordered: false})
     //eslint-disable-next-line no-console
     console.log(postUpdateCursor);
  } catch(e) {
    //eslint-disable-next-line no-console
    console.error(e)
  }
}

if (runDeduplication) {
  void slugDeduplication()
}
