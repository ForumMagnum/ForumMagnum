import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

const ElectionCandidates: ElectionCandidatesCollection = createCollection({
  collectionName: "ElectionCandidates",
  typeName: "ElectionCandidate",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('ElectionCandidates', {electionName: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers("ElectionCandidates"),
  mutations: getDefaultMutations("ElectionCandidates"),
  logChanges: true,
  voteable: {
    timeDecayScoresCronjob: false,
  },
});

export default ElectionCandidates;
