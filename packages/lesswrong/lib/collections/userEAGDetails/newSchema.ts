import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

/**
 * This collection is currently just used for targeting job ads on EAF.
 * Values are currently only changed via /scripts/importEAGUserInterests.
 */

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
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
  // Looks like: {"Boston": "I'm unwilling or unable to move here"}
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
