import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "../../collectionUtils";
import { makeVoteable } from "../../make_voteable";
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

export default ElectionVotes;
