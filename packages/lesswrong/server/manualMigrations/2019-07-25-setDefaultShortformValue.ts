import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Posts } from '../../server/collections/posts/collection';

export default registerMigration({
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
