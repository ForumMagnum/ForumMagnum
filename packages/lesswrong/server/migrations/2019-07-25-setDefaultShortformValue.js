import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Posts } from '../../lib/collections/posts/collection.js';

registerMigration({
  name: "setDefaultShortformValue",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "shortform",
    });
  },
});
