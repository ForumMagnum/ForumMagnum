
import { registerMigration } from './migrationUtils';
import { Votes } from '../../lib/collections/votes';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';

registerMigration({
  name: "afVoteMigration",
  dateWritten: "2020-09-19",
  idempotent: true,
  action: async () => {
    const afPosts = await Posts.find({af: true}, {}, { _id: 1, af: 1}).fetch()
    const afComments = await Comments.find({af: true}, {}, {_id: 1, af: 1}).fetch()

    console.log("Fetched all the votes and comments")

    const afDocs = [...afPosts, ...afComments]

    await Votes.rawCollection().bulkWrite(afDocs.map(({_id, af}) => ({
      updateMany: {
        filter: { documentId: _id },
        update: {
          $set: {
            documentIsAf: true
          }
        }
      }
    })),
    { ordered: false });
  }
});