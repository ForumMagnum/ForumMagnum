// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

/**
 * This collection is currently just used for targeting job ads on EAF.
 * Values are currently only changed via /scripts/importEAGUserInterests.
 */

const schema: Record<string, NewCollectionFieldSpecification<"UserEAGDetails">> = {
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
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ collectionName: "UserEAGDetails", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  careerStage: {
    database: {
      type: "TEXT[]",
      nullable: true,
    },
    graphql: {
      type: "[String]",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  countryOrRegion: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  nearestCity: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  willingnessToRelocate: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  experiencedIn: {
    database: {
      type: "TEXT[]",
      nullable: true,
    },
    graphql: {
      type: "[String]",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  interestedIn: {
    database: {
      type: "TEXT[]",
      nullable: true,
    },
    graphql: {
      type: "[String]",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
    },
  },
  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: [userOwns],
      canUpdate: [userOwns],
      canCreate: ["members"],
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },
};

export default schema;
