import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getDenormalizedEditableResolver } from "@/lib/editor/make_editable";
import { RevisionStorageType } from "../revisions/revisionSchemaTypes";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userIsAdminOrMod, userOwns } from "@/lib/vulcan-users/permissions";
import { DEFAULT_BASE_SCORE_FIELD, DEFAULT_EXTENDED_SCORE_FIELD, DEFAULT_SCORE_FIELD, DEFAULT_CURRENT_USER_VOTE_FIELD, DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD, defaultVoteCountField, getAllVotes, getCurrentUserVotes, DEFAULT_INACTIVE_FIELD, DEFAULT_AF_BASE_SCORE_FIELD, DEFAULT_AF_EXTENDED_SCORE_FIELD, DEFAULT_AF_VOTE_COUNT_FIELD } from "@/lib/make_voteable";
import { getVotingSystemNameForDocument } from "../comments/helpers";
import { customBaseScoreReadAccess } from "../comments/voting";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: {
    database: DEFAULT_CREATED_AT_FIELD.database,
    graphql: {
      ...DEFAULT_CREATED_AT_FIELD.graphql,
      outputType: "Date",
      canRead: ["members"],
    },
  },
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  contents: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      inputType: "CreateRevisionDataInput",
      canRead: ["members"],
      canUpdate: userOwns,
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Messages", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
  },
  contents_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["members"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  conversationId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Conversations",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  conversation: {
    graphql: {
      outputType: "Conversation",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Conversations", fieldName: "conversationId" }),
    },
  },
  noEmail: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  currentUserVote: DEFAULT_CURRENT_USER_VOTE_FIELD,
  currentUserExtendedVote: DEFAULT_CURRENT_USER_EXTENDED_VOTE_FIELD,
  allVotes: {
    graphql: {
      outputType: "[Vote!]",
      canRead: ["guests"],
      resolver: async (document, args, context) => {
        const { currentUser } = context;
        if (userIsAdminOrMod(currentUser)) {
          return await getAllVotes(document, context);
        } else {
          return await getCurrentUserVotes(document, context);
        }
      },
    },
  },
  voteCount: defaultVoteCountField('Messages'),
  baseScore: {
    ...DEFAULT_BASE_SCORE_FIELD,
    graphql: {
      ...DEFAULT_BASE_SCORE_FIELD.graphql,
      outputType: "Float",
    },
  },
  extendedScore: {
    ...DEFAULT_EXTENDED_SCORE_FIELD,
    graphql: {
      ...DEFAULT_EXTENDED_SCORE_FIELD.graphql
    },
  },
  score: DEFAULT_SCORE_FIELD,
  inactive: DEFAULT_INACTIVE_FIELD,
  afBaseScore: {
    ...DEFAULT_AF_BASE_SCORE_FIELD,
    graphql: {
      ...DEFAULT_AF_BASE_SCORE_FIELD.graphql
    },
  },
  afExtendedScore: {
    ...DEFAULT_AF_EXTENDED_SCORE_FIELD,
    graphql: {
      ...DEFAULT_AF_EXTENDED_SCORE_FIELD.graphql
    },
  },
  afVoteCount: DEFAULT_AF_VOTE_COUNT_FIELD,
} satisfies Record<string, CollectionFieldSpecification<"Messages">>;

export default schema;
