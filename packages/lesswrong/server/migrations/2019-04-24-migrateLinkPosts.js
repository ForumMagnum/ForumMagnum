import { registerMigration } from './migrationUtils';
import { Posts } from '../../lib/collections/posts'

registerMigration({
  name: "migrateLinkPosts",
  idempotent: true,
  action: async () => {
    // Get posts which were linkposts in legacy, but aren't linkposts now.
    // There are only 239 such posts, so no batching is necessary.
    const unmigratedLinkposts = await Posts.find({
      "legacyData.url": {
        "$exists": true,
        // You can recognize a legacy linkpost by its legacyData.url being an
        // absolute URL, rather than a relative URL. There is, strangely, no
        // (imported) field besides that one which reflects the difference.
        "$regex": "^http",
      },
      url: {$exists:false}
    }).fetch();
    
    const updates = _.map(unmigratedLinkposts, post => ({
      updateOne: {
        filter: { _id: post._id },
        update: {
          $set: {
            url: post.legacyData.url,
          }
        }
      }
    }));
    
    if (updates.length > 0) {
      Posts.rawCollection().bulkWrite(updates, { ordered: false });
    }
  }
});