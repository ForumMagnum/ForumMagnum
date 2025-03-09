import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Users from '../../server/collections/users/collection';

const COVID_TAG_ID = 'tNsqhzTibgGJKPEWB';
const RATIONALITY_TAG_ID = 'Ng8Gice9KNkncxqcj';
const WORLD_MODELING_TAG_ID = '3uE2pXvbcnS9nnZRE';

const EXCLUDE_TAG_IDS = [COVID_TAG_ID, RATIONALITY_TAG_ID, WORLD_MODELING_TAG_ID];

export default registerMigration({
  name: "updateDefaultFrontpageTagFilterSettings",
  dateWritten: "2023-01-04",
  idempotent: true,
  action: async () => {
    let batchNumber = 1;
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 500,
      filter: {
        "frontpageFilterSettings.tags": {$exists: true},
      },
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log(`Migrating user batch #${batchNumber++}`);
        const usersWithDefaultFilterSettings = users.filter((user) => {
          const { frontpageFilterSettings } = user;

          // Update users who either have no custom tag filter settings, or have the covid filter we put there, or only default tags
          if (frontpageFilterSettings.tags.length === 0) {
            return true;
          } else if (frontpageFilterSettings.tags.every((tag: AnyBecauseObsolete) => tag.filterMode === 'Default')) {
            return true;
          }

          return false;
        })

        const defaultFilterUpdates = usersWithDefaultFilterSettings.map(({ _id, frontpageFilterSettings: { tags } }) => {
          const newTags = [{
              tagId: RATIONALITY_TAG_ID,
              tagName: 'Rationality',
              filterMode: 10
            }, {
              tagId: WORLD_MODELING_TAG_ID,
              tagName: 'World Modeling',
              filterMode: 10
            },
            ...tags.filter((tag: AnyBecauseObsolete) => !EXCLUDE_TAG_IDS.includes(tag.tagId))
          ];

          return {
            updateOne: {
              filter: {_id},
              update: {$set: {"frontpageFilterSettings.tags": newTags}}
            }
          };
        });

        await Users.rawCollection().bulkWrite(defaultFilterUpdates, {ordered: false});
      }
    });
  },
});
