import { Utils } from '../../lib/vulcan-lib';
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
      let updates = _.map(users, user => ({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              slug: Utils.getUnusedSlugByCollectionName('Users', Utils.slugify(user.slug))
            }
          }
        }
      }));
      await Users.rawCollection().bulkWrite(updates, { ordered: false });
    },
  })
});
