import { Utils, slugify } from '../../lib/vulcan-lib/utils';
import Users from '../../lib/collections/users/collection';
import { registerMigration, migrateDocuments } from './migrationUtils';
import * as _ from 'underscore';

registerMigration({
  name: "fixCapitalizedSlugs",
  dateWritten: "2019-05-14",
  idempotent: true,
  action: async () => await migrateDocuments({
    description: `lowercase slugs`,
    collection: Users,
    unmigratedDocumentQuery: {
      slug: /.*[A-Z].*/,
    },
    batchSize: 1000,
    migrate: async (users) => {
      let updates = Promise.all(_.map(users, async (user) => ({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              slug: await Utils.getUnusedSlugByCollectionName('Users', slugify(user.slug || ""))
            }
          }
        }
      })));
      await Users.rawCollection().bulkWrite(updates, { ordered: false });
    },
  })
});
