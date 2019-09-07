import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Localgroups } from '../../lib/collections/localgroups/collection.js';

registerMigration({
  name: "setDefaultGroupActiveStatus",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Localgroups,
      fieldName: "inactive",
    });
  },
});
