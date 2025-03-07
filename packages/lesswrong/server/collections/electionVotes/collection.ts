import { createCollection } from "@/lib/vulcan-lib/collections";
import { isAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { isPastVotingDeadline, userCanVoteInDonationElection } from "@/lib/collections/electionVotes/helpers";
import schema from "@/lib/collections/electionVotes/schema";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ElectionVotes: ElectionVotesCollection = createCollection({
  collectionName: "ElectionVotes",
  typeName: "ElectionVote",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ElectionVotes', {electionName: 1});
    indexSet.addIndex('ElectionVotes', {electionName: 1, userId: 1}, {unique: true});
    return indexSet;
  },
  resolvers: getDefaultResolvers("ElectionVotes"),
  mutations: getDefaultMutations("ElectionVotes", {
    newCheck: (user: DbUser|null) => {
      if (!user) return false;
      if (isAdmin(user)) return true;

      if (!userCanVoteInDonationElection(user)) {
        throw new Error("Accounts created after 22nd Oct 2023 cannot vote in this election");
      }
      if (isPastVotingDeadline()) {
        throw new Error("Voting has closed");
      }

      return true;
    },
    editCheck: async (user: DbUser|null, document: DbElectionVote|null) => {
      if (!user || !document) return false;
      if (isAdmin(user)) return true;

      if (!userCanVoteInDonationElection(user)) {
        throw new Error("Accounts created after 22nd Oct 2023 cannot vote in this election");
      }
      if (isPastVotingDeadline()) {
        throw new Error("Voting has closed, you can no longer edit your vote");
      }
      if (userOwns(user, document)) return true;

      return false;
    },
  }),
  logChanges: true,
});


export default ElectionVotes;
