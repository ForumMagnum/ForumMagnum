import { addFieldsDict, denormalizedCountOfReferences, accessFilterMultiple } from './utils/schemaUtils'
import { getWithLoader } from './loaders'
import { userIsAdminOrMod } from './vulcan-users/permissions';
import GraphQLJSON from 'graphql-type-json';

export type PermissionResult = {
  fail: false,
  reason?: never
} | {
  fail: true,
  reason: string
}

interface CollectionVoteOptions {
  timeDecayScoresCronjob: boolean,
  customBaseScoreReadAccess?: (user: DbUser|null, object: any) => boolean
  userCanVoteOn?: (
    user: DbUser,
    document: DbVoteableType,
    voteType: string|null,
    extendedVote: any,
    context: ResolverContext,
  ) => PermissionResult|Promise<PermissionResult>,
}

export const VoteableCollections: Array<CollectionBase<DbVoteableType>> = [];
export const VoteableCollectionOptions: Partial<Record<CollectionNameString,CollectionVoteOptions>> = {};

export const collectionIsVoteable = (collectionName: CollectionNameString): boolean => {
  for (let collection of VoteableCollections) {
    if (collectionName === collection.collectionName)
      return true;
  }
  return false;
}

export const apolloCacheVoteablePossibleTypes = () => {
  return {
    Voteable: VoteableCollections.map(collection => collection.typeName),
  }
}

// options: {
//   customBaseScoreReadAccess: baseScore can have a customized canRead value.
//     Option will be bassed directly to the canRead key
// }
export const makeVoteable = <T extends DbVoteableType>(collection: CollectionBase<T>, options: CollectionVoteOptions): void => {
  options = options || {}
  const {customBaseScoreReadAccess} = options

  VoteableCollections.push(collection);
  VoteableCollectionOptions[collection.collectionName] = options;

  addFieldsDict(collection, {
    currentUserVote: {
      type: String,
      optional: true,
      canRead: ['guests'],
      resolveAs: {
        type: 'String',
        resolver: async (document: T, args: void, context: ResolverContext): Promise<string|null> => {
          const votes = await getCurrentUserVotes(document, context);
          if (!votes.length) return null;
          return votes[0].voteType;
        }
      }
    },
    
    currentUserExtendedVote: {
      type: GraphQLJSON,
      optional: true,
      canRead: ['guests'],
      resolveAs: {
        type: GraphQLJSON,
        resolver: async (document: T, args: void, context: ResolverContext): Promise<string|null> => {
          const votes = await getCurrentUserVotes(document, context);
          if (!votes.length) return null;
          return votes[0].extendedVoteType || null;
        }
      },
    },
    
    // DEPRECATED (but preserved for backwards compatibility): Returns an array
    // of vote objects, if the user has voted (or an empty array otherwise).
    currentUserVotes: {
      type: Array,
      optional: true,
      canRead: ['guests'],
      resolveAs: {
        type: '[Vote]',
        resolver: async (document: T, args: void, context: ResolverContext): Promise<Array<DbVote>> => {
          return await getCurrentUserVotes(document, context);
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
      canRead: ['guests'],
      resolveAs: {
        type: '[Vote]',
        resolver: async (document: T, args: void, context: ResolverContext): Promise<Array<DbVote>> => {
          const { currentUser } = context;
          if (userIsAdminOrMod(currentUser)) {
            return await getAllVotes(document, context);
          } else {
            return await getCurrentUserVotes(document, context);
          }
        },
      }
    },
    'allVotes.$': {
      type: Object,
      optional: true
    },
    voteCount: {
      ...denormalizedCountOfReferences({
        fieldName: "voteCount",
        collectionName: collection.collectionName,
        foreignCollectionName: "Votes",
        foreignTypeName: "vote",
        foreignFieldName: "documentId",
        filterFn: (vote: DbVote) => !vote.cancelled && vote.collectionName===collection.collectionName
      }),
      canRead: ['guests'],
    },
    // The document's base score (not factoring in the document's age)
    baseScore: {
      type: Number,
      optional: true,
      defaultValue: 0,
      canRead: customBaseScoreReadAccess || ['guests'],
      onInsert: (document: DbInsertion<T>): number => {
        // default to 0 if empty
        return document.baseScore || 0;
      }
    },
    extendedScore: {
      type: GraphQLJSON,
      optional: true,
      canRead: customBaseScoreReadAccess || ['guests'],
    },
    // The document's current score (factoring in age)
    score: {
      type: Number,
      optional: true,
      defaultValue: 0,
      canRead: ['guests'],
      onInsert: (document: DbInsertion<T>): number => {
        // default to 0 if empty
        return document.score || 0;
      }
    },
    // Whether the document is inactive. Inactive documents see their score
    // recalculated less often
    inactive: {
      type: Boolean,
      optional: true,
      onInsert: () => false
    },
    afBaseScore: {
      type: Number,
      optional: true,
      label: "Alignment Base Score",
      canRead: ['guests'],
    },
    afExtendedScore: {
      type: GraphQLJSON,
      optional: true,
      canRead: ['guests'],
    },
    afVoteCount: {
      type: Number,
      optional: true,
      canRead: ['guests'],
    },
  });
}

async function getCurrentUserVotes<T extends DbVoteableType>(document: T, context: ResolverContext): Promise<Array<DbVote>> {
  const { Votes, currentUser } = context;
  if (!currentUser) return [];
  const votes = await getWithLoader(context, Votes,
    `votesByUser${currentUser._id}`,
    {
      userId: currentUser._id,
      cancelled: false,
    },
    "documentId", document._id
  );
  
  if (!votes.length) return [];
  return await accessFilterMultiple(currentUser, Votes, votes, context);
}

async function getAllVotes<T extends DbVoteableType>(document: T, context: ResolverContext): Promise<Array<DbVote>> {
  const { Votes, currentUser } = context;
  const votes = await getWithLoader(context, Votes,
    "votesByDocument",
    {
      cancelled: false,
    },
    "documentId", document._id
  );
  
  if (!votes.length) return [];
  return await accessFilterMultiple(currentUser, Votes, votes, context);
}

