import { Votes } from '../../server/collections/votes/collection';
import { registerMigration, migrateDocuments, fillDefaultValues } from './migrationUtils';
import { getCollection } from '../vulcan-lib/getCollection';
import * as _ from 'underscore';

export default registerMigration({
  name: "migrateVotes",
  dateWritten: "2019-01-04",
  idempotent: true,
  action: async () => {
  
    await migrateDocuments({
      description: "Fill in authorId field",
      collection: Votes,
      batchSize: 100,
      unmigratedDocumentQuery: {
        authorId: {$exists:false},
      },
      migrate: async (documents: Array<DbVote>) => {
        // Get the set of collections that at least one vote in the batch
        // is voting on
        const collectionNames = _.uniq(_.pluck(documents, "collectionName")) as Array<CollectionNameString>
        
        for(let collectionName of collectionNames) {
          const collection = getCollection(collectionName);
          
          // Go through the votes in the batch and pick out IDs of voted-on
          // documents in this collection.
          const votesToUpdate = _.filter(documents, doc => doc.collectionName===collectionName)
          const idsToFind = _.pluck(votesToUpdate, "documentId");
          
          // Retrieve the voted-on documents.
          const votedDocuments: Array<any> = await collection.find({
            _id: {$in: idsToFind}
          }).fetch();
          
          // Extract author IDs from the voted-on documents.
          let authorIdsByDocument: Record<string,string> = {};
          _.each(votedDocuments, doc => authorIdsByDocument[doc._id] = doc.userId);
          
          // Fill in authorId on the votes.
          const updates = _.map(votesToUpdate, vote => {
            if (!authorIdsByDocument[vote.documentId]) {
              // eslint-disable-next-line no-console
              console.log("Vote without corresponding authorId ", vote)
              return { 
                deleteOne: {
                  filter: {_id: vote._id}
                }
              }
            }
            return {
              updateOne: {
                filter: {_id: vote._id},
                update: {
                  $set: {
                    authorId: authorIdsByDocument[vote.documentId]
                  }
                },
                upsert: false,
              }
            };
          });
          await Votes.rawCollection().bulkWrite(
            updates,
            { ordered: false }
          );
        }
      },
    });
    
    await fillDefaultValues({
      collection: Votes,
      fieldName: "cancelled",
      batchSize: 100000
    });
    await fillDefaultValues({
      collection: Votes,
      fieldName: "isUnvote",
      batchSize: 100000
    });
  },
});
