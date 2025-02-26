import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection';

export default registerMigration({
  name: "fillDefaultNoIndex",
  dateWritten: "2020-05-19",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "noIndex"
    });
  }
})
