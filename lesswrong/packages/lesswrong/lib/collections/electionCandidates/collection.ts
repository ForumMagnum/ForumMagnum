import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "../../collectionUtils";
import { makeVoteable } from "../../make_voteable";
import { createCollection } from "../../vulcan-lib";
import schema from "./schema";

const ElectionCandidates: ElectionCandidatesCollection = createCollection({
  collectionName: "ElectionCandidates",
  typeName: "ElectionCandidate",
  schema,
  resolvers: getDefaultResolvers("ElectionCandidates"),
  mutations: getDefaultMutations("ElectionCandidates"),
  logChanges: true,
});

addUniversalFields({
  collection: ElectionCandidates,
});

makeVoteable(ElectionCandidates, {
  timeDecayScoresCronjob: false,
});

export default ElectionCandidates;
