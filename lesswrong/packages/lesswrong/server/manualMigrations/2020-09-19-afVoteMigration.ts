/* eslint-disable no-console */
// Given all the console logs, this seemed more elegant than commenting on every one
import { fillDefaultValues, forEachDocumentBatchInCollection, registerMigration } from './migrationUtils';
import { Votes } from '../../lib/collections/votes/collection';
import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';

registerMigration({
  name: "afVoteMigration",
  dateWritten: "2020-09-19",
  idempotent: true,
  action: async () => {
    await fillDefaultValues({
      collection: Votes,
      fieldName: "documentIsAf",
    });

    const afPosts = await Posts.find({af: true}, {}, { _id: 1}).fetch()
    const afComments = await Comments.find({af: true}, {}, {_id: 1}).fetch()

    console.log("Fetched all the votes and comments")

    const afDocs = new Map([...afPosts, ...afComments].map(({_id}) => [_id, true]))

    await forEachDocumentBatchInCollection({
      collection: Votes,
      batchSize: 10000,
      callback: async (votes: DbVote[]) => {
        // eslint-disable-next-line no-console
        console.log(`Updating batch of ${votes.length} af document status`);
        const updates = votes.flatMap(({_id, documentId}) => {
          if (!afDocs.get(documentId)) return []
          return [{
            updateOne: {
              filter: { _id },
              update: {
                $set: {
                  documentIsAf: true
                }
              }
            }
          }]
        } );
        if (updates.length) {
          await Votes.rawCollection().bulkWrite(updates, {ordered: false});
        }
      }
    })
  }
});
