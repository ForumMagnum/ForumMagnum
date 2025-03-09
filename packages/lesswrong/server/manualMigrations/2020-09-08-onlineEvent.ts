
import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Posts } from '../../server/collections/posts/collection';

export default registerMigration({
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
