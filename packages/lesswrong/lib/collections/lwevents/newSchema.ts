// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"LWEvents">> = {
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
      canRead: ["members"],
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
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ collectionName: "LWEvents", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  name: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  important: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["members"],
      canUpdate: ["admins"],
      canCreate: ["members"],
    },
  },
  properties: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
  intercom: {
    database: {
      type: "BOOL",
    },
    graphql: {
      type: "Boolean",
      canRead: ["members"],
      canCreate: ["members"],
    },
  },
};

export default schema;
