import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Notifications } from '../../lib/collections/notifications/collection';

registerMigration({
  name: "setDefaultNotificationValues",
  dateWritten: "2019-10-23",
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
