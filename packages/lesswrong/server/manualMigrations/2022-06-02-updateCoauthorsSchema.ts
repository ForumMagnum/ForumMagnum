import { registerMigration } from './migrationUtils';
import Posts from '../../server/collections/posts/collection';

export default registerMigration({
  name: "updateCoauthorsSchema",
  dateWritten: "2022-06-02",
  idempotent: true,
  action: async () => {
    const posts = await Posts.find({coauthorUserIds: {$exists: true}}).fetch();
    for (const post of posts) {
      // We've now changed the schema of post wrt coauthors, cast it to the old schema
      const coauthorUserIds = (post as { coauthorUserIds?: string[] }).coauthorUserIds;
      if (coauthorUserIds?.length) {
        await Posts.rawUpdateOne(
          {
            _id: post._id,
          },
          {
            $set: {
              coauthorStatuses: coauthorUserIds.map((userId) => ({
                userId,
                confirmed: true,
                requested: false,
              })),
            },
          },
        );
      }
    }
  },
});
