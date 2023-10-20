import { registerMigration, forEachDocumentInCollection } from './migrationUtils';
import { Revisions } from '../../lib/collections/revisions/collection';
import { Users } from '../../lib/collections/users/collection';
import { performVoteServer } from '../voteServer';

registerMigration({
  name: "selfVoteOnTagRevisions",
  dateWritten: "2021-05-09",
  idempotent: true,
  action: async () => {
    const usersCache: Record<string,DbUser> = {};
    
    await forEachDocumentInCollection({
      collection: Revisions,
      filter: {collectionName: "Tags", fieldName: "description"},
      callback: async (revision: DbRevision) => {
        const userId = revision.userId;
        if (!userId) return;
        if (!(userId in usersCache)) {
          usersCache[userId] = (await Users.findOne({_id:userId}))!;
        }
        const user = usersCache[userId];
        
        await performVoteServer({ document: revision, voteType: 'smallUpvote', collection: Revisions, user, toggleIfAlreadyVoted: false, skipRateLimits: true });
      }
    });
  }
});
