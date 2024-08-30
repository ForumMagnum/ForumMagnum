import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "./schema";

const DoppelCommentVotes: DoppelCommentVotesCollection = createCollection({
  collectionName: "DoppelCommentVotes",
  typeName: "DoppelCommentVote",
  schema,
  logChanges: true,
  resolvers: getDefaultResolvers('DoppelCommentVotes'),
  mutations: getDefaultMutations('DoppelCommentVotes'),
});

addUniversalFields({
  collection: DoppelCommentVotes,
});

export default DoppelCommentVotes;
