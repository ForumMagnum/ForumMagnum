import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';
import { TagRels } from '../../lib/collections/tagrels/collection';

registerMigration({
  name: "onlyAdminsCanVoteOnCommunityTopic",
  dateWritten: "2022-07-15",
  idempotent: true,
  action: async () => {
    const canVote = ["admins"];

    const communityTag = await Tags.findOne({ slug: "community" });
    if (!communityTag) {
      throw new Error("Cannot find community tag");
    }

    await Tags.rawUpdateOne({ _id: communityTag._id }, { $set: { canVoteOnRels: canVote } });

    await forEachDocumentBatchInCollection({
      collection: TagRels,
      batchSize: 1000,
      filter: {
        tagId: communityTag._id
      },
      callback: async (tagrels: Array<DbTagRel>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating TagRel batch");
        const changes = tagrels.map(({ _id }) => {
          return {
            updateOne: {
              filter: { _id },
              update: {$set: {canVote}},
            }
          };
        });
        await TagRels.rawCollection().bulkWrite(changes, { ordered: false });
      },
    });
  },
});
