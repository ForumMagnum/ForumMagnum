import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ElectionVotes: ElectionVotesCollection = createCollection({
  collectionName: "ElectionVotes",
  typeName: "ElectionVote",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ElectionVotes', {electionName: 1});
    indexSet.addIndex('ElectionVotes', {electionName: 1, userId: 1}, {unique: true});
    return indexSet;
  },
  logChanges: true,
});


export default ElectionVotes;
