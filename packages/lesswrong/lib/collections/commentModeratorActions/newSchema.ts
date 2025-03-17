// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "../../utils/schemaUtils";
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

const schema: Record<string, NewCollectionFieldSpecification<"CommentModeratorActions">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  commentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Comments",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  comment: {
    graphql: {
      type: "Comment!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({
        collectionName: "CommentModeratorActions",
        fieldName: "commentId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
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
      type: "Date",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
    form: {
      control: "datetime",
    },
  },
  active: {
    graphql: {
      type: "Boolean!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: (doc) => isCommentActionActive(doc),
    },
  },
};

export default schema;
