// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "../../utils/schemaUtils";

// Deny all permissions on these objects - they're only used internally
const commonFields = () => ({
  canRead: () => false,
  canCreate: () => false,
  canUpdate: () => false,
  hidden: true,
  optional: false,
  nullable: false,
});

const schema: Record<string, NewCollectionFieldSpecification<"SideCommentCaches">> = {
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
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: () => false,
      canUpdate: () => false,
      canCreate: () => false,
    },
  },
  post: {
    graphql: {
      type: "Post!",
      canRead: canRead,
      resolver: generateIdResolverSingle({ collectionName: "SideCommentCaches", fieldName: "postId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  annotatedHtml: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: () => false,
      canUpdate: () => false,
      canCreate: () => false,
    },
  },
  commentsByBlock: {
    database: {
      type: "JSONB",
      nullable: false,
    },
    graphql: {
      type: "JSON",
      canRead: () => false,
      canUpdate: () => false,
      canCreate: () => false,
    },
  },
  version: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: () => false,
      canUpdate: () => false,
      canCreate: () => false,
    },
  },
};

export default schema;
