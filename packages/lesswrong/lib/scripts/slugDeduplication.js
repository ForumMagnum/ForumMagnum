import { Posts } from 'meteor/example-forum';
import { Utils } from 'meteor/vulcan:core';

const runDeduplication = false;

async function slugDeduplication() {
  try {
    console.log("Running slugDeduplication");
    let duplicateSlugsPromise = Posts.rawCollection().aggregate([
      {"$group" : { "_id": "$slug", "count": { "$sum": 1 } } },
      {"$match": {"_id" :{ "$ne" : null } , "count" : {"$gt": 1} } },
      {"$project": {"slug" : "$_id", "_id" : 0} },
    ])
    let duplicateSlugs = await duplicateSlugsPromise;
    let duplicateSlugsArray = await duplicateSlugs.toArray();
    let dedupActions = [];
    let duplicatePosts = [];
    let newSlug = "";
    let postCount = 0;
    let index = 0;
    duplicateSlugsArray.forEach((duplicateObject) => {
      index = 0;
      duplicatePosts = Posts.find({slug: duplicateObject.slug}, {sort: {baseScore: -1}}).fetch();
      duplicatePosts.slice(1).forEach((post) => { //Highest-karma post gets to keep the slug, all others get new slugs
          newSlug = post.slug + "-" + index;
          if (postCount % 100 === 0) {
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
     console.log(postUpdateCursor);
  } catch(e) {
    console.log(e)
  }
}

if (runDeduplication) {
  slugDeduplication()
}
