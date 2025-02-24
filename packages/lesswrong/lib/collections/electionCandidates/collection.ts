import { makeVoteable } from "../../make_voteable";
import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

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
