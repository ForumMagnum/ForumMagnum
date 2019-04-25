import { Votes } from './collection.js';
import { VoteableCollections } from '../../modules/make_voteable.js';
import { getWithLoader } from "../../loaders.js";
import { addFieldsDict } from '../../modules/utils/schemaUtils'

addFieldsDict(Votes, {
  afPower: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
  }
});

VoteableCollections.forEach(collection => {
  addFieldsDict(collection, {
    currentUserVotes: {
      type: Array,
      optional: true,
      viewableBy: ['guests'],
      resolveAs: {
        type: '[Vote]',
        resolver: async (document, args, { Users, Votes, currentUser }) => {
          if (!currentUser) return [];
          const votes = await getWithLoader(Votes,
            `votesByUser${currentUser._id}`,
            {
              userId: currentUser._id,
              cancelled: false,
            },
            "documentId", document._id
          );
          
          if (!votes.length) return [];
          return Users.restrictViewableFields(currentUser, Votes, votes);
        },
      }
    },
    'currentUserVotes.$': {
      type: Object,
      optional: true
    },
    allVotes: {
      type: Array,
      optional: true,
      viewableBy: ['guests'],
      resolveAs: {
        type: '[Vote]',
        resolver: async (document, args, { Users, Votes, currentUser }) => {
          const votes = await getWithLoader(Votes,
            "votesByDocument",
            {
              cancelled: false,
            },
            "documentId", document._id
          );
          
          if (!votes.length) return [];
          return Users.restrictViewableFields(currentUser, Votes, votes);
        },
      }
    },
    'allVotes.$': {
      type: Object,
      optional: true
    },
    voteCount: {
      type: Number,
      optional: true,
      viewableBy: ['guests'],
    }
  });
});
