// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "../../utils/schemaUtils";

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  updatedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The start of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowStart: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The end of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowEnd: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The post being viewed */
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
  },
  post: {
    // postId used to be a foreignKeyField, which might be why we have a resolver with no canRead permissions?
    graphql: {
      outputType: "Post!",
      canRead: [],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  /** The number of views on the post in the given window, including duplicates from the same user */
  viewCount: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
  },
  /**
   * The number of unique (by clientId) views on the post in the given window. Note that this is still
   * only for the given day, so views by the same user on different days will still be double counted
   */
  uniqueViewCount: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"PostViews">>;

export default schema;
