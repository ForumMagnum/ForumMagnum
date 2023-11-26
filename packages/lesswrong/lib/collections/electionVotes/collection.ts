import { ensureIndex } from "../../collectionIndexUtils";
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib";
import schema from "./schema";

const ElectionVotes: ElectionVotesCollection = createCollection({
  collectionName: "ElectionVotes",
  typeName: "ElectionVote",
  collectionType: "pg",
  schema,
  resolvers: getDefaultResolvers("ElectionVotes"),
  mutations: getDefaultMutations("ElectionVotes"),
  logChanges: true,
});

addUniversalFields({
  collection: ElectionVotes,
});

ensureIndex(ElectionVotes, {electionName: 1, userId: 1}, {unique: true});

export default ElectionVotes;
