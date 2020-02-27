import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Users } from '../../lib/collections/users/collection';

registerMigration({
  name: "setMaxCommentAndPostCount",
  dateWritten: "2020-02-23",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "maxPostCount"
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "maxCommentCount"
    })
  }
})
