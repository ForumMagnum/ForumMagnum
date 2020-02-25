import { registerMigration, fillDefaultValues } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';

registerMigration({
  name: "setAfVoteCount",
  dateWritten: "2020-02-24",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Posts,
      fieldName: "afVoteCount"
    });
    await fillDefaultValues({
      collection: Comments,
      fieldName: "afVoteCount"
    })
  }
});