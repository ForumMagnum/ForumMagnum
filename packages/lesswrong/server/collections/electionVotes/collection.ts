import schema from '@/lib/collections/electionVotes/newSchema';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

export const ElectionVotes = createCollection({
  collectionName: "ElectionVotes",
  typeName: "ElectionVote",
  schema,
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ElectionVotes', {electionName: 1});
    indexSet.addIndex('ElectionVotes', {electionName: 1, userId: 1}, {unique: true});
    return indexSet;
  },
});


export default ElectionVotes;
