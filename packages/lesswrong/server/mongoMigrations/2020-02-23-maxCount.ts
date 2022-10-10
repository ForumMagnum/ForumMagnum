import { registerMigration, fillDefaultValues } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

import { Users } from '../../lib/collections/users/collection';

registerMigration({
  name: "setMaxCommentAndPostCount",
  dateWritten: "2020-02-23",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Users", fieldName: "maxPostCount"});
    await fillDefaultValues({
      collection: Users,
      fieldName: "maxPostCount"
    });
    await recomputeDenormalizedValues({collectionName: "Users", fieldName: "maxCommentCount"});
    await fillDefaultValues({
      collection: Users,
      fieldName: "maxCommentCount"
    })
  }
})
