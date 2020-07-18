
import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Users } from '../../lib/collections/users/collection';

registerMigration({
  name: "notificationOwnPostTagged",
  dateWritten: "2020-07-17",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "notificationOwnPostTagged",
    });
  }
})
