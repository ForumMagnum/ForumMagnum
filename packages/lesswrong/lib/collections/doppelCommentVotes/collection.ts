import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "@/lib/collectionUtils";
import { createCollection } from "@/lib/vulcan-lib";
import schema from "./schema";
import { ensureIndex } from "@/lib/collectionIndexUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users";

const DoppelCommentVotes: DoppelCommentVotesCollection = createCollection({
  collectionName: "DoppelCommentVotes",
  typeName: "DoppelCommentVote",
  schema,
  logChanges: true,
  resolvers: getDefaultResolvers('DoppelCommentVotes'),
  mutations: getDefaultMutations('DoppelCommentVotes', {
    newCheck: (user) => {
      if (!user) return false;
      return true;
    },
    editCheck: (user, document) => {
      if (!document) return false;
      return userOwns(user, document) || userIsAdmin(user);
    },
    removeCheck: _ => false
  }),
});

DoppelCommentVotes.checkAccess = async (user, document) =>
  userOwns(user, document) || userIsAdmin(user);

addUniversalFields({
  collection: DoppelCommentVotes,
});

ensureIndex(DoppelCommentVotes, { userId: 1, commentId: 1 }, { unique: true });

export default DoppelCommentVotes;
