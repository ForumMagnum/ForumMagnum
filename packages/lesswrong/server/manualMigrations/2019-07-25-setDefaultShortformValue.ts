import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Posts } from '../../lib/collections/posts/collection';

registerMigration({
  name: "setDefaultShortformValue",
  dateWritten: "2019-07-25",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "shortform",
    });
  },
});
