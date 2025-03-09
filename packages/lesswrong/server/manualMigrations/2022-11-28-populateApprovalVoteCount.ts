import { registerMigration, forEachDocumentBatchInCollection } from "./migrationUtils";
import { Comments } from "../../server/collections/comments/collection";
import { Votes } from "../../server/collections/votes/collection";

export default registerMigration({
  name: "populateApprovalVoteCount",
  dateWritten: "2022-11-28",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Comments,
      batchSize: 10,
      filter: {
        "extendedScore.agreementVoteCount": {$exists: true},
        "extendedScore.approvalVoteCount": {$exists: false},
      },
      callback: async (comments) => {
        await Promise.all(
          comments.map(async (comment: DbComment): Promise<void> => {
            const approvalVoteCount: number = await Votes.find({
              documentId: comment._id,
              cancelled: false,
              voteType: {$ne: "neutral"},
            }).count();
            await Comments.rawUpdateOne({_id: comment._id},
              {$set: {
                "extendedScore.approvalVoteCount": approvalVoteCount
              }}
            );
          })
        );
      }
    });
  }
});
