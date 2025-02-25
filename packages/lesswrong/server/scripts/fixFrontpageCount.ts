import { Posts } from '../../lib/collections/posts/collection';
import Users from '../../lib/collections/users/collection';

const fixFrontpageCounts = false

async function fixFrontpagePostCount() {
  try {
    let frontpageCountsPromise = Posts.aggregate([
      {$match: {frontpage: true}},
      {$group: {_id: '$userId', count: {$sum: 1}}},
      {$sort: {count: -1}},
    ])
    //eslint-disable-next-line no-console
    console.log("Fixing frontpage counts", frontpageCountsPromise);
    let frontpageCounts = await frontpageCountsPromise;
    let frontpageCountsArray = await frontpageCounts.toArray();
    const userUpdates = frontpageCountsArray.map((postCount: AnyBecauseTodo) => (
      { updateOne :
       {
          filter: {_id: postCount._id},
          update : {$set: {frontpagePostCount: postCount.count}},
          upsert : false
       }
     }))
     let userUpdatesCursor = await Users.rawCollection().bulkWrite(userUpdates, {ordered: false})
     //eslint-disable-next-line no-console
     console.log("Finished updating frontpage post counts: ", userUpdatesCursor);
   } catch (e) {
     //eslint-disable-next-line no-console
     console.error(e);
   }
}

if (fixFrontpageCounts) {
  void fixFrontpagePostCount()
}
