import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Localgroups } from '../../lib/collections/localgroups/collection';

registerMigration({
  name: "setDefaultGroupActiveStatus",
  dateWritten: "2019-09-05",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Localgroups,
      fieldName: "inactive",
    });
  },
});
