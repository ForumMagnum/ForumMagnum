
import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Notifications } from '../../lib/collections/notifications/collection';

registerMigration({
  name: "deletedNotifications",
  dateWritten: "2020-05-22",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "deleted"
    });
  }
})
