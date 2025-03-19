// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "../../../lib/utils/schemaUtils";

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
  token: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  tokenType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
  },
  user: {
    graphql: {
      outputType: "User!",
      canRead: [],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  usedAt: {
    database: {
      type: "TIMESTAMPTZ",
    },
  },
  params: {
    database: {
      type: "JSONB",
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"EmailTokens">>;

export default schema;
