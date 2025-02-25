import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Tags from '../../lib/collections/tags/collection';
import Users from '../../lib/collections/users/collection';

export default registerMigration({
  name: "migrateCommunityFilterSettings",
  dateWritten: "2022-06-30",
  idempotent: true,
  action: async () => {
    const communityTag = await Tags.findOne({ name: "Community" });
    if (!communityTag) {
      throw new Error("Community tag not found");
    }

    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 100,
      filter: {
        "frontpageFilterSettings.tags": {
          tagId: communityTag._id,
          tagName: communityTag.name,
          filterMode: -25,
        },
      },
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating user batch");
        const changes = users.map(({ _id, frontpageFilterSettings: { tags } }) => {
          const newTags = [
            ...tags.filter((tag: AnyBecauseObsolete) => tag.tagId !== communityTag._id),
            {
              tagId: communityTag._id,
              tagName: communityTag.name,
              filterMode: 0.75,
            },
          ];
          return {
            updateOne: {
              filter: { _id },
              update: {$set: {"frontpageFilterSettings.tags": newTags}}
            }
          };
        });

        await Users.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  },
});
