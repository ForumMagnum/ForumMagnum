import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";
import { userCanAccessTypoSuggestion } from "./helpers";

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
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  collectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanAccessTypoSuggestion],
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
      canRead: [userCanAccessTypoSuggestion],
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
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  reactor: {
    graphql: {
      outputType: "User",
      canRead: [userCanAccessTypoSuggestion],
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
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  author: {
    graphql: {
      outputType: "User",
      canRead: [userCanAccessTypoSuggestion],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "authorId" }),
    },
  },

  /**
   * The rendered-text form of the span the reactor selected. Captured from the
   * DOM selection (so inline markdown markers like `**`, `_`, `` ` ``, `~` are
   * absent) and immutable after insert. Backs the cross-user dedup unique
   * index `(documentId, fieldName, quote)`: as long as two reactors highlight
   * the same visible span, they collide on the same key.
   *
   * Apply-time matching uses `llmCanonicalQuote` instead — the LLM's verdict
   * may pick a sub-span of the reactor's selection, and that sub-span is in
   * markdown form (it's matched against the markdown-form document text).
   */
  quote: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  /**
   * The markdown-form span returned by the LLM as the typo to fix. May be a
   * sub-span of `quote` (e.g. just the misspelled word). Set when the LLM
   * verdict is `fix_typo`; null otherwise. The apply path matches against
   * this field, not `quote`, because document edits are computed in markdown
   * coordinates.
   */
  llmCanonicalQuote: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  proposedReplacement: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  narrowedQuote: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  narrowedReplacement: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  explanation: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  llmVerdict: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  status: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userCanAccessTypoSuggestion],
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
      canRead: [userCanAccessTypoSuggestion],
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
      canRead: [userCanAccessTypoSuggestion],
    },
  },

  resolvedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userCanAccessTypoSuggestion],
    },
  },

} satisfies Record<string, CollectionFieldSpecification<"TypoSuggestions">>;

export default schema;
