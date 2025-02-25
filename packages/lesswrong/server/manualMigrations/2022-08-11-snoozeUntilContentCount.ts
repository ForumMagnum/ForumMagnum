import { registerMigration } from './migrationUtils';

import { Users } from '../../lib/collections/users/collection';
import { getNewSnoozeUntilContentCount } from '../../components/sunshineDashboard/ModeratorActions';

export default registerMigration({
  name: "setSnoozeUntilContentCountValues",
  dateWritten: "2022-08-11",
  idempotent: true,
  action: async () => {
    const users = await Users.find({sunshineSnoozed: true}).fetch();
    for (const user of users) {
      await Users.rawUpdateOne(
        { _id: user._id },
        { $set: {
            snoozedUntilContentCount: getNewSnoozeUntilContentCount(user, 1),
          },
        },
      );
    }
  }
})


