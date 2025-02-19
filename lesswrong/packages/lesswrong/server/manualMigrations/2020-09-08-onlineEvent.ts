
import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection';

registerMigration({
  name: "onlineEvents",
  dateWritten: "2020-09-08",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "onlineEvent",
    });
  }
})
