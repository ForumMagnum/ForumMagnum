import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Tags from '../../server/collections/tags/collection';
import Users from '../../server/collections/users/collection';

export default registerMigration({
  name: "addDadTagSettings",
  dateWritten: "2022-12-15",
  idempotent: true,
  action: async () => {
    const dadTag = await Tags.findOne({ slug: "draft-amnesty-day" });
    if (!dadTag) {
      throw new Error("Draft amnesty day tag not found");
    }

    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 100,
      filter: {
        "frontpageFilterSettings.tags": {$exists: true},
      },
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating user batch");
        const changes = users.map(({ _id, frontpageFilterSettings: { tags } }) => {
          const newTags = [
            ...tags.filter((tag: AnyBecauseObsolete) => tag.tagId !== dadTag._id),
            {
              tagId: dadTag._id,
              tagName: dadTag.name,
              filterMode: 0.75,
            },
          ];
          return {
            updateOne: {
              filter: {_id},
              update: {$set: {"frontpageFilterSettings.tags": newTags}}
            }
          };
        });

        await Users.rawCollection().bulkWrite(changes, {ordered: false});
      }
    });
  },
});
