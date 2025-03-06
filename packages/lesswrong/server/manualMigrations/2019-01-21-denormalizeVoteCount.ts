import Votes from '../../server/collections/votes/collection';
import { getVoteableCollections } from '../../lib/make_voteable';
import { registerMigration, migrateDocuments } from './migrationUtils';
import mapValues from 'lodash/mapValues';
import * as _ from 'underscore';

export default registerMigration({
  name: "denormalizeVoteCount",
  dateWritten: "2019-01-21",
  idempotent: true,
  action: async () => {
    for (let collection of getVoteableCollections())
    {
      await migrateDocuments({
        description: `Fill in voteCount field on ${collection.collectionName}`,
        collection: collection,
        batchSize: 100,
        unmigratedDocumentQuery: {
          voteCount: {$exists:false},
        },
        migrate: async (documents) => {
          // Get votes on the set of documents
          let documentIds = _.map(documents, d=>d._id);
          const votes = await Votes.find({
            documentId: {$in: documentIds},
            cancelled: false,
          }).fetch();
          
          // Group votes by document to generate vote counts
          let votesByDocument: Record<string,Array<DbVote>> = {};
          for (let documentId of documentIds)
            votesByDocument[documentId] = [];
          for (let vote of votes)
            votesByDocument[vote.documentId].push(vote);
          
          // Write vote counts
          let updatesByDocument = mapValues(
            votesByDocument,
            (votes, documentID) => ({
              updateOne: {
                filter: { _id: documentID },
                update: {
                  $set: { voteCount: votes.length }
                }
              }
            })
          );
          let updates = _.values(updatesByDocument);
          
          if (updates.length > 0) {
            await collection.rawCollection().bulkWrite(
              updates,
              { ordered: false }
            );
          }
        },
      });
    }
  },
});
