import { registerMigration } from './migrationUtils';

import { Users } from '../../lib/collections/users/collection';

registerMigration({
  name: "petrovButtonReset",
  dateWritten: "2022-09-21",
  idempotent: true,
  action: async () => {
    await Users.rawUpdateMany(
      { petrovPressedButtonDate: {$exists:true} },
      { $unset: {
        petrovPressedButtonDate: 1
      } },
      { multi: true }
    );
  }
})
