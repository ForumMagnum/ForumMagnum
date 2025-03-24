import { denormalizedCountOfReferences, accessFilterMultiple, schemaDefaultValue, getDenormalizedCountOfReferencesGetValue } from './utils/schemaUtils';
import { getWithLoader } from './loaders';
import { userIsAdminOrMod } from './vulcan-users/permissions';
import GraphQLJSON from 'graphql-type-json';

export type PermissionResult = {
  fail: false,
  reason?: never
} | {
  fail: true,
  reason: string
}

export interface CollectionVoteOptions {
  timeDecayScoresCronjob: boolean,
  /**
   * If set, the baseScore and extendedScore fields use this for permissions instead of their permissive default.
   */
  publicScoreOptions?: {
    canRead?: FieldPermissions 
  },
  userCanVoteOn?: (
    user: DbUser,
    document: DbVoteableType,
    voteType: string|null,
    extendedVote: any,
    context: ResolverContext,
  ) => PermissionResult|Promise<PermissionResult>,
}


export const currentUserVoteResolver = <N extends CollectionNameString>({ field, currentUserField, join }: SqlResolverArgs<N>) => join({
  table: "Votes",
  type: "left",
  on: {
    userId: currentUserField("_id"),
    documentId: field("_id"),
    cancelled: "FALSE",
  },
  resolver: (votesField) => votesField("voteType"),
});

export const currentUserExtendedVoteResolver = <N extends CollectionNameString>({ field, currentUserField, join }: SqlResolverArgs<N>) => join({
  table: "Votes",
  type: "left",
  on: {
    userId: currentUserField("_id"),
    documentId: field("_id"),
    cancelled: "FALSE",
  },
  resolver: (votesField) => votesField("extendedVoteType"),
});

