import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Users } from '../../lib/collections/users/collection';

registerMigration({
  name: "setSunshineSnoozeValues",
  dateWritten: "2020-01-24",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Users,
      fieldName: "sunshineSnoozed"
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "needsReview"
    })
  }
})
