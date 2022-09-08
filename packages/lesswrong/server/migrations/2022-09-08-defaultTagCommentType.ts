import { registerMigration, fillDefaultValues } from './migrationUtils';
import Comments from '../../lib/collections/comments/collection';


registerMigration({
  name: "defaultTagCommentType",
  dateWritten: "2022-08-22",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Comments,
      fieldName: "tagCommentType",
    });
  },
});
