// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { arrayOfForeignKeysOnCreate, generateIdResolverMulti, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"ClientIds">> = {
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
      canRead: ["admins"],
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
  clientId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  firstSeenReferrer: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: ["sunshineRegiment", "admins"],
    },
  },
  firstSeenLandingPage: {
    database: {
      type: "TEXT",
    },
    graphql: {
      type: "String",
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
      type: "[String]",
      canRead: ["sunshineRegiment", "admins"],
      onCreate: arrayOfForeignKeysOnCreate,
    },
  },
  users: {
    graphql: {
      type: "[User!]!",
      canRead: ["sunshineRegiment", "admins"],
      resolver: generateIdResolverMulti({ collectionName: "ClientIds", fieldName: "userIds" }),
    },
    form: {
      hidden: true,
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
      type: "Boolean",
      canRead: ["sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  lastSeenAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: ["sunshineRegiment", "admins"],
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
      type: "Float",
      canRead: ["sunshineRegiment", "admins"],
      onCreate: getFillIfMissing(1),
      onUpdate: throwIfSetToNull,
    },
  },
};

export default schema;
