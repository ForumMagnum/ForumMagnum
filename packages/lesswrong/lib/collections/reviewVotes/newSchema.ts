// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "../../utils/schemaUtils";

export const DEFAULT_QUALITATIVE_VOTE = 4;

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
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      onCreate: ({ currentUser }) => currentUser._id,
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  qualitativeScore: {
    database: {
      type: "INTEGER",
      defaultValue: 4,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  quadraticScore: {
    database: {
      type: "INTEGER",
      defaultValue: 0,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  comment: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  year: {
    database: {
      type: "TEXT",
      defaultValue: "2018",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
    },
  },
  dummy: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["guests"],
    },
  },
  reactions: {
    database: {
      type: "TEXT[]",
    },
    graphql: {
      outputType: "[String]",
      inputType: "[String]!",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ReviewVotes">>;

export default schema;
