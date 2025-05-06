import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

/**
 * If the action hasn't ended yet (either no endedAt, or endedAt in the future), it's active.
 */
const isCommentActionActive = (moderatorAction: DbCommentModeratorAction) => {
  return !moderatorAction.endedAt || moderatorAction.endedAt > new Date();
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  commentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  comment: {
    graphql: {
      outputType: "Comment",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Comments", fieldName: "commentId" }),
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        allowedValues: ["downvotedCommentAlert"],
      },
    },
  },
  endedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  active: {
    graphql: {
      outputType: "Boolean",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: (doc) => isCommentActionActive(doc),
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"CommentModeratorActions">>;

export default schema;
