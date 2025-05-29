import Users from '../../server/collections/users/collection';
import { registerMigration, migrateDocuments } from './migrationUtils';
import * as _ from 'underscore';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import { slugify } from '@/lib/utils/slugify';

export default registerMigration({
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
      let updates = await Promise.all(_.map(users, async (user) => ({
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              slug: await getUnusedSlugByCollectionName('Users', slugify(user.slug || ""))
            }
          }
        }
      })));
      await Users.rawCollection().bulkWrite(updates, { ordered: false });
    },
  })
});
