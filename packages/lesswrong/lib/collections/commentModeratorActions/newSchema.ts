// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

export const DOWNVOTED_COMMENT_ALERT = "downvotedCommentAlert";

export const COMMENT_MODERATOR_ACTION_TYPES = {
  [DOWNVOTED_COMMENT_ALERT]: "Downvoted Comment",
};

/**
 * If the action hasn't ended yet (either no endedAt, or endedAt in the future), it's active.
 */
export const isCommentActionActive = (moderatorAction: DbCommentModeratorAction) => {
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
      outputType: "Comment!",
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
    form: {
      options: () =>
        Object.entries(COMMENT_MODERATOR_ACTION_TYPES).map(([value, label]) => ({
          value,
          label,
        })),
      control: "select",
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
    form: {
      control: "datetime",
    },
  },
  active: {
    graphql: {
      outputType: "Boolean!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: (doc) => isCommentActionActive(doc),
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"CommentModeratorActions">>;

export default schema;
