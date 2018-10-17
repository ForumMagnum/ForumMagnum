import { Votes } from "meteor/vulcan:voting";
import { VoteableCollections } from 'meteor/vulcan:voting';
import { getWithLoader } from "../../loaders.js";

Votes.addField([
  {
    fieldName: "afPower",
    fieldSchema: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
    }
  }
]);

VoteableCollections.forEach(collection => {
  // Replace currentUserVotes and allVotes resolvers with our own
  // implementations. The default implementations from vulcan-voting don't
  // have batching, which makes them veeeery slow when applied to votes on
  // comments.
  collection.removeField(["currentUserVotes", "currentUserVotes.$"]);
  collection.removeField(["allVotes", "allVotes.$"]);
  collection.addField([
    {
      fieldName: 'currentUserVotes',
      fieldSchema: {
        type: Array,
        optional: true,
        viewableBy: ['guests'],
        resolveAs: {
          type: '[Vote]',
          resolver: async (document, args, { Users, Votes, currentUser }) => {
            if (!currentUser) return [];
            const votes = await getWithLoader(Votes, `votesByUser${currentUser._id}`, {userId: currentUser._id}, "documentId", document._id);
            if (!votes.length) return [];
            return Users.restrictViewableFields(currentUser, Votes, votes);
          },
        }
      }
    },
    {
      fieldName: 'currentUserVotes.$',
      fieldSchema: {
        type: Object,
        optional: true
      }
    },
    {
      fieldName: 'allVotes',
      fieldSchema: {
        type: Array,
        optional: true,
        viewableBy: ['guests'],
        resolveAs: {
          type: '[Vote]',
          resolver: async (document, args, { Users, Votes, currentUser }) => {
            const votes = await getWithLoader(Votes, "votesByDocument", {}, "documentId", document._id)
            if (!votes.length) return [];
            return Users.restrictViewableFields(currentUser, Votes, votes);
          },
        }
      }
    },
    {
      fieldName: 'allVotes.$',
      fieldSchema: {
        type: Object,
        optional: true
      }
    },
    {
      fieldName: 'voteCount',
      fieldSchema: {
        type: Number,
        optional: true,
        viewableBy: ['guests'],
        resolveAs: {
          type: 'Int',
          resolver: async (document, args, { Users, Votes, currentUser }) => {
            const votes = await getWithLoader(Votes, "votesByDocument", {}, "documentId", document._id)
            return votes.length;
          }
        }
      }
    }
  ]);
});
