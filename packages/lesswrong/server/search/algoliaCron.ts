import { DatabasePublicSetting } from '../../lib/publicSettings';
import { addCronJob } from '../cronUtil';
import { algoliaCleanAll, algoliaExportAll } from '../scripts/algoliaExport';

// NB: This setting will set you back like $500/mo
const algoliaAutoSyncIndexesSetting = new DatabasePublicSetting<boolean>('algolia.autoSyncIndexes', false)

if (algoliaAutoSyncIndexesSetting.get()) {
  addCronJob({
    name: 'updateAlgoliaIndex',
    interval: 'every 24 hours',
    job: async () => {
      await algoliaExportAll();
      await algoliaCleanAll();
    }
  });
}
