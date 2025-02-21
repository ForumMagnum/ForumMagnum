
import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection';

registerMigration({
  name: "postDefaultDraft",
  dateWritten: "2020-10-26",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "draft"
    });
  }
})
