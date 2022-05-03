import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Posts } from '../../lib/collections/posts';

registerMigration({
  name: "defaultRSSThresholdFill",
  dateWritten: "2022-05-03",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "scoreExceeded125Date",
    });
    await fillDefaultValues({
      collection: Posts,
      fieldName: "scoreExceeded200Date",
    });
  },
});
