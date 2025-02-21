import { wrapVulcanAsyncScript } from './utils'
import { Vulcan } from '../../lib/vulcan-lib/config';
import Users from '../../lib/collections/users/collection'
import { forEachDocumentBatchInCollection } from '../manualMigrations/migrationUtils';
import Tags from '../../lib/collections/tags/collection';
import { FilterMode } from '../../lib/filterSettings';

/**
 * Sets the frontpage filter weight for the given tag for all users who have edited their filter settings before
 */
Vulcan.setUserTagFilters = wrapVulcanAsyncScript(
  'setUserTagFilters',
  async (slug: string, weight: FilterMode) => {
    const tag = await Tags.findOne({ slug });
    if (!tag) {
      throw new Error("Tag not found");
    }

    let batchNumber = 1;
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 200,
      filter: {
        "frontpageFilterSettings.tags": {$exists: true},
      },
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log(`Migrating user batch #${batchNumber++}`);
        
        const changes = users.map(({ _id, frontpageFilterSettings }) => {
          const newTags = [
            ...frontpageFilterSettings.tags.filter((t: AnyBecauseTodo) => t.tagId !== tag._id),
            {
              tagId: tag._id,
              tagName: tag.name,
              filterMode: weight,
            },
          ];
          const newFilterSettings = {
            ...frontpageFilterSettings,
            tags: newTags
          }
          return {
            updateOne: {
              filter: {_id},
              update: {$set: {"frontpageFilterSettings": newFilterSettings}}
            }
          };
        });

        await Users.rawCollection().bulkWrite(changes, {ordered: false})
      }
    });
  }
)