export const DEFAULT_CURRENT_USER_VOTE_FIELD = {
  graphql: {
    outputType: "String",
    canRead: ["guests"],
    resolver: async (document, args, context) => {
      const votes = await getCurrentUserVotes(document, context);
      if (!votes.length) return null;
      return votes[0].voteType ?? null;
    },
    sqlResolver: currentUserVoteResolver,
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD = {
  graphql: {
    outputType: "JSON",
    canRead: ["guests"],
    resolver: async (document, args, context) => {
      const votes = await getCurrentUserVotes(document, context);
      if (!votes.length) return null;
      return votes[0].extendedVoteType || null;
    },
    sqlResolver: currentUserExtendedVoteResolver,
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

// This has an inlined collection name in the `getValue` filter function, so unfortunately it needs to be a function.
export function defaultVoteCountField<N extends VoteableCollectionName>(collectionName: N) {
  const filterFn = (vote: DbVote) => !vote.cancelled && vote.voteType !== "neutral" && vote.collectionName === collectionName;

  const fieldSpec = {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 0,
      denormalized: true,
      canAutoDenormalize: true,
      canAutofillDefault: true,
      getValue: getDenormalizedCountOfReferencesGetValue({
        collectionName: collectionName,
        fieldName: "voteCount",
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn,
      }),
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      onCreate: () => 0,
      countOfReferences: {
        foreignCollectionName: "Votes",
        foreignFieldName: "documentId",
        filterFn,
        resyncElastic: false,
      },
      validation: {
        optional: true,
      },
    },
  } satisfies NewCollectionFieldSpecification<N>;

  return fieldSpec;
}

export const DEFAULT_BASE_SCORE_FIELD = {
  database: {
    type: "DOUBLE PRECISION",
    defaultValue: 0,
    canAutofillDefault: true,
    nullable: false,
  },
  graphql: {
    outputType: "Float",
    canRead: ["guests"],
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const DEFAULT_EXTENDED_SCORE_FIELD = {
  database: {
    type: "JSONB",
  },
  graphql: {
    outputType: GraphQLJSON,
    canRead: ["guests"],
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const DEFAULT_SCORE_FIELD = {
  database: {
    type: "DOUBLE PRECISION",
    defaultValue: 0,
    canAutofillDefault: true,
    nullable: false,
  },
  graphql: {
    outputType: "Float",
    canRead: ["guests"],
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const DEFAULT_INACTIVE_FIELD = {
  database: {
    type: "BOOL",
    defaultValue: false,
    canAutofillDefault: true,
    nullable: false,
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const DEFAULT_AF_BASE_SCORE_FIELD = {
  database: {
    type: "DOUBLE PRECISION",
  },
  graphql: {
    outputType: "Float",
    canRead: ["guests"],
    validation: {
      optional: true,
    },
  },
  form: {
    label: "Alignment Base Score",
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const DEFAULT_AF_EXTENDED_SCORE_FIELD = {
  database: {
    type: "JSONB",
  },
  graphql: {
    outputType: GraphQLJSON,
    canRead: ["guests"],
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const DEFAULT_AF_VOTE_COUNT_FIELD = {
  database: {
    type: "DOUBLE PRECISION",
  },
  graphql: {
    outputType: "Float",
    canRead: ["guests"],
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<VoteableCollectionName>;

export const getVoteableSchemaFields = <N extends VoteableCollectionName>(
  collectionName: N,
  options: Pick<CollectionVoteOptions, 'publicScoreOptions'> = {},
): SchemaType<N> => {
  options = options || {}
  const { publicScoreOptions = {} } = options

  return {
    currentUserVote: {
      type: String,
      optional: true,
      canRead: ['guests'],
      resolveAs: {
        type: 'String',
        resolver: async (document: ObjectsByCollectionName[N], args: void, context: ResolverContext): Promise<string|null> => {
          const votes = await getCurrentUserVotes(document, context);
          if (!votes.length) return null;
          return votes[0].voteType ?? null;
        },
        sqlResolver: currentUserVoteResolver,
      },
    },
    
    currentUserExtendedVote: {
      type: GraphQLJSON,
      optional: true,
      canRead: ['guests'],
      resolveAs: {
        type: GraphQLJSON,
        resolver: async (document: ObjectsByCollectionName[N], args: void, context: ResolverContext): Promise<string|null> => {
          const votes = await getCurrentUserVotes(document, context);
          if (!votes.length) return null;
          return votes[0].extendedVoteType || null;
        },
        sqlResolver: currentUserExtendedVoteResolver,
      },
    },

    /**
     * @deprecated (but preserved for backwards compatibility): Returns an array
     * of vote objects, if the user has voted (or an empty array otherwise).
     */
    currentUserVotes: {
      type: Array,
      optional: true,
      canRead: ['guests'],
      resolveAs: {
        type: '[Vote]',
        resolver: async (document: ObjectsByCollectionName[N], args: void, context: ResolverContext): Promise<Partial<DbVote>[]> => {
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
        resolver: async (document: ObjectsByCollectionName[N], args: void, context: ResolverContext): Promise<Partial<DbVote>[]> => {
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
        collectionName: collectionName,
        foreignCollectionName: "Votes",
        foreignTypeName: "vote",
        foreignFieldName: "documentId",
        filterFn: (vote: DbVote) => !vote.cancelled && vote.voteType !== 'neutral' && vote.collectionName === collectionName
      }),
      canRead: ['guests'],
    },
    // The document's base score (not factoring in the document's age)
    baseScore: {
      type: Number,
      optional: true,
      canRead: ['guests'],
      ...schemaDefaultValue(0),
      ...publicScoreOptions,
    },
    extendedScore: {
      type: GraphQLJSON,
      optional: true,
      canRead: ['guests'],
      ...publicScoreOptions,
    },
    // The document's current score (factoring in age)
    score: {
      type: Number,
      optional: true,
      ...schemaDefaultValue(0),
      canRead: ['guests'],
    },
    // Whether the document is inactive. Inactive documents see their score
    // recalculated less often
    inactive: {
      type: Boolean,
      optional: true,
      ...schemaDefaultValue(false),
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
  };
}

export async function getCurrentUserVotes<T extends DbVoteableType>(document: T, context: ResolverContext): Promise<Partial<DbVote>[]> {
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
  return await accessFilterMultiple(currentUser, 'Votes', votes, context);
}

export async function getAllVotes<T extends DbVoteableType>(document: T, context: ResolverContext): Promise<Partial<DbVote>[]> {
  const { Votes, currentUser } = context;
  const votes = await getWithLoader(context, Votes,
    "votesByDocument",
    {
      cancelled: false,
    },
    "documentId", document._id
  );
  
  if (!votes.length) return [];
  return await accessFilterMultiple(currentUser, 'Votes', votes, context);
}
