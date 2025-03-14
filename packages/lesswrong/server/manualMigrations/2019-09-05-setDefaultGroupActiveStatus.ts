import { registerMigration, fillDefaultValues } from './migrationUtils';

import { Localgroups } from '../../server/collections/localgroups/collection';

export default registerMigration({
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
