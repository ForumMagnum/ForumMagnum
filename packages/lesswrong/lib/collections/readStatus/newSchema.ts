// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "@/lib/utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"ReadStatuses">> = {
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
    },
    graphql: {
      type: "String",
    },
  },
  post: {
    graphql: {
      type: "Post",
      resolver: generateIdResolverSingle({ collectionName: "ReadStatuses", fieldName: "postId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  tagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
    },
    graphql: {
      type: "String",
    },
  },
  tag: {
    graphql: {
      type: "Tag",
      resolver: generateIdResolverSingle({ collectionName: "ReadStatuses", fieldName: "tagId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      type: "String",
    },
  },
  user: {
    graphql: {
      type: "User!",
      resolver: generateIdResolverSingle({ collectionName: "ReadStatuses", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  isRead: {
    database: {
      type: "BOOL",
      nullable: false,
    },
    graphql: {
      type: "Boolean",
    },
  },
  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
    },
  },
};

export default schema;
