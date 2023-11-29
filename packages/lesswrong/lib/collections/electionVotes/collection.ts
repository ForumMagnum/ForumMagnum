import { ensureIndex } from "../../collectionIndexUtils";
import { addUniversalFields, getDefaultMutations, getDefaultResolvers } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib";
import { isAdmin, userOwns } from "../../vulcan-users/permissions";
import { isPastAccountCreationDeadline, isPastVotingDeadline } from "./helpers";
import schema from "./schema";

const ElectionVotes: ElectionVotesCollection = createCollection({
  collectionName: "ElectionVotes",
  typeName: "ElectionVote",
  collectionType: "pg",
  schema,
  resolvers: getDefaultResolvers("ElectionVotes"),
  mutations: getDefaultMutations("ElectionVotes", {
    newCheck: (user: DbUser|null) => {
      if (!user) return false;
      if (isAdmin(user)) return true;

      if (isPastAccountCreationDeadline(user)) return false;
      if (isPastVotingDeadline()) return false;

      return true;
    },
    editCheck: async (user: DbUser|null, document: DbElectionVote|null) => {
      if (!user || !document) return false;
      if (isAdmin(user)) return true;

      if (isPastAccountCreationDeadline(user)) return false;
      if (isPastVotingDeadline()) return false;
      if (userOwns(user, document)) return true;

      return false;
    },
  }),
  logChanges: true,
});

addUniversalFields({
  collection: ElectionVotes,
});

ensureIndex(ElectionVotes, {electionName: 1, userId: 1}, {unique: true});

export default ElectionVotes;
