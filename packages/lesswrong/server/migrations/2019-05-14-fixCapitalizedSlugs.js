import { Utils } from 'meteor/vulcan:lib';
import Users from 'meteor/vulcan:users';
import { registerMigration, migrateDocuments } from './migrationUtils';

registerMigration({
  name: "fixCapitalizedSlugs",
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
