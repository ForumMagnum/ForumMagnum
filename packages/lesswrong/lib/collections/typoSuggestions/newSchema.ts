import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";

function userCanReadTypoSuggestion(user: DbUser | UsersCurrent | null, suggestion: DbTypoSuggestion): boolean {
  if (!user) return false;
  if (userIsAdmin(user)) return true;
  return user._id === suggestion.authorId;
}

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  documentId: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  collectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  fieldName: {
    database: {
      type: "TEXT",
      nullable: false,
      defaultValue: "contents",
      canAutofillDefault: true,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  voteId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Votes",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  reactor: {
    graphql: {
      outputType: "User",
      canRead: [userCanReadTypoSuggestion],
      resolver: async (suggestion, _args, context) => {
        const vote = await context.loaders.Votes.load(suggestion.voteId);
        if (!vote) return null;
        return await context.loaders.Users.load(vote.userId);
      },
    },
  },

  authorId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  author: {
    graphql: {
      outputType: "User",
      canRead: [userCanReadTypoSuggestion],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "authorId" }),
    },
  },

  quote: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  proposedReplacement: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  narrowedQuote: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  narrowedReplacement: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  explanation: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  llmVerdict: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  status: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  resolvedByUserId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  appliedRevisionId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Revisions",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  resolvedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userCanReadTypoSuggestion],
    },
  },

  /**
   * For posts: true if applying the suggestion via mode: "APPLY" would
   * publish unrelated unpublished changes the author has been working on
   * in the editor (autosaves, drafts of new content). The hover uses this
   * to disable the Apply button (and surface a tooltip explaining why)
   * while keeping "Open in editor" available, since the suggest path
   * doesn't trigger a publish.
   *
   * Heuristic: the post's YjsDocument has been updated more recently
   * than its latest Revision was saved. False for comments, since
   * comments don't have a draft/published distinction.
   */
  applyWouldRequirePublishingUnrelatedChanges: {
    graphql: {
      outputType: "Boolean!",
      canRead: [userCanReadTypoSuggestion],
      resolver: async (suggestion, _args, context) => {
        if (suggestion.collectionName !== "Posts") return false;
        // Project to just the timestamp fields — Revisions rows in particular
        // carry the full document HTML, which we don't need.
        const [yjsDoc, latestRev] = await Promise.all([
          context.YjsDocuments.findOne(
            { documentId: suggestion.documentId },
            undefined,
            { _id: 1, updatedAt: 1 },
          ),
          context.Revisions.findOne(
            { documentId: suggestion.documentId, fieldName: suggestion.fieldName },
            { sort: { editedAt: -1 } },
            { _id: 1, editedAt: 1 },
          ),
        ]);
        if (!yjsDoc || !latestRev) return false;
        return yjsDoc.updatedAt.getTime() > latestRev.editedAt.getTime();
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"TypoSuggestions">>;

export default schema;
