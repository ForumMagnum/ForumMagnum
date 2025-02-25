import { registerMigration } from './migrationUtils';
import { updateMutator } from '../vulcan-lib/mutators';


import { Posts } from '../../lib/collections/posts/collection';
import Users from '../../lib/collections/users/collection';

export default registerMigration({
  name: "setAfShortformValues",
  dateWritten: "2019-10-23",
  idempotent: true,
  action: async () => {
    const afUsers = await Users.find({groups: "alignmentForum"}).fetch()
    const afUsersWithShortforms = afUsers.filter(user => !!user.shortformFeedId)
    for (const afUserWithShortforms of afUsersWithShortforms) {
      await updateMutator({
        collection: Posts,
        documentId: afUserWithShortforms.shortformFeedId!,
        set: { af: true },
        unset: {},
        validate: false,
      });
    }
  },
});
