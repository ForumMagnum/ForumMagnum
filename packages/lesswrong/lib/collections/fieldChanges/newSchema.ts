// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "@/lib/utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"FieldChanges">> = {
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
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["members"],
      resolver: generateIdResolverSingle({ collectionName: "FieldChanges", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  changeGroup: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
    },
  },
  fieldName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
      canRead: ["members"],
    },
  },
  oldValue: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["members"],
    },
  },
  newValue: {
    database: {
      type: "JSONB",
    },
    graphql: {
      type: "JSON",
      canRead: ["members"],
    },
  },
};

export default schema;
