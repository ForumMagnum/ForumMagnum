import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

const ElectionCandidates: ElectionCandidatesCollection = createCollection({
  collectionName: "ElectionCandidates",
  typeName: "ElectionCandidate",
  schema,
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
