import { registerMigration } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection'
import * as _ from 'underscore';

export default registerMigration({
  name: "migrateLinkPosts",
  dateWritten: "2019-04-24",
  idempotent: true,
  action: async () => {
    // Get posts which were linkposts in legacy, but aren't linkposts now.
    // There are only ~800 such posts, so no batching is necessary.
    const unmigratedLinkposts = await Posts.find({
      // In old-LW/Reddit ontology, there are two fundamental types of post:
      // link-posts and self-posts. This is represented by the is_self field,
      // which, after making its way through the old DB schema and our import
      // script, is either present and "t" (a self-post), or missing (a
      // link-post).
      "legacyData.is_self": { "$exists": false },
      
      // Also make sure it actually has a legacy URL. This excludes non-legacy
      // posts.
      "legacyData.url": { "$exists": true, },
      
      // And it isn't already a linkpost, ie, this script hasn't already
      // migrated it.
      url: {$exists:false}
    }).fetch();
    
    // eslint-disable-next-line no-console
    console.log(`Found ${unmigratedLinkposts.length} old linkposts to migrate`);
    
    const updates = _.map(unmigratedLinkposts, post => ({
      updateOne: {
        filter: { _id: post._id },
        update: {
          $set: {
            url: (post as any).legacyData.url,
          }
        }
      }
    }));
    
    if (updates.length > 0) {
      void Posts.rawCollection().bulkWrite(updates, { ordered: false });
    }
  }
});
