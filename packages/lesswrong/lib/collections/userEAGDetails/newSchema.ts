// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

/**
 * This collection is currently just used for targeting job ads on EAF.
 * Values are currently only changed via /scripts/importEAGUserInterests.
 */

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
      inputType: "String!",
      canRead: [userOwns, "admins"],
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  careerStage: {
    database: {
      type: "TEXT[]",
      nullable: true,
    },
    graphql: {
      outputType: "[String]",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  countryOrRegion: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  nearestCity: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  willingnessToRelocate: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  experiencedIn: {
    database: {
      type: "TEXT[]",
      nullable: true,
    },
    graphql: {
      outputType: "[String]",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  interestedIn: {
    database: {
      type: "TEXT[]",
      nullable: true,
    },
    graphql: {
      outputType: "[String]",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      validation: {
        optional: true,
      },
    },
  },
  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: [userOwns],
      canUpdate: [userOwns],
      canCreate: ["members"],
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"UserEAGDetails">>;

export default schema;
