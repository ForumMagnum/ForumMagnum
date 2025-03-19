// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "@/lib/utils/schemaUtils";

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
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      canRead: ["members"],
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
  changeGroup: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
    },
  },
  documentId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
    },
  },
  fieldName: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["members"],
    },
  },
  oldValue: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: ["members"],
    },
  },
  newValue: {
    database: {
      type: "JSONB",
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON!",
      canRead: ["members"],
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"FieldChanges">>;

export default schema;
