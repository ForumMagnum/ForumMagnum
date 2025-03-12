import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Posts } from '../../server/collections/posts/collection';

export default registerMigration({
  name: "postDefaultStickyPriority",
  dateWritten: "2021-08-13",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "stickyPriority"
    });
  }
});
