import { DatabasePublicSetting } from '../../lib/publicSettings';
import { addCronJob } from '../cronUtil';
import { algoliaCleanAll, algoliaExportAll } from '../scripts/algoliaExport';

const algoliaAutoSyncIndexesSetting = new DatabasePublicSetting<boolean>('algolia.autoSyncIndexes', false)

if (algoliaAutoSyncIndexesSetting.get()) {
  addCronJob({
    name: 'updateAlgoliaIndex',
    schedule(parser) {
      return parser.text('every 24 hours')
    },
    job: async () => {
      await algoliaExportAll();
      await algoliaCleanAll();
    }
  });
}
