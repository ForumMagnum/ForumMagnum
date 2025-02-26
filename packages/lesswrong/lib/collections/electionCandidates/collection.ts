import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
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

addUniversalFields({
  collection: ElectionCandidates,
});

export default ElectionCandidates;
