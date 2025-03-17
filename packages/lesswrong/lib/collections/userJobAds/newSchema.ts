// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

const schema: Record<string, NewCollectionFieldSpecification<"UserJobAds">> = {
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
      canCreate: ["members"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ collectionName: "UserJobAds", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  jobName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canCreate: ["members"],
    },
  },
  adState: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: {
        allowedValues: ["seen", "expanded", "applied", "reminderSet"],
      },
    },
  },
  reminderSetAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
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
