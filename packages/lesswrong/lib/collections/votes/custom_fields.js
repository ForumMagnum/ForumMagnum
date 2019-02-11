import { Votes } from './collection.js';
import { VoteableCollections } from '../../modules/make_voteable.js';
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
            const votes = await getWithLoader(Votes, "votesByDocument",
              // Base query
              {},
              // Selector
              "documentId", document._id,
              // Projection
              {documentId:1}
            )
            return votes.length;
          }
        }
      }
    }
  ]);
});



/* From vulcan:voting, but not currently used.
Users.addField([
  // An array containing votes
  {
    fieldName: 'votes',
    fieldSchema: {
      type: Array,
      optional: true,
      canRead: Users.owns,
      resolveAs: {
        type: '[Vote]',
        arguments: 'collectionName: String',
        resolver: async (user, args, context) => {8
      },
    }
  },
  {
    fieldName: 'votes.$',
    fieldSchema: {
      type: Object,
      optional: true
    }
  },
]);*/