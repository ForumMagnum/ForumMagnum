// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { arrayOfForeignKeysOnCreate, generateIdResolverMulti } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"ClientIds">> = {
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
      canRead: ["admins"],
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
  clientId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  firstSeenReferrer: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  firstSeenLandingPage: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  userIds: {
    database: {
      type: "TEXT[]",
      defaultValue: [],
      canAutofillDefault: true,
      nullable: true,
    },
    graphql: {
      outputType: "[String]",
      inputType: "[String]!",
      canRead: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  users: {
    graphql: {
      outputType: "[User!]!",
      canRead: ["sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({ foreignCollectionName: "Users", fieldName: "userIds" }),
    },
  },
  invalidated: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  lastSeenAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  timesSeen: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
};

export default schema;
