import { addCronJob } from '../cronUtil';
import { algoliaExportAll, algoliaCleanAll } from '../scripts/algoliaExport';
import { getSetting } from 'meteor/vulcan:lib';

if (getSetting('algolia.autoSyncIndexes', false)) {
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