import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Votes } from '../../lib/collections/votes/collection';

registerMigration({
  name: "populateTagUser",
  dateWritten: "2020-06-14",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: TagRels,
      batchSize: 1000,
      callback: async (tagRels: DbTagRel[]) => {
        // eslint-disable-next-line no-console
        console.log(`Filling createdAt and userId fields for ${tagRels.length} tagRels`);
        const changes: Array<any> = [];
        for (let tagRel of tagRels) {
          // If a tagRel does not have its `createdAt` and `userId` fields
          // populated, fill them in with the user and the timestamp of the
          // oldest vote on this tagRel (which, if uncancelled, will have been
          // at tagRel-creation time.)
          const firstVoteQuery = await Votes.find(
            {
              cancelled: false,
              documentId: tagRel._id
            },
            {
              sort: { votedAt: -1 },
              limit: 1
            }
          ).fetch();
          
          if (firstVoteQuery.length > 0) {
            const firstVote = firstVoteQuery[0];
            
            if (!tagRel.createdAt) {
              changes.push({
                updateOne: {
                  filter: { _id: tagRel._id },
                  update: {
                    $set: {
                      createdAt: firstVote.votedAt,
                    }
                  }
                }
              });
            }
            if (!tagRel.userId) {
              changes.push({
                updateOne: {
                  filter: { _id: tagRel._id },
                  update: {
                    $set: {
                      userId: firstVote.userId,
                    }
                  }
                }
              });
            }
          }
        }
        
        if (changes.length > 0) {
          await TagRels.rawCollection().bulkWrite(changes, { ordered: false });
        }
      }
    });
    
    await forEachDocumentBatchInCollection({
      collection: Tags,
      batchSize: 1000,
      callback: async (tags: DbTag[]) => {
        // eslint-disable-next-line no-console
        console.log(`Filling createdAt and userId fields for ${tags.length} tags`);
        const changes: Array<any> = [];
        for (let tag of tags) {
          const firstTagRelQuery = await TagRels.find(
            {tagId: tag._id},
            {
              sort: {createdAt: -1},
              limit: 1
            }
          ).fetch();
          
          if (firstTagRelQuery.length > 0)
          {
            const firstTagRel = firstTagRelQuery[0];
            
            // If a tag does not have its `createdAt` and `userId` fields
            // populated, fill then in with the user and timestamp of the first
            // time something was tagged with it.
            if (!tag.createdAt && firstTagRel.createdAt) {
              changes.push({
                updateOne: {
                  filter: { _id: tag._id },
                  update: {
                    $set: {
                      createdAt: firstTagRel.createdAt,
                    }
                  }
                }
              });
            }
            if (!tag.userId && firstTagRel.userId) {
              changes.push({
                updateOne: {
                  filter: { _id: tag._id },
                  update: {
                    $set: {
                      userId: firstTagRel.userId,
                    }
                  }
                }
              });
            }
          }
        }
        
        if (changes.length > 0) {
          await Tags.rawCollection().bulkWrite(changes, { ordered: false });
          //for (let change of changes) console.log(JSON.stringify(change)); //DEBUG
        }
      }
    });
  }
});
