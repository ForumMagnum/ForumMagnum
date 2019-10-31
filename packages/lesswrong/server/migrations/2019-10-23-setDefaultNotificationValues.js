import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Notifications } from '../../lib/collections/notifications/collection.js';

registerMigration({
  name: "setDefaultNotificationValues",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "emailed",
    });
    await fillDefaultValues({
      collection: Notifications,
      fieldName: "waitingForBatch",
    });
  },
});
