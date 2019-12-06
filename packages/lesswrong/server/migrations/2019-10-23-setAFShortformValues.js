import { registerMigration } from './migrationUtils';
import { editMutation } from 'meteor/vulcan:core';


import { Posts } from '../../lib/collections/posts/collection.js';
import Users from 'meteor/vulcan:users';

registerMigration({
  name: "setAfShortformValues",
  dateWritten: "2019-10-23",
  idempotent: true,
  action: async () => {
    const afUsers = await Users.find({groups: "alignmentForum"}).fetch()
    const afUsersWithShortforms = afUsers.filter(user => !!user.shortformFeedId)
    for (const afUserWithShortforms of afUsersWithShortforms) {
      await editMutation({
        collection: Posts,
        documentId: afUserWithShortforms.shortformFeedId,
        set: { af: true },
        unset: {},
        validate: false,
      });
    }
  },
});
